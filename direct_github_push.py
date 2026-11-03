import urllib.request
import json
import base64
import os

TOKEN = os.environ.get("GITHUB_TOKEN", "")
OWNER = "burxon790012"
REPO = "maktab-nazorati"

files = [
    ("backend/public/index.html", "backend/public/index.html"),
    ("backend/server.js", "backend/server.js"),
    ("backend/server.py", "backend/server.py"),
    ("backend/render.yaml", "backend/render.yaml"),
    ("backend/DEPLOY.md", "backend/DEPLOY.md"),
    ("backend/.env.example", "backend/.env.example"),
    (".env.example", ".env.example"),
    ("push_to_github.sh", "push_to_github.sh"),
]

base_dir = os.path.dirname(os.path.abspath(__file__))

def get_file_sha(path):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AntigravityDirectPush"
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get("sha")
    except Exception as e:
        return None

def update_file(repo_path, local_rel_path):
    local_path = os.path.join(base_dir, local_rel_path)
    if not os.path.exists(local_path):
        return f"File {local_path} not found"
    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    
    sha = get_file_sha(repo_path)
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{repo_path}"
    payload = {
        "message": f"Fix: Update {repo_path} - OpenStreetMap fallback to eliminate API KEY REQUIRED watermark",
        "content": content,
        "branch": "main"
    }
    if sha:
        payload["sha"] = sha

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "AntigravityDirectPush"
    }, method="PUT")

    try:
        with urllib.request.urlopen(req) as resp:
            return f"OK: {resp.status}"
    except urllib.error.HTTPError as e:
        return f"HTTPError {e.code}: {e.read().decode('utf-8')}"
    except Exception as e:
        return f"Error: {e}"

results = {}
for repo_path, local_path in files:
    res = update_file(repo_path, local_path)
    results[repo_path] = res

with open(os.path.join(base_dir, "push_result.json"), "w", encoding="utf-8") as out:
    json.dump(results, out, indent=2)

print("Push complete:", results)
