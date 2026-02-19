# Weekly Integrator Notes Summary

Automated pipeline that extracts meeting notes from a Granola shared folder and generates a weekly summary every Monday, surfacing:

- **Main themes** integrators are mentioning
- **Misunderstandings & friction points** (content gold mines)
- **Content ideas** for the marketing team

## How it works

1. Connects to the Granola API and fetches notes from the `crm-shared` folder
2. Filters to notes created during the previous week (Monday–Sunday)
3. Sends all notes to Claude for structured analysis
4. Outputs a markdown summary to `output/summary-YYYY-MM-DD.md`

## Setup

### 1. Install dependencies

```bash
cd weekly-summary
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

- **`ANTHROPIC_API_KEY`** — Required. Get one at [console.anthropic.com](https://console.anthropic.com/)
- **`GRANOLA_ACCESS_TOKEN`** — Optional if you have the Granola desktop app installed (tokens are auto-discovered). Otherwise, see [Getting a Granola token](#getting-a-granola-token) below.

### 3. Run it

```bash
# Generate summary for last week
python main.py

# Dry run (test auth + note fetching without calling Claude)
python main.py --dry-run

# Specific week
python main.py --week-start 2026-02-09

# Include full meeting transcripts in the analysis
python main.py --include-transcripts

# Custom folder name
python main.py --folder "my-folder"
```

## Schedule for every Monday

### macOS/Linux (cron)

```bash
# Open crontab
crontab -e

# Add this line (runs every Monday at 9:00 AM)
0 9 * * 1 cd /path/to/morpho-research/weekly-summary && /path/to/python main.py >> /tmp/weekly-summary.log 2>&1
```

### macOS (launchd)

Create `~/Library/LaunchAgents/com.morpho.weekly-summary.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.morpho.weekly-summary</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/python</string>
        <string>/path/to/morpho-research/weekly-summary/main.py</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>9</integer>
    </dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>ANTHROPIC_API_KEY</key>
        <string>sk-ant-...</string>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/weekly-summary.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/weekly-summary-error.log</string>
</dict>
</plist>
```

Then load it:

```bash
launchctl load ~/Library/LaunchAgents/com.morpho.weekly-summary.plist
```

## Getting a Granola token

If the script can't auto-discover your Granola credentials, you can get a token manually:

1. Open the Granola desktop app and ensure you're logged in
2. Find the credentials file:
   - **macOS:** `~/Library/Application Support/Granola/supabase.json`
   - **Linux:** `~/.config/Granola/supabase.json`
   - **Windows:** `%APPDATA%/Granola/supabase.json`
3. Copy the `access_token` value and set it as `GRANOLA_ACCESS_TOKEN` in your `.env`

Note: Access tokens expire after 1 hour. For automated runs, the script uses the `refresh_token` to get new access tokens automatically.

## Output format

Each summary is saved as a markdown file in `output/` with this structure:

- **Executive Summary** — Quick overview of the week
- **Main Themes** — Recurring topics across integrator calls
- **Misunderstandings & Friction Points** — Where integrators got confused
- **Questions Integrators Are Asking** — Direct FAQ fodder
- **Feature Requests & Pain Points** — What's blocking integrators
- **Content Ideas for This Week** — Actionable content suggestions with format and angle
- **Notable Quotes** — Usable in social or presentations

## Shared folder URL

The target Granola folder: https://notes.granola.ai/t/g7nbgb-for-crm-shared

The script matches folders by name fragment (`crm-shared`), so it will find this folder automatically as long as your Granola account has access to it.
