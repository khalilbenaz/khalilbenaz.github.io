# Sync Blog from LinkedIn

Incrementally sync LinkedIn posts to the blog's `posts.json`.

## Usage

```
/project:sync-blog
/project:sync-blog dry    # Preview only, no changes
```

## Prerequisites

1. **linkedin-scraper-mcp** installed: `uvx linkedin-scraper-mcp@latest --login`
2. Authenticated LinkedIn profile in `~/.linkedin-mcp/`
3. Python 3.10+

## Process

1. Check if `scripts/sync-linkedin.py` exists in the repo root.

2. If the user passed `dry` as argument, run a dry preview:
```bash
python3 scripts/sync-linkedin.py
```

3. Otherwise, run the full sync with push:
```bash
python3 scripts/sync-linkedin.py --apply --push
```

4. Report: number of new posts added, total count, and the blog URL.

5. If the script fails (e.g. MCP server timeout), retry once with increased timeout by editing the `MCP_PORT` or suggest running `uvx linkedin-scraper-mcp@latest --login` to refresh the session.

## How it works

- Starts a local linkedin-scraper-mcp server in HTTP mode
- Calls `get_person_profile(sections="posts")` to scrape all posts
- Parses post content, extracts titles, dates, tags
- Auto-tags posts: FINTECH, MAROC, IA, DEV, TELECOM, SECURITE, GOOGLE, CLOUD, TECH
- Deduplicates by title fingerprint (first 80 chars)
- New posts are prepended (most recent first via `order` field)
- Commits and pushes to GitHub — blog updates automatically via GitHub Pages

## Customization

To use for your own LinkedIn profile, edit `LINKEDIN_USERNAME` in `scripts/sync-linkedin.py`.
