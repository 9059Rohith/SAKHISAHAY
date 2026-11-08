"""Scan tracked source for secret-shaped values; print filenames, never matches."""
import re
import subprocess
from pathlib import Path

patterns = [re.compile(rb"sk-proj-[A-Za-z0-9_-]{30,}"), re.compile(rb"mongodb(?:\+srv)?://[^\s:]+:[^\s@]{6,}@"), re.compile(rb"gh[pousr]_[A-Za-z0-9]{30,}")]
files = subprocess.check_output(["git", "ls-files", "-z"]).split(b"\0")
bad = []
for file in files:
    if not file:
        continue
    path = Path(file.decode("utf-8"))
    if path.is_file() and path.suffix not in {".png", ".webp", ".woff", ".woff2"}:
        data = path.read_bytes()
        if any(p.search(data) for p in patterns):
            bad.append(str(path))
if bad:
    print("Secret-shaped values found in: " + ", ".join(bad))
    raise SystemExit(1)
print(f"Secret scan passed: {len(files)-1} tracked files")
