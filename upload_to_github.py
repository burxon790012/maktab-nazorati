import os
import sys
import json
import base64
import urllib.request
import urllib.error
import subprocess

TOKEN = os.environ.get("GITHUB_TOKEN", "")
USERNAME = "burxon790012"
REPO_NAME = "maktab-nazorati"
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(WORKSPACE_DIR, "upload_log.txt")

def log(msg):
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def make_request(url, method="GET", data=None):
    headers = {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Antigravity-Uploader"
    }
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        return {"error_code": e.code, "error_msg": err_msg}

def ensure_repo_exists():
    log("1. GitHub foydalanuvchisi tekshirilmoqda...")
    user_info = make_request("https://api.github.com/user")
    if "error_code" in user_info:
        log(f"Xatolik: Token noto'g'ri yoki ruxsat yo'q: {user_info}")
        return False
    log(f"Tasdiqlandi: GitHub User = {user_info.get('login')}")

    log(f"2. Repozitoriy tekshirilmoqda: {USERNAME}/{REPO_NAME}...")
    repo_info = make_request(f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}")
    if "error_code" in repo_info and repo_info["error_code"] == 404:
        log("Repozitoriy topilmadi. Yangi repozitoriy yaratilmoqda...")
        create_payload = {
            "name": REPO_NAME,
            "description": "Maktab Nazorati Platformasi — Samsung Galaxy Watch5 Pro + Web Dashboard + Python/Node Backend + Flutter Ota-ona ilovasi",
            "private": False,
            "auto_init": False
        }
        created = make_request("https://api.github.com/user/repos", method="POST", data=create_payload)
        if "error_code" in created:
            log(f"Repozitoriy yaratishda xato: {created}")
            return False
        log("Repozitoriy muvaffaqiyatli yaratildi!")
    else:
        log("Repozitoriy allaqachon mavjud.")
    return True

def try_git_cli():
    log("3. Git CLI orqali yuklashga urinib ko'ramiz...")
    try:
        def run(cmd):
            res = subprocess.run(cmd, cwd=WORKSPACE_DIR, shell=True, capture_output=True, text=True)
            log(f"$ {cmd} -> code {res.returncode}")
            if res.stdout.strip(): log(f"OUT: {res.stdout.strip()}")
            if res.stderr.strip(): log(f"ERR: {res.stderr.strip()}")
            return res.returncode == 0

        run("git init")
        run(f"git config user.name \"{USERNAME}\"")
        run(f"git config user.email \"{USERNAME}@users.noreply.github.com\"")
        run("git checkout -B main")
        run("git add .")
        run("git commit -m \"Initial commit: Maktab Nazorati to'liq platformasi\"")
        remote_url = f"https://{USERNAME}:{TOKEN}@github.com/{USERNAME}/{REPO_NAME}.git"
        run("git remote remove origin")
        run(f"git remote add origin {remote_url}")
        success = run("git push -u origin main --force")
        return success
    except Exception as e:
        log(f"Git CLI xatosi: {e}")
        return False

def upload_via_api():
    log("4. GitHub REST API (Git Data API) orqali yuklash boshlandi...")
    files_to_upload = []
    ignored_patterns = [".git", "upload_log.txt", "upload_to_github.py", "__pycache__", ".gradle", "build", ".dart_tool", ".idea"]

    for root, dirs, files in os.walk(WORKSPACE_DIR):
        dirs[:] = [d for d in dirs if d not in ignored_patterns and not d.startswith(".")]
        for file in files:
            if any(ign in file for ign in [".pyc", ".lock"]) or file in ["upload_log.txt", "upload_to_github.py"]:
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, WORKSPACE_DIR).replace("\\", "/")
            files_to_upload.append((rel_path, full_path))

    log(f"Yuklanadigan fayllar soni: {len(files_to_upload)} ta.")

    # Fayllarni blob sifatida yuklash
    tree_items = []
    for rel_path, full_path in files_to_upload:
        try:
            with open(full_path, "rb") as f:
                content = f.read()
            b64_content = base64.b64encode(content).decode("utf-8")
            blob_resp = make_request(
                f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/git/blobs",
                method="POST",
                data={"content": b64_content, "encoding": "base64"}
            )
            if "sha" in blob_resp:
                tree_items.append({
                    "path": rel_path,
                    "mode": "100644",
                    "type": "blob",
                    "sha": blob_resp["sha"]
                })
                log(f"  [OK] {rel_path}")
            else:
                log(f"  [FAIL] {rel_path}: {blob_resp}")
        except Exception as e:
            log(f"  [ERR] {rel_path}: {e}")

    # Tree yaratish
    log("Daraxt (Git Tree) yaratilmoqda...")
    tree_resp = make_request(
        f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/git/trees",
        method="POST",
        data={"tree": tree_items}
    )
    if "sha" not in tree_resp:
        log(f"Tree yaratishda xato: {tree_resp}")
        return False
    tree_sha = tree_resp["sha"]
    log(f"Tree SHA: {tree_sha}")

    # Mavjud oxirgi commitni olish (agar bo'lsa)
    ref_info = make_request(f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/git/refs/heads/main")
    parent_sha = None
    if "object" in ref_info:
        parent_sha = ref_info["object"]["sha"]
        log(f"Mavjud ota-commit: {parent_sha}")

    # Commit yaratish
    log("Commit yaratilmoqda...")
    commit_payload = {
        "message": "Maktab Nazorati Platformasi — Galaxy Watch5 Pro + Backend + Parent App",
        "tree": tree_sha,
        "parents": [parent_sha] if parent_sha else []
    }
    commit_resp = make_request(
        f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/git/commits",
        method="POST",
        data=commit_payload
    )
    if "sha" not in commit_resp:
        log(f"Commit yaratishda xato: {commit_resp}")
        return False
    commit_sha = commit_resp["sha"]
    log(f"Commit yaratildi: {commit_sha}")

    # Ref yangilash (yoki yaratish)
    log("Branch ref yangilanmoqda...")
    if parent_sha:
        ref_update = make_request(
            f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/git/refs/heads/main",
            method="PATCH",
            data={"sha": commit_sha, "force": True}
        )
    else:
        ref_update = make_request(
            f"https://api.github.com/repos/{USERNAME}/{REPO_NAME}/git/refs",
            method="POST",
            data={"ref": "refs/heads/main", "sha": commit_sha}
        )

    log(f"Ref natijasi: {ref_update}")
    return True

if __name__ == "__main__":
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    log("=== GitHub Yuklash Boshlandi ===")
    if ensure_repo_exists():
        if not try_git_cli():
            log("Git CLI orqali bo'lmadi, API orqali yuklanadi...")
            upload_via_api()
    log("=== Yuklash Jarayoni Tugadi ===")
