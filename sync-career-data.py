"""Copy personal-career-db/data/*.json into Personal_Website/data/ (run after editing the career DB)."""
from __future__ import annotations

import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "personal-career-db" / "data"
DST = HERE / "data"

FILES = ("profile.json", "experiences.json", "bullets.json")


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        s, d = SRC / name, DST / name
        if not s.is_file():
            print("skip (missing):", s)
            continue
        shutil.copy2(s, d)
        print("copied", name)


if __name__ == "__main__":
    main()
