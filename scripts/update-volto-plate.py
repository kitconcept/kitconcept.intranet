#!/usr/bin/env python3
"""Sync ``kitconcept/volto-plate`` artifacts into the intranet repo.

Downloads the upstream source archive **once** from
``https://github.com/<owner>/<repo>/archive/refs/tags/<tag>.tar.gz`` and
serves both tracks from those bytes:

* **Frontend** — extracts ``<prefix>/frontend/artifacts/kitconcept-volto-plate.tgz``
  (looked up by exact filename) and writes it to
  ``frontend/artifacts/kitconcept-volto-plate.tgz``. Then rewrites the
  matching dependency entry in ``frontend/packages/gmbh-intranet/package.json``.
* **Backend** — keeps only the ``backend/`` subtree, repacks it as
  ``kitconcept-plate.tar.gz`` (top-level directory renamed to
  ``kitconcept-plate``), drops it into ``backend/container/``, and rewrites
  (or inserts) the ``kitconcept-plate`` source entry under
  ``[tool.uv.sources]`` in ``backend/pyproject.toml`` to point at it. Then
  refreshes ``backend/uv.lock`` so the locked ``kitconcept-plate`` version
  matches the freshly pulled backend artifact.

Both local artifact filenames are unversioned so consumer manifests
(``package.json`` and ``pyproject.toml``) hold stable file references across
syncs — the only thing that changes between syncs is the file contents.

After both tracks are updated, the script runs ``make install`` in the repo
root so the working tree is reinstalled against the synced artifacts.

Usage::

    uv run update-volto-plate.py [--tag <git-tag>]

If ``--tag`` is omitted, the most recent tag from the upstream repository is
used. ``kitconcept/volto-plate`` is a private repository, so a
``GITHUB_TOKEN`` (or ``GH_TOKEN``) environment variable is required.
"""

import argparse
import io
import json
import os
import re
import subprocess
import sys
import tarfile
import urllib.error
import urllib.request
from pathlib import Path

OWNER = "kitconcept"
REPO = "volto-plate"
PACKAGE_NAME = "@kitconcept/volto-plate"
ASSET_STEM = "kitconcept-volto-plate"
ASSET_SUFFIX = ".tgz"
FRONTEND_ARTIFACT_NAME = f"{ASSET_STEM}{ASSET_SUFFIX}"

BACKEND_PACKAGE_NAME = "kitconcept-plate"
BACKEND_ASSET_STEM = "kitconcept-plate"
BACKEND_ASSET_SUFFIX = ".tar.gz"
BACKEND_ARTIFACT_NAME = f"{BACKEND_ASSET_STEM}{BACKEND_ASSET_SUFFIX}"

GITHUB_API = "https://api.github.com"

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"
BACKEND_ARTIFACTS_DIR = BACKEND_DIR / "container"
BACKEND_PYPROJECT_PATH = BACKEND_DIR / "pyproject.toml"
FRONTEND_DIR = ROOT_DIR / "frontend"
FRONTEND_ARTIFACTS_DIR = FRONTEND_DIR / "artifacts"
ADDON_PACKAGE_JSON_PATH = (
    FRONTEND_DIR / "packages" / "kitconcept-intranet" / "package.json"
)


def github_token() -> str | None:
    """Return the GitHub token from the environment, if one is configured."""
    return os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")


def github_headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    """Build the standard headers used for every GitHub API request.

    :param extra: Additional headers merged on top of the defaults.
    :returns: Header mapping suitable for :class:`urllib.request.Request`.
    """
    headers: dict[str, str] = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "kitconcept-intranet-artifact-sync",
    }
    token = github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra:
        headers.update(extra)
    return headers


def github_request(url: str, *, headers: dict[str, str] | None = None) -> bytes:
    """Perform an authenticated GitHub request and return the response body.

    :param url: Absolute URL to request.
    :param headers: Optional extra headers merged with the defaults.
    :returns: Raw response bytes.
    :raises RuntimeError: If the response status is not in the 2xx range.
    """
    request = urllib.request.Request(url, headers=github_headers(headers))
    try:
        with urllib.request.urlopen(request) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"GitHub request failed ({exc.code} {exc.reason}) for {url}\n{body}"
        ) from exc


