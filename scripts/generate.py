#!/usr/bin/env python3
"""
Generate a weekly summary and write it to the summaries/ directory
as a JSON file consumable by the static site.

This is the script invoked by the GitHub Action every Monday.

Usage:
    python scripts/generate.py                     # last week
    python scripts/generate.py --week-start 2026-02-09
    python scripts/generate.py --dry-run           # test auth only
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from granola_client import GranolaClient, extract_note_text
from summarizer import generate_weekly_summary

SUMMARIES_DIR = Path(__file__).resolve().parent.parent / "summaries"
DEFAULT_FOLDER = "crm-shared"


def get_last_week_range(ref: datetime = None) -> tuple[datetime, datetime]:
    if ref is None:
        ref = datetime.now(timezone.utc)
    days_since_monday = ref.weekday()
    this_monday = ref - timedelta(days=days_since_monday)
    last_monday = this_monday - timedelta(days=7)
    return (
        last_monday.replace(hour=0, minute=0, second=0, microsecond=0),
        this_monday.replace(hour=0, minute=0, second=0, microsecond=0),
    )


def count_section_items(md: str, header_pattern: str) -> int:
    """Rough count of bullet items under a markdown section."""
    in_section = False
    count = 0
    for line in md.split("\n"):
        if re.match(r"^##\s", line):
            in_section = bool(re.search(header_pattern, line, re.IGNORECASE))
            continue
        if in_section and line.strip().startswith("-"):
            count += 1
    return count


def update_index(week_entry: dict):
    """Add or update a week in summaries/index.json."""
    index_path = SUMMARIES_DIR / "index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text())
    else:
        index = {"weeks": []}

    # Replace existing entry for the same week_start, or append
    weeks = [w for w in index["weeks"] if w["week_start"] != week_entry["week_start"]]
    weeks.append(week_entry)
    weeks.sort(key=lambda w: w["week_start"], reverse=True)
    index["weeks"] = weeks

    index_path.write_text(json.dumps(index, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Generate weekly integrator summary.")
    parser.add_argument("--week-start", type=str, default=None)
    parser.add_argument("--folder", type=str, default=None)
    parser.add_argument("--include-transcripts", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--model", type=str, default="claude-sonnet-4-20250514")
    args = parser.parse_args()

    # Week range
    if args.week_start:
        try:
            start = datetime.strptime(args.week_start, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            print(f"Error: Bad date format '{args.week_start}'. Use YYYY-MM-DD.", file=sys.stderr)
            sys.exit(1)
        week_start, week_end = start, start + timedelta(days=7)
    else:
        week_start, week_end = get_last_week_range()

    ws = week_start.strftime("%Y-%m-%d")
    we = (week_end - timedelta(days=1)).strftime("%Y-%m-%d")
    print(f"Week: {ws} to {we}")

    folder_name = args.folder or os.environ.get("GRANOLA_FOLDER", DEFAULT_FOLDER)

    # Fetch notes
    print("Connecting to Granola...")
    try:
        client = GranolaClient()
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching notes from '{folder_name}'...")
    try:
        notes = client.get_recent_notes(
            folder_name=folder_name,
            since=week_start,
            until=week_end,
            include_transcripts=args.include_transcripts,
        )
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    if not notes:
        print(f"No notes found for {ws} to {we}.")
        sys.exit(0)

    print(f"Found {len(notes)} notes:")
    for i, n in enumerate(notes, 1):
        print(f"  {i}. {n.get('title', 'Untitled')}")

    if args.dry_run:
        print("\n[Dry run] Skipping summarization.")
        for note in notes[:2]:
            text = extract_note_text(note)
            print(f"\n--- {note.get('title', 'Untitled')} ---")
            print(text[:400] + ("..." if len(text) > 400 else ""))
        sys.exit(0)

    # Generate summary
    print(f"\nGenerating summary with {args.model}...")
    summary = generate_weekly_summary(
        notes=notes,
        extract_text_fn=extract_note_text,
        week_start=ws,
        week_end=we,
        model=args.model,
    )

    # Count items for stats
    theme_count = count_section_items(summary, r"themes")
    friction_count = count_section_items(summary, r"misunderstanding|friction")
    idea_count = count_section_items(summary, r"content ideas")

    # Write summary JSON
    SUMMARIES_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()

    summary_data = {
        "week_start": ws,
        "week_end": we,
        "note_count": len(notes),
        "generated_at": now,
        "model": args.model,
        "theme_count": theme_count,
        "friction_count": friction_count,
        "idea_count": idea_count,
        "summary_markdown": summary,
        "notes_analyzed": [
            {
                "title": n.get("title", "Untitled"),
                "date": (n.get("created_at") or n.get("createdAt", ""))[:10],
            }
            for n in notes
        ],
    }

    filename = f"{ws}.json"
    (SUMMARIES_DIR / filename).write_text(json.dumps(summary_data, indent=2) + "\n")
    print(f"\nSummary written to summaries/{filename}")

    # Update index
    update_index(
        {
            "week_start": ws,
            "week_end": we,
            "file": filename,
            "note_count": len(notes),
            "generated_at": now,
            "theme_count": theme_count,
            "friction_count": friction_count,
            "idea_count": idea_count,
        }
    )
    print("Index updated: summaries/index.json")


if __name__ == "__main__":
    main()
