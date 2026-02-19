"""
Claude-powered summarizer for integrator meeting notes.

Produces a structured weekly summary focused on themes,
misunderstandings, and content ideas for marketing.
"""

import os

import anthropic

SYSTEM_PROMPT = """\
You are an expert analyst who reads meeting notes from integrator calls \
(conversations between a protocol team and external integrators/partners \
who are building on top of or integrating with the protocol).

Your job is to produce a weekly summary that helps the marketing team \
understand what integrators care about and generate content ideas.

Be specific — cite concrete examples from the notes when possible. \
Use the integrator/company name when available. \
Do not fabricate information that isn't in the notes."""

USER_PROMPT_TEMPLATE = """\
Below are the meeting notes from integrator calls during the week of \
{week_start} to {week_end}. There are {note_count} meeting notes in total.

Please analyze all of them and produce a structured weekly summary with \
these sections:

## 1. Executive Summary
A 2-3 sentence overview of the week's integrator conversations.

## 2. Main Themes
What are the top recurring themes, topics, or requests that integrators \
brought up this week? Group related mentions together. For each theme:
- What the theme is
- Which integrators mentioned it (if identifiable)
- How often it came up

## 3. Misunderstandings & Friction Points
What concepts, features, or processes did integrators seem confused about \
or misunderstand? These are gold mines for educational content. For each:
- What the misunderstanding was
- How it manifested in the conversation
- What the correct understanding should be

## 4. Questions Integrators Are Asking
Specific questions that came up, grouped by topic. These directly map to \
FAQ content, blog posts, or documentation improvements.

## 5. Feature Requests & Pain Points
What are integrators wishing they had? What's blocking them or slowing \
them down?

## 6. Content Ideas for This Week
Based on all of the above, suggest 5-8 specific content ideas that the \
marketing team could produce this week. For each idea:
- Content format (blog post, tweet thread, short video, documentation page, etc.)
- Title/angle
- Which insight from above it addresses
- Why it would resonate with integrators right now

## 7. Notable Quotes
Pull 3-5 direct quotes or paraphrased statements from the notes that \
capture the sentiment of integrators this week. These can be used in \
social media or internal presentations.

---

Here are the meeting notes:

{notes_content}"""


def build_notes_content(notes: list[dict], extract_text_fn) -> str:
    """Format note documents into a single text block for the LLM."""
    parts = []
    for i, note in enumerate(notes, 1):
        title = note.get("title", "Untitled Meeting")
        created = note.get("created_at") or note.get("createdAt", "Unknown date")
        participants = note.get("participants", [])

        if participants:
            if isinstance(participants[0], dict):
                names = [p.get("name", p.get("email", "Unknown")) for p in participants]
            else:
                names = [str(p) for p in participants]
            participants_str = ", ".join(names)
        else:
            participants_str = "Not recorded"

        text = extract_text_fn(note)

        transcript_section = ""
        if note.get("transcript"):
            from granola_client import format_transcript

            transcript_text = format_transcript(note["transcript"])
            if transcript_text:
                transcript_section = f"\n### Transcript Excerpts\n{transcript_text}\n"

        parts.append(
            f"---\n"
            f"### Meeting {i}: {title}\n"
            f"**Date:** {created}\n"
            f"**Participants:** {participants_str}\n\n"
            f"{text}\n"
            f"{transcript_section}"
        )

    return "\n".join(parts)


def generate_weekly_summary(
    notes: list[dict],
    extract_text_fn,
    week_start: str,
    week_end: str,
    model: str = "claude-sonnet-4-20250514",
) -> str:
    """Generate a weekly summary from meeting notes using Claude."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY environment variable is required. "
            "Get one at https://console.anthropic.com/"
        )

    client = anthropic.Anthropic(api_key=api_key)

    notes_content = build_notes_content(notes, extract_text_fn)

    user_prompt = USER_PROMPT_TEMPLATE.format(
        week_start=week_start,
        week_end=week_end,
        note_count=len(notes),
        notes_content=notes_content,
    )

    message = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    return "".join(
        block.text for block in message.content if hasattr(block, "text")
    )
