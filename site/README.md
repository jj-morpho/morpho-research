# Integrator Weekly Notes

A GitHub Pages site that auto-publishes weekly summaries of integrator meeting notes from Granola, analyzed by Claude.

Every Monday at 9 AM UTC, a GitHub Action:
1. Fetches the past week's meeting notes from the [Granola shared folder](https://notes.granola.ai/t/g7nbgb-for-crm-shared)
2. Sends them to Claude for structured analysis
3. Commits a new summary JSON to `summaries/`
4. The static site picks it up automatically

## Repo structure

```
├── site/
│   ├── index.html          # The website
│   ├── style.css
│   └── app.js
├── summaries/
│   ├── index.json          # Manifest of all weeks
│   └── 2026-02-09.json     # Per-week summary data
├── scripts/
│   ├── generate.py         # Entry point for the GitHub Action
│   ├── granola_client.py   # Granola API client
│   ├── summarizer.py       # Claude summarization logic
│   └── requirements.txt
└── .github/
    └── workflows/
        └── weekly-summary.yml
```

## Setup for `jj-morpho/Granola`

### 1. Push this content to the repo

Copy all files to the Granola repo root and push.

### 2. Enable GitHub Pages

Go to **Settings > Pages** in the repo and set:
- **Source:** Deploy from a branch
- **Branch:** `main` (or `master`)
- **Folder:** `/site`

### 3. Add repository secrets

Go to **Settings > Secrets and variables > Actions** and add:

| Secret | Description |
|--------|-------------|
| `GRANOLA_ACCESS_TOKEN` | Your Granola API access token |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

### 4. Test the workflow

Go to **Actions > Weekly Integrator Summary > Run workflow** to trigger manually.

## Getting a Granola access token

1. Open the Granola desktop app (ensure you're logged in)
2. Find the credential file:
   - **macOS:** `~/Library/Application Support/Granola/supabase.json`
   - **Linux:** `~/.config/Granola/supabase.json`
   - **Windows:** `%APPDATA%/Granola/supabase.json`
3. Copy the `access_token` value

Note: tokens expire hourly. The script auto-refreshes using `refresh_token` when running locally. For GitHub Actions, you may need to periodically update the secret, or use a long-lived Enterprise API key if available.

## Local development

```bash
pip install -r scripts/requirements.txt

# Test Granola connection
GRANOLA_ACCESS_TOKEN=... python scripts/generate.py --dry-run

# Generate a summary
GRANOLA_ACCESS_TOKEN=... ANTHROPIC_API_KEY=... python scripts/generate.py

# Preview the site (any static server works)
cd site && python -m http.server 8000
```

## Summary sections

Each generated summary includes:

1. **Executive Summary** — 2-3 sentence overview
2. **Main Themes** — Recurring topics with integrator attribution
3. **Misunderstandings & Friction Points** — Educational content opportunities
4. **Questions Integrators Are Asking** — FAQ and documentation gaps
5. **Feature Requests & Pain Points** — Product feedback
6. **Content Ideas for This Week** — 5-8 actionable suggestions with format, title, and rationale
7. **Notable Quotes** — Usable in social/presentations
