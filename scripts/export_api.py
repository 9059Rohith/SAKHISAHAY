"""Export OpenAPI and a Postman collection without connecting to the database."""
import json
from pathlib import Path

from backend.app.core.config import Settings
from backend.app.main import create_app

app = create_app(Settings(_env_file=None, app_env="test"))
schema = app.openapi()
Path("docs/openapi.json").write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
items = []
for path, methods in schema["paths"].items():
    for method, spec in methods.items():
        if method not in {"get", "post", "patch", "delete"}:
            continue
        request = {"method": method.upper(), "header": [{"key": "X-CSRF-Token", "value": "{{csrf_token}}"}], "url": "{{base_url}}" + path}
        if "requestBody" in spec:
            request["header"].append({"key": "Content-Type", "value": "application/json"})
            request["body"] = {"mode": "raw", "raw": "{}", "options": {"raw": {"language": "json"}}}
        items.append({"name": spec.get("summary", path), "request": request})
collection = {"info": {"name": "SakhiSahay API", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"}, "variable": [{"key": "base_url", "value": "http://localhost:8000"}, {"key": "csrf_token", "value": "read-csrf_token-cookie-after-login"}], "item": items}
Path("docs/postman.json").write_text(json.dumps(collection, indent=2) + "\n", encoding="utf-8")
print(f"Exported {len(items)} API operations")