def get_tag(requested_tag: str | None) -> str:
    """Resolve the tag to sync, falling back to the latest GitHub tag.

    :param requested_tag: Explicit tag override, or ``None`` to use latest.
    :returns: The resolved tag name.
    :raises RuntimeError: If no tags are available upstream.
    """
    if requested_tag:
        return requested_tag

    body = github_request(f"{GITHUB_API}/repos/{OWNER}/{REPO}/tags?per_page=20")
    tags = json.loads(body)
    if not isinstance(tags, list) or not tags:
        raise RuntimeError(f"No tags found for {OWNER}/{REPO}.")
    return tags[0]["name"]


def remove_existing_artifacts() -> None:
    """Delete previously synced frontend tarballs from ``FRONTEND_ARTIFACTS_DIR``.

    Matches both the unversioned ``kitconcept-volto-plate.tgz`` (current
    naming) and any legacy ``kitconcept-volto-plate-<version>.tgz`` files
    that may still be around.
    """
    FRONTEND_ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    for entry in FRONTEND_ARTIFACTS_DIR.iterdir():
        if entry.name.startswith(ASSET_STEM) and entry.name.endswith(ASSET_SUFFIX):
            entry.unlink()


def extract_frontend_artifact(source_bytes: bytes) -> Path:
    """Extract the frontend ``.tgz`` artifact from the source tarball.

    Looks for ``<repo-prefix>/frontend/artifacts/kitconcept-volto-plate.tgz``
    (exact filename) inside the source archive and writes its bytes to
    ``FRONTEND_ARTIFACTS_DIR/kitconcept-volto-plate.tgz``. Any prior
    ``kitconcept-volto-plate*.tgz`` in that directory is removed first
    (covers both the unversioned name and any legacy versioned files).

    :param source_bytes: Raw bytes of the GitHub source archive.
    :returns: Path to the extracted ``.tgz`` file.
    :raises RuntimeError: If the expected artifact is missing.
    """
    with tarfile.open(fileobj=io.BytesIO(source_bytes), mode="r:gz") as src:
        members = src.getmembers()

        top_levels = {m.name.split("/", 1)[0] for m in members if m.name}
        if len(top_levels) != 1:
            raise RuntimeError(
                "Source tarball does not have a single top-level directory; "
                f"found: {sorted(top_levels)}"
            )
        repo_prefix = next(iter(top_levels))
        artifacts_prefix = f"{repo_prefix}/frontend/artifacts/"
        member_name = f"{artifacts_prefix}{FRONTEND_ARTIFACT_NAME}"

        member = next((m for m in members if m.name == member_name), None)
        if member is None or not member.isfile():
            available = sorted(
                m.name[len(artifacts_prefix) :]
                for m in members
                if m.name.startswith(artifacts_prefix)
                and m.isfile()
                and m.name.endswith(ASSET_SUFFIX)
            )
            detail = (
                f"Other .tgz files there: {', '.join(available)}"
                if available
                else "No .tgz files were found under that directory."
            )
            raise RuntimeError(
                f"Expected {member_name} inside the source archive, "
                f"but it was not found.\n{detail}"
            )

        extracted = src.extractfile(member)
        if extracted is None:
            raise RuntimeError(f"Could not read {member.name} from the source archive.")
        data = extracted.read()

    remove_existing_artifacts()
    artifact_path = FRONTEND_ARTIFACTS_DIR / FRONTEND_ARTIFACT_NAME
    artifact_path.write_bytes(data)
    return artifact_path


def update_dependency(artifact_path: Path) -> str:
    """Rewrite the gmbh-intranet ``package.json`` to point at ``artifact_path``.

    :param artifact_path: Path to the freshly downloaded artifact.
    :returns: The new dependency value (``file:<relative-path>``).
    """
    package_json = json.loads(ADDON_PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    relative_artifact_path = os.path.relpath(
        artifact_path, ADDON_PACKAGE_JSON_PATH.parent
    ).replace(os.sep, "/")
    dependency_value = f"file:{relative_artifact_path}"
    package_json["dependencies"][PACKAGE_NAME] = dependency_value
    ADDON_PACKAGE_JSON_PATH.write_text(
        json.dumps(package_json, indent=2) + "\n", encoding="utf-8"
    )
    return dependency_value


def download_source_tarball(tag: str) -> bytes:
    """Download the ``kitconcept/volto-plate`` source archive for ``tag``.

    Hits ``https://github.com/<owner>/<repo>/archive/refs/tags/<tag>.tar.gz``,
    which returns a 302 to a short-lived ``codeload.github.com`` URL.
    ``urllib`` follows the redirect transparently; the auth header is
    harmless on the signed redirect target and required on the initial GET
    for private repositories.

    :param tag: Tag name to fetch.
    :returns: Raw ``.tar.gz`` bytes.
    :raises RuntimeError: If the download fails.
    """
    url = f"https://github.com/{OWNER}/{REPO}/archive/refs/tags/{tag}.tar.gz"
    request = urllib.request.Request(url, headers=github_headers())
    try:
        with urllib.request.urlopen(request) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Source archive download failed ({exc.code} {exc.reason}) "
            f"for {url}\n{body}"
        ) from exc


