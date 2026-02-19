#!/usr/bin/env python3
"""
Weekly Integrator Notes Summary Generator

Fetches meeting notes from a Granola shared folder for the previous week
and generates a structured summary using Claude, highlighting:
- Main themes integrators are mentioning
- Misunderstandings and friction points
- Content ideas for marketing

Usage:
    # Run for last week (default)
    python main.py

    # Run for a specific week
    python main.py --week-start 2026-02-09

    # Include meeting transcripts in the analysis
    python main.py --include-transcripts

    # Dry run: fetch notes but don't call Claude (useful for testing auth)
    python main.py --dry-run

    # Use a custom folder name
    python main.py --folder "my-folder-name"

Environment variables:
    GRANOLA_ACCESS_TOKEN  - Granola API access token (or auto-discovered from desktop app)
    ANTHROPIC_API_KEY     - Anthropic API key for Claude summarization
    GRANOLA_FOLDER        - Default folder name to search for (overridden by --folder)
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from granola_client import GranolaClient, extract_note_text
from summarizer import generate_weekly_summary, format_output

# Default folder name fragment to match in Granola
DEFAULT_FOLDER = "crm-shared"

# Output directory for generated summaries
OUTPUT_DIR = Path(__file__).parent / "output"


def get_last_week_range(reference_date: datetime = None) -> tuple[datetime, datetime]:
    """
    Calculate the Monday-to-Sunday range for the previous week.

    Args:
        reference_date: The date to calculate from. Defaults to today.

    Returns:
        Tuple of (week_start, week_end) as timezone-aware datetimes.
    """
    if reference_date is None:
        reference_date = datetime.now(timezone.utc)

    # Go back to the most recent Monday
    days_since_monday = reference_date.weekday()  # Monday = 0
    this_monday = reference_date - timedelta(days=days_since_monday)

    # Last week's range
    last_monday = this_monday - timedelta(days=7)
    last_sunday = this_monday  # exclusive end

    # Set to start/end of day
    week_start = last_monday.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = last_sunday.replace(hour=0, minute=0, second=0, microsecond=0)

    return week_start, week_end


def main():
    parser = argparse.ArgumentParser(
        description="Generate a weekly summary of integrator meeting notes from Granola."
    )
    parser.add_argument(
        "--week-start",
        type=str,
        default=None,
        help="Start date of the week to summarize (YYYY-MM-DD). Defaults to last Monday.",
    )
    parser.add_argument(
        "--folder",
        type=str,
        default=None,
        help=f"Granola folder name to search for. Defaults to '{DEFAULT_FOLDER}' or GRANOLA_FOLDER env var.",
    )
    parser.add_argument(
        "--include-transcripts",
        action="store_true",
        help="Also fetch and include meeting transcripts in the analysis.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch notes but skip the Claude summarization step.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="claude-sonnet-4-20250514",
        help="Anthropic model to use for summarization.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output file path. Defaults to output/summary-YYYY-MM-DD.md",
    )

    args = parser.parse_args()

    # Determine the week range
    if args.week_start:
        try:
            start = datetime.strptime(args.week_start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            print(f"Error: Invalid date format '{args.week_start}'. Use YYYY-MM-DD.", file=sys.stderr)
            sys.exit(1)
        week_start = start
        week_end = start + timedelta(days=7)
    else:
        week_start, week_end = get_last_week_range()

    week_start_str = week_start.strftime("%Y-%m-%d")
    week_end_str = (week_end - timedelta(days=1)).strftime("%Y-%m-%d")

    print(f"Generating summary for week: {week_start_str} to {week_end_str}")

    # Determine folder name
    import os
    folder_name = args.folder or os.environ.get("GRANOLA_FOLDER", DEFAULT_FOLDER)

    # Initialize Granola client
    print(f"Connecting to Granola API...")
    try:
        client = GranolaClient()
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # Fetch notes
    print(f"Fetching notes from folder matching '{folder_name}'...")
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
        print(f"No notes found for the week of {week_start_str} to {week_end_str}.")
        print("This could mean:")
        print(f"  - No meetings were recorded in the '{folder_name}' folder that week")
        print("  - The folder name doesn't match (try --folder to specify)")
        print("  - Authentication issue (check your GRANOLA_ACCESS_TOKEN)")
        sys.exit(0)

    print(f"Found {len(notes)} meeting notes.")

    # Show note titles
    for i, note in enumerate(notes, 1):
        title = note.get("title", "Untitled")
        created = note.get("created_at") or note.get("createdAt", "")
        print(f"  {i}. {title} ({created[:10] if created else 'no date'})")

    if args.dry_run:
        print("\n[Dry run] Skipping summarization. Notes fetched successfully.")

        # In dry run, dump the extracted text for verification
        print("\n--- Extracted text preview ---")
        for note in notes[:3]:
            title = note.get("title", "Untitled")
            text = extract_note_text(note)
            preview = text[:500] + "..." if len(text) > 500 else text
            print(f"\n### {title}\n{preview}")

        sys.exit(0)

    # Generate summary
    print(f"\nGenerating summary with {args.model}...")
    try:
        summary = generate_weekly_summary(
            notes=notes,
            extract_text_fn=extract_note_text,
            week_start=week_start_str,
            week_end=week_end_str,
            model=args.model,
        )
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # Format the full output
    output = format_output(summary, week_start_str, week_end_str, len(notes))

    # Write to file
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = OUTPUT_DIR / f"summary-{week_start_str}.md"

    output_path.write_text(output)
    print(f"\nSummary written to: {output_path}")

    # Also print to stdout
    print("\n" + "=" * 60)
    print(output)


if __name__ == "__main__":
    main()
