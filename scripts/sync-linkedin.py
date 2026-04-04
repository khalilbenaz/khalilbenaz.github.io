#!/usr/bin/env python3
"""
LinkedIn → Blog incremental sync via linkedin-scraper-mcp.

Usage:
    python3 scripts/sync-linkedin.py                  # Dry run (show new posts)
    python3 scripts/sync-linkedin.py --apply          # Write to posts.json
    python3 scripts/sync-linkedin.py --apply --push   # Write + git commit & push

Requires: uvx, linkedin-scraper-mcp (with authenticated profile in ~/.linkedin-mcp/)
"""

import json, re, hashlib, subprocess, sys, time, os
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
POSTS_FILE = REPO_DIR / "posts.json"
MCP_PORT = 8765
LINKEDIN_USERNAME = "khalilbenazzouz"
BASE_URL = f"http://127.0.0.1:{MCP_PORT}/mcp"

# --- MCP Client ---

session_id = None

def mcp_call(method, params=None, mid=1):
    global session_id
    payload = {"jsonrpc": "2.0", "id": mid, "method": method}
    if params:
        payload["params"] = params
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id
    req = urllib.request.Request(
        BASE_URL, data=json.dumps(payload).encode(), headers=headers
    )
    resp = urllib.request.urlopen(req, timeout=120)
    sid = resp.headers.get("Mcp-Session-Id")
    if sid:
        session_id = sid
    raw = resp.read().decode()
    for line in raw.split("\n"):
        if line.startswith("data: "):
            return json.loads(line[6:])
    return raw


def mcp_init():
    mcp_call(
        "initialize",
        {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "sync-linkedin", "version": "1.0"},
        },
    )
    # Send initialized notification
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id
    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}).encode(),
        headers=headers,
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def mcp_tool(name, arguments, mid=2):
    r = mcp_call("tools/call", {"name": name, "arguments": arguments}, mid=mid)
    result = r.get("result", {})
    if result.get("isError"):
        raise RuntimeError(result["content"][0]["text"])
    return result["content"][0]["text"]


# --- MCP Server lifecycle ---