def remove_existing_backend_artifacts() -> None:
    """Delete previously synced backend tarballs from ``BACKEND_ARTIFACTS_DIR``.

    Matches both the unversioned ``kitconcept-plate.tar.gz`` (current naming)
    and any legacy ``kitconcept-plate-<version>.tar.gz`` files that may still
    be around.
    """
    BACKEND_ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    for entry in BACKEND_ARTIFACTS_DIR.iterdir():
        if entry.name.startswith(BACKEND_ASSET_STEM) and entry.name.endswith(
            BACKEND_ASSET_SUFFIX
        ):
            entry.unlink()


def repack_backend(source_bytes: bytes) -> Path:
    """Repack the ``backend/`` subtree as a ``kitconcept-plate`` sdist.

    Reads the source archive in-memory, keeps only members whose path is
    under ``<repo-prefix>/backend/``, rewrites that prefix to
    ``kitconcept-plate/``, and writes a fresh ``.tar.gz`` to
    ``BACKEND_ARTIFACTS_DIR/kitconcept-plate.tar.gz``. Any existing
    ``kitconcept-plate*.tar.gz`` in that directory is removed first.

    :param source_bytes: Raw bytes of the GitHub source archive.
    :returns: Path to the freshly written backend tarball.
    :raises RuntimeError: If the archive does not contain a ``backend/``
        subtree under a single top-level directory.
    """
    output_path = BACKEND_ARTIFACTS_DIR / BACKEND_ARTIFACT_NAME

    with tarfile.open(fileobj=io.BytesIO(source_bytes), mode="r:gz") as src:
        members = src.getmembers()

        top_levels = {m.name.split("/", 1)[0] for m in members if m.name}
        if len(top_levels) != 1:
            raise RuntimeError(
                "Source tarball does not have a single top-level directory; "
                f"found: {sorted(top_levels)}"
            )
        repo_prefix = next(iter(top_levels))
        backend_prefix = f"{repo_prefix}/backend/"

        backend_members = [m for m in members if m.name.startswith(backend_prefix)]
        if not backend_members:
            raise RuntimeError(f"No 'backend/' subtree found inside {repo_prefix}/.")

        remove_existing_backend_artifacts()

        with tarfile.open(output_path, mode="w:gz") as dst:
            for member in backend_members:
                new_name = (
                    f"{BACKEND_PACKAGE_NAME}/" + member.name[len(backend_prefix) :]
                )
                if not new_name.rstrip("/"):
                    continue
                rewritten = tarfile.TarInfo(name=new_name)
                rewritten.size = member.size
                rewritten.mtime = member.mtime
                rewritten.mode = member.mode
                rewritten.type = member.type
                rewritten.linkname = member.linkname
                rewritten.uid = 0
                rewritten.gid = 0
                rewritten.uname = ""
                rewritten.gname = ""
                if member.isfile():
                    extracted = src.extractfile(member)
                    dst.addfile(rewritten, extracted)
                else:
                    dst.addfile(rewritten)

    return output_path


