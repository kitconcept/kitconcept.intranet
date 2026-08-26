# AI search test corpus ("Deutsches Forschungszentrum für Nachhaltige Technologien")

A German-language test corpus for the AI search (RAG) feature, in
[plone.exportimport](https://github.com/plone/plone.exportimport)
format: 439 content objects (including Persons, Organisational Units
and Locations), ~100 images, 98 relations, 7 fictional users.

It is a curated copy of the fictional intranet demo site
`plone-intranet.kitconcept.io` — a research-institute intranet with the
sections Aktuelles, Arbeitsthemen, Forschung, Services, Über uns and
Community — that carries far more long-form German knowledge content
(400+ how-to and documentation pages) than the standard example
content in `../content`. That textual depth is what the RAG feature
needs. This is the **native-blocks variant**: volto-light-theme blocks
(introduction, highlight, banner, slider, …) are kept as-is.

**This corpus is NOT imported by default.** It is a second, optional
content set for developing and testing the AI search. It shares
ancestry with the standard example content (32 objects have the same
UIDs at different paths), so it must be imported into a **fresh site
created without the standard example content** — never on top of it.

## Usage

Requires a Solr with the RAG chunk schema (the `feature-ai-rag` image,
see `docker-compose-dev.yml`) and — for indexing and answers — the LLM
credentials in the environment (see below); without credentials the
site works with classic search only.

### 1. Get your LLM credentials

The feature connects to the kitconcept Genie server (Open WebUI; ask
the team for the URL if you do not have it). Create your own API key:

1. Log in to the Genie web UI and open **Settings → Account → API
   keys**, then **Create new secret key** (an `sk-...` value).
   Careful: creating a new key **invalidates your previous one**.
2. Put the credentials in a file outside the repository, e.g.
   `~/.config/kitconcept-solr-llm.env`:

   ```sh
   export KITCONCEPT_SOLR_LLM_URL=https://<the-genie-server>
   export KITCONCEPT_SOLR_LLM_TOKEN=sk-...
   ```

3. `source` that file in every shell that runs the backend or a
   reindex — the credentials are read from the process environment.

If every request fails with `403 "Use of API key is not enabled in
the environment"`, the server-side **Enable API Key** admin setting is
off (it has been lost in a server reinstall before) — an admin must
re-enable and save it; your key itself stays valid.

### 2. Create the site, import, index

```sh
make solr-start                       # from the repository root
cd backend
ANSWERS=ai-testing.json DELETE_EXISTING=1 make create-site
make import-ai-content
source ~/.config/kitconcept-solr-llm.env   # your credentials file
make solr-activate-and-reindex-with-rag-clear
```

`scripts/ai-testing.json` creates the site without the standard
example content. `import-ai-content` runs the stock `plone-importer`
and then aligns the demo users' passwords: the same fictional users
may already exist on the site (the standard example content ships
them too), in which case the corpus principals import skips them —
the password script guarantees the documented password either way.

### 3. Start the servers

```sh
source ~/.config/kitconcept-solr-llm.env
make start                            # backend on localhost:8080
# in a second shell:
cd ../frontend && pnpm start          # frontend on localhost:3000
```

Search for anything (e.g. a question from `questions.json`): the AI
answer renders above the classic results. Without credentials the
`@site` endpoint reports `kitconcept.solr.rag_available: false` and
the classic search works unchanged.

## Example users

All users share the password `intranet-demo-2026` (fictional accounts,
demo purposes only). `f.meier` is a plain Member and the reference
user for permission-trimming tests: three documents are in the
`private` review state (Betriebsrat, Gleichstellungsbeauftragte, one
unpublished news item) and must not appear in search results or AI
answers for this user.

## Golden questions

`questions.json` holds ~20 hand-written German questions with expected
source documents, including two questions the corpus cannot answer
(the system must decline) and one permission-sensitive question.

## Developing against a local kitconcept.solr checkout

The branch installs kitconcept.solr from its git feature branch. To
consume a local working copy instead (live edits, no reinstalls),
apply these overrides — **do not commit them**, they only work on your
machine:

- `backend/pyproject.toml`, `[tool.uv.sources]`:
  `kitconcept-solr = { path = "/path/to/kitconcept.solr/backend", editable = true }`
  then `uv sync`.
- `frontend/package.json`, pnpm overrides:
  `"@kitconcept/volto-solr": "link:/path/to/kitconcept.solr/frontend/packages/volto-solr"`
  then `pnpm i`. (`link:`, not `file:` — `file:` copies the package,
  `link:` symlinks it so changes hot-reload.)

This dirties `pyproject.toml`, `uv.lock`, `package.json` and
`pnpm-lock.yaml`; restore them with `git checkout --` plus
`uv sync` / `pnpm i` before committing anything else.

## Provenance

The corpus is generated from a preserved crawl of the demo site by a
transform pipeline (`transform_corpus.py`, kept outside this
repository with the raw crawl); the `intranet` variant of that
pipeline produced the import from which this dump was round-tripped
with the official `plone-exporter`. The same pipeline's `solr` variant
produces the corpus bundled with kitconcept.solr (volto-light-theme
blocks mapped to Volto core blocks there).
