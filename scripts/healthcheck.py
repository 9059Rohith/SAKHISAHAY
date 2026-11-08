"""Fail deployment checks when the public API is unhealthy or not ready."""
import sys
import urllib.request

base = sys.argv[1].rstrip("/")
for path in ("/health", "/ready", "/version"):
    with urllib.request.urlopen(base + path, timeout=20) as response:
        assert response.status == 200
        print(path, response.status)