def update_backend_dependency(artifact_path: Path) -> str:
    """Rewrite (or insert) the ``kitconcept-plate`` line in backend ``pyproject.toml``.

    Within ``[tool.uv.sources]``, replaces an existing
    ``kitconcept-plate = { ... }`` line with a local
    ``path = "container/<file>"`` form, or appends a fresh one at the end of
    the section's content when no such line exists. ``[project].dependencies``
    is intentionally left alone — that declaration must already be in place
    for ``uv`` to pick up this source.

    :param artifact_path: Path to the freshly built backend tarball.
    :returns: The new dependency value (the right-hand side of the assignment).
    :raises RuntimeError: If the ``[tool.uv.sources]`` section is missing.
    """
    relative_artifact_path = os.path.relpath(
        artifact_path, BACKEND_PYPROJECT_PATH.parent
    ).replace(os.sep, "/")
    new_line = f'{BACKEND_PACKAGE_NAME} = {{ path = "{relative_artifact_path}" }}'
    new_value = new_line.split("=", 1)[1].strip()

    text = BACKEND_PYPROJECT_PATH.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)

    section_header_re = re.compile(r"^\[tool\.uv\.sources\]\s*$")
    next_section_re = re.compile(r"^\[")
    package_line_re = re.compile(rf"^{re.escape(BACKEND_PACKAGE_NAME)}\s*=")

    section_idx = next(
        (i for i, line in enumerate(lines) if section_header_re.match(line)),
        None,
    )
    if section_idx is None:
        raise RuntimeError(
            f"Could not find a '[tool.uv.sources]' section in {BACKEND_PYPROJECT_PATH}."
        )

    end_idx = next(
        (
            i
            for i in range(section_idx + 1, len(lines))
            if next_section_re.match(lines[i])
        ),
        len(lines),
    )

    for i in range(section_idx + 1, end_idx):
        if package_line_re.match(lines[i]):
            lines[i] = new_line + "\n"
            BACKEND_PYPROJECT_PATH.write_text("".join(lines), encoding="utf-8")
            return new_value

    insert_at = end_idx
    while insert_at > section_idx + 1 and lines[insert_at - 1].strip() == "":
        insert_at -= 1
    lines.insert(insert_at, new_line + "\n")
    BACKEND_PYPROJECT_PATH.write_text("".join(lines), encoding="utf-8")
    return new_value


def run_command(args: list[str], *, cwd: Path) -> None:
    """Run a command in ``cwd`` and raise ``RuntimeError`` on failure.

    :param args: Command and arguments to execute.
    :param cwd: Working directory for the subprocess.
    :raises RuntimeError: If the command exits with a non-zero status.
    """
    try:
        subprocess.run(args, cwd=cwd, check=True)
    except subprocess.CalledProcessError as exc:
        command = " ".join(args)
        raise RuntimeError(f"Command failed ({exc.returncode}): {command}") from exc


def refresh_backend_lock() -> None:
    """Refresh ``backend/uv.lock`` for the synced backend artifact."""
    run_command(
        ["uv", "lock", "--upgrade-package", BACKEND_PACKAGE_NAME],
        cwd=BACKEND_DIR,
    )


def install_repo() -> None:
    """Run ``make install`` in the repo root."""
    run_command(["make", "install"], cwd=ROOT_DIR)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments.

    :param argv: Argument list (``sys.argv[1:]`` when ``None``).
    :returns: Namespace with a ``tag`` attribute (``str | None``).
    """
    parser = argparse.ArgumentParser(
        description="Sync the latest @kitconcept/volto-plate artifact."
    )
    parser.add_argument(
        "--tag",
        default=None,
        help="Specific tag to sync. Defaults to the most recent tag.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Run the artifact sync and reinstall workflow.

    :param argv: Optional argument override (useful for tests).
    :returns: Process exit code.
    """
    args = parse_args(argv)
    try:
        tag = get_tag(args.tag)
        source_bytes = download_source_tarball(tag)

        artifact_path = extract_frontend_artifact(source_bytes)
        dependency_value = update_dependency(artifact_path)

        backend_artifact_path = repack_backend(source_bytes)
        backend_dependency_value = update_backend_dependency(backend_artifact_path)
        refresh_backend_lock()
        install_repo()
    except (RuntimeError, urllib.error.URLError, OSError, tarfile.TarError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Synced {PACKAGE_NAME}")
    print(f"Tag: {tag}")
    print(f"Frontend artifact: {artifact_path.relative_to(FRONTEND_DIR)}")
    print(f"Frontend dependency: {dependency_value}")
    print(f"Backend artifact: {backend_artifact_path.relative_to(BACKEND_DIR)}")
    print(f"Backend dependency: {BACKEND_PACKAGE_NAME} = {backend_dependency_value}")
    print("Backend lock: uv.lock refreshed")
    print("Install: make install")
    return 0


if __name__ == "__main__":
    sys.exit(main())
