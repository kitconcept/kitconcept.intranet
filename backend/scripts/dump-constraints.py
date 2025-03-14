from pathlib import Path

import argparse
import tomllib


def main(pyproject_toml: Path, constraints_txt: Path):
    package_data = tomllib.loads(pyproject_toml.read_text())
    constraints = package_data["tool"]["uv"]["constraint-dependencies"]
    with open(constraints_txt, "w") as fout:
        for item in constraints:
            fout.write(f"{item}\n")
    print(f"Wrote constraints to {constraints_txt}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser("dump-constraints")
    parser.add_argument("pyproject", help="Path to pyproject.toml", type=Path)
    parser.add_argument(
        "constraints", help="Path to the new constraints.txt file", type=Path
    )
    args = parser.parse_args()
    pyproject_toml = args.pyproject.resolve()
    constraints_txt = args.constraints.resolve()
    main(pyproject_toml, constraints_txt)