def start_mcp_server():
    print("[*] Starting linkedin-scraper-mcp server...")
    proc = subprocess.Popen(
        [
            "uvx", "--python", "3.12", "linkedin-scraper-mcp@latest",
            "--transport", "streamable-http",
            "--port", str(MCP_PORT),
            "--timeout", "15000",
            "--log-level", "WARNING",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    # Wait for server to be ready
    for _ in range(15):
        time.sleep(2)
        try:
            mcp_init()
            print("[+] MCP server ready")
            return proc
        except Exception:
            continue
    raise RuntimeError("MCP server failed to start")


def stop_mcp_server(proc):
    proc.terminate()
    proc.wait(timeout=5)
    print("[*] MCP server stopped")


# --- Post parsing ---

def parse_posts(posts_text):
    today = datetime.now()
    markers = list(re.finditer(r"Post du fil d.actualité numéro (\d+)", posts_text))
    posts = []

    for idx, m in enumerate(markers):
        start = m.end()
        end = markers[idx + 1].start() if idx + 1 < len(markers) else len(posts_text)
        block = posts_text[start:end].strip()

        # Date
        time_match = re.search(r"Il y a (\d+) jours?", block)
        if time_match:
            days_ago = int(time_match.group(1))
            post_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        else:
            post_date = today.strftime("%Y-%m-%d")

        # Content extraction
        content_lines = []
        recording = False
        for line in block.split("\n"):
            if "Visible de tous" in line or (recording is False and "Modifié" in line):
                recording = True
                continue
            if recording and line.strip() in ("J'aime", "Commenter", "Republier", "Envoyer", ""):
                if content_lines:
                    break
                continue
            if recording and re.match(r"^\d+ impression", line):
                break
            if recording and "Activez pour voir" in line:
                continue
            if recording:
                content_lines.append(line)

        content = "\n".join(content_lines).strip()
        content = re.sub(r"… plus\s*$", "", content).strip()

        if not content or len(content) < 10:
            continue

        # Hashtags
        tags = list(set(re.findall(r"#(\w+)", content)))
        content_clean = re.sub(r"hashtag\s*\n?", "", content)

        # Title
        lines = [l.strip() for l in content_clean.split("\n") if l.strip()]
        title = lines[0] if lines else f"Post {idx + 1}"
        title = re.sub(r"^[^\w]*", "", title).strip()
        if len(title) > 120:
            title = title[:117] + "..."

        # Auto-tag
        cl = (title + " " + content_clean).lower()
        auto_tags = set(t.upper() for t in tags if len(t) > 1)
        tag_rules = {
            "FINTECH": ["paiement", "payment", "fintech", "banque", "bank", "naps", "damane", "paypal", "wallet"],
            "MAROC": ["maroc", "marocain", "rabat", "bam", "morocc", "casablanca"],
            "IA": ["chatgpt", "openai", "claude", "gemini", "perplexity", "llm", "intelligence artificielle", " ai "],
            "DEV": ["github", "developer", "coding", "devops", "mcp", ".net", "docker", "open source"],
            "TELECOM": ["5g", "telecom", "starlink", "orange"],
            "SECURITE": ["sécurité", "security", "scam", "piège", "attaque", "vulnerability"],
            "TECH": ["tesla", "xiaomi", "apple", "spotify", "chrome", "vpn"],
            "GOOGLE": ["google"],
            "CLOUD": ["cloud", "cloudflare", "aws", "azure"],
        }
        for tag, keywords in tag_rules.items():
            if any(k in cl for k in keywords):
                auto_tags.add(tag)

        # Stable ID based on content
        post_id = hashlib.md5((title + post_date).encode()).hexdigest()[:8]

        # Clean excerpt
        excerpt = content_clean.strip()
        excerpt = re.sub(r"\n\d+\n\d+ republication.*$", "", excerpt, flags=re.DOTALL).strip()
        excerpt = re.sub(r"\n\d+$", "", excerpt).strip()

        posts.append({
            "id": post_id,
            "title": title,
            "url": f"https://www.linkedin.com/in/{LINKEDIN_USERNAME}/recent-activity/all/",
            "excerpt": excerpt,
            "tags": sorted(list(auto_tags)),
            "date": post_date,
        })

    return posts


# --- Deduplication ---

def content_fingerprint(post):
    """Stable fingerprint: first 80 chars of title, normalized."""
    return re.sub(r"\s+", " ", post["title"].lower().strip())[:80]


def merge_posts(existing, new_posts):
    """Merge new posts into existing, skip duplicates. Returns (merged, added_count)."""
    seen = {content_fingerprint(p) for p in existing}
    added = []
    for p in new_posts:
        fp = content_fingerprint(p)
        if fp not in seen:
            seen.add(fp)
            added.append(p)
    merged = added + existing
    merged.sort(key=lambda p: p["date"], reverse=True)
    return merged, len(added)


# --- Git ---

def git_commit_push():
    os.chdir(REPO_DIR)
    subprocess.run(["git", "add", "posts.json"], check=True)
    count = subprocess.run(
        ["git", "diff", "--cached", "--numstat", "posts.json"],
        capture_output=True, text=True,
    ).stdout.strip()
    if not count:
        print("[=] No changes to commit")
        return
    subprocess.run(
        ["git", "commit", "-m", "Sync LinkedIn posts (incremental)\n\nCo-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"],
        check=True,
    )
    subprocess.run(["git", "push", "origin", "master"], check=True)
    print("[+] Pushed to GitHub")


# --- Main ---

def main():
    apply = "--apply" in sys.argv
    push = "--push" in sys.argv

    # Load existing posts
    if POSTS_FILE.exists():
        existing = json.loads(POSTS_FILE.read_text())
    else:
        existing = []
    print(f"[*] Existing posts: {len(existing)}")

    # Start MCP server & fetch
    proc = start_mcp_server()
    try:
        print(f"[*] Fetching posts for @{LINKEDIN_USERNAME}...")
        raw = mcp_tool("get_person_profile", {
            "linkedin_username": LINKEDIN_USERNAME,
            "sections": "posts",
        }, mid=3)
        data = json.loads(raw)
        posts_text = data["sections"].get("posts", "")
        new_posts = parse_posts(posts_text)
        print(f"[+] Scraped {len(new_posts)} posts from LinkedIn")
    finally:
        stop_mcp_server(proc)

    # Merge
    merged, added_count = merge_posts(existing, new_posts)
    print(f"[+] New posts to add: {added_count}")
    print(f"[=] Total after merge: {len(merged)}")

    if added_count == 0:
        print("[=] Blog is up to date, nothing to do")
        return

    # Show new posts
    existing_fps = {content_fingerprint(p) for p in existing}
    for p in new_posts:
        if content_fingerprint(p) not in existing_fps:
            print(f"  NEW [{p['date']}] {p['title'][:70]}")

    if not apply:
        print("\n[!] Dry run. Use --apply to write, --apply --push to commit & push.")
        return

    # Write
    POSTS_FILE.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n")
    print(f"[+] Written {len(merged)} posts to {POSTS_FILE}")

    if push:
        git_commit_push()


if __name__ == "__main__":
    main()
