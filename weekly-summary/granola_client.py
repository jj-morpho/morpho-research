"""
Granola API client for fetching meeting notes from shared folders.

Supports two authentication methods:
1. Auto-discovery from the local Granola desktop app (macOS/Linux)
2. Manual access token via environment variable GRANOLA_ACCESS_TOKEN

Uses the reverse-engineered Granola API endpoints:
- get-document-lists: to discover folders and their document IDs
- get-documents-batch: to fetch full document content (including shared docs)
- get-document-transcript: to fetch meeting transcripts
"""

import json
import os
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests

GRANOLA_API_BASE = "https://api.granola.ai"
WORKOS_AUTH_URL = "https://api.workos.com/user_management/authenticate"

# Default Granola WorkOS client ID (from the desktop app)
WORKOS_CLIENT_ID = "client_01HYEM4Y9BSXKCY4Y9QZPFRWWG"


def _find_local_credentials() -> Optional[dict]:
    """Attempt to find Granola credentials from the local desktop app."""
    system = platform.system()

    candidate_paths = []
    if system == "Darwin":  # macOS
        app_support = Path.home() / "Library" / "Application Support" / "Granola"
        candidate_paths.append(app_support / "supabase.json")
        candidate_paths.append(app_support / "credentials.json")
    elif system == "Linux":
        config_dir = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
        candidate_paths.append(config_dir / "Granola" / "supabase.json")
        candidate_paths.append(config_dir / "Granola" / "credentials.json")
    elif system == "Windows":
        appdata = Path(os.environ.get("APPDATA", ""))
        candidate_paths.append(appdata / "Granola" / "supabase.json")
        candidate_paths.append(appdata / "Granola" / "credentials.json")

    for path in candidate_paths:
        if path.exists():
            try:
                data = json.loads(path.read_text())
                return data
            except (json.JSONDecodeError, OSError):
                continue
    return None


def _refresh_access_token(refresh_token: str, client_id: str = WORKOS_CLIENT_ID) -> dict:
    """Exchange a refresh token for a new access token via WorkOS."""
    resp = requests.post(
        WORKOS_AUTH_URL,
        json={
            "client_id": client_id,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
        headers={"Content-Type": "application/json"},
    )
    resp.raise_for_status()
    return resp.json()


class GranolaClient:
    """Client for interacting with the Granola API."""

    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize the client.

        Args:
            access_token: A valid Granola API access token. If not provided,
                          will try GRANOLA_ACCESS_TOKEN env var, then local app credentials.
        """
        self.access_token = access_token or os.environ.get("GRANOLA_ACCESS_TOKEN")
        self._session = requests.Session()

        if not self.access_token:
            self._try_local_auth()

        if not self.access_token:
            raise RuntimeError(
                "No Granola access token found. Set GRANOLA_ACCESS_TOKEN env var "
                "or ensure the Granola desktop app is installed and logged in."
            )

        self._session.headers.update({
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "User-Agent": "weekly-summary/1.0",
        })

    def _try_local_auth(self):
        """Try to authenticate using local Granola desktop app credentials."""
        creds = _find_local_credentials()
        if not creds:
            return

        refresh_token = None
        # supabase.json format
        if "refresh_token" in creds:
            refresh_token = creds["refresh_token"]
        # Nested format sometimes used
        elif "session" in creds and "refresh_token" in creds.get("session", {}):
            refresh_token = creds["session"]["refresh_token"]

        if refresh_token:
            try:
                token_data = _refresh_access_token(refresh_token)
                self.access_token = token_data.get("access_token")
            except requests.RequestException as e:
                print(f"Warning: Could not refresh Granola token: {e}", file=sys.stderr)

    def _post(self, endpoint: str, payload: dict = None) -> dict:
        """Make an authenticated POST request to the Granola API."""
        url = f"{GRANOLA_API_BASE}{endpoint}"
        resp = self._session.post(url, json=payload or {})
        resp.raise_for_status()
        return resp.json()

    def get_document_lists(self) -> list[dict]:
        """Fetch all document lists (folders) the user has access to."""
        # Try v2 first, fall back to v1
        try:
            data = self._post("/v2/get-document-lists")
        except requests.HTTPError:
            data = self._post("/v1/get-document-lists")

        if isinstance(data, list):
            return data
        return data.get("lists", data.get("data", []))

    def find_folder_by_name(self, name_fragment: str) -> Optional[dict]:
        """Find a folder whose name contains the given fragment (case-insensitive)."""
        lists = self.get_document_lists()
        name_lower = name_fragment.lower()
        for lst in lists:
            folder_name = lst.get("name", "") or lst.get("title", "") or ""
            if name_lower in folder_name.lower():
                return lst
        return None

    def get_document_ids_from_folder(self, folder: dict) -> list[str]:
        """Extract document IDs from a folder object."""
        # v2 format: folder has 'documents' array with objects
        if "documents" in folder:
            return [
                doc["id"] if isinstance(doc, dict) else doc
                for doc in folder["documents"]
            ]
        # v1 format: folder has 'document_ids' array
        if "document_ids" in folder:
            return folder["document_ids"]
        return []

    def get_documents_batch(self, document_ids: list[str]) -> list[dict]:
        """Fetch full document objects by their IDs (works for shared docs too)."""
        if not document_ids:
            return []

        # Batch in groups of 50 to avoid payload limits
        all_docs = []
        for i in range(0, len(document_ids), 50):
            batch = document_ids[i:i + 50]
            data = self._post("/v1/get-documents-batch", {
                "document_ids": batch,
                "include_last_viewed_panel": True,
            })
            if isinstance(data, list):
                all_docs.extend(data)
            else:
                all_docs.extend(data.get("documents", data.get("data", [])))
        return all_docs

    def get_document_transcript(self, document_id: str) -> list[dict]:
        """Fetch the transcript for a specific document."""
        try:
            data = self._post("/v1/get-document-transcript", {
                "document_id": document_id,
            })
            if isinstance(data, list):
                return data
            return data.get("utterances", data.get("transcript", []))
        except requests.HTTPError:
            return []

    def get_recent_notes(
        self,
        folder_name: str,
        since: datetime,
        until: Optional[datetime] = None,
        include_transcripts: bool = False,
    ) -> list[dict]:
        """
        Fetch notes from a named folder created within a date range.

        Args:
            folder_name: Name fragment to match the folder (e.g., "crm-shared")
            since: Start of the date range (inclusive)
            until: End of the date range (exclusive). Defaults to now.
            include_transcripts: Whether to also fetch transcripts for each note.

        Returns:
            List of document dicts with 'title', 'content', 'created_at',
            'participants', and optionally 'transcript'.
        """
        if until is None:
            until = datetime.now(timezone.utc)

        folder = self.find_folder_by_name(folder_name)
        if not folder:
            raise ValueError(
                f"Could not find a folder matching '{folder_name}'. "
                f"Available folders can be listed with get_document_lists()."
            )

        doc_ids = self.get_document_ids_from_folder(folder)
        if not doc_ids:
            return []

        documents = self.get_documents_batch(doc_ids)

        # Filter by date range
        filtered = []
        for doc in documents:
            created_str = doc.get("created_at") or doc.get("createdAt", "")
            if not created_str:
                continue
            try:
                created = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                continue

            if since <= created < until:
                filtered.append(doc)

        # Optionally enrich with transcripts
        if include_transcripts:
            for doc in filtered:
                doc_id = doc.get("id", "")
                if doc_id:
                    doc["transcript"] = self.get_document_transcript(doc_id)

        return filtered


def extract_note_text(document: dict) -> str:
    """
    Extract readable text from a Granola document object.

    Granola stores content in ProseMirror JSON format. This function
    extracts the text content recursively.
    """
    content = document.get("content") or document.get("notes", "")

    # If content is a string (plain text or markdown), return it directly
    if isinstance(content, str):
        return content

    # If content is ProseMirror JSON, extract text
    if isinstance(content, dict):
        return _extract_prosemirror_text(content)

    return str(content)


def _extract_prosemirror_text(node: dict, depth: int = 0) -> str:
    """Recursively extract text from a ProseMirror document node."""
    parts = []
    node_type = node.get("type", "")

    # Handle text nodes
    if node_type == "text":
        return node.get("text", "")

    # Handle headings
    if node_type == "heading":
        level = node.get("attrs", {}).get("level", 1)
        prefix = "#" * level + " "
        child_text = ""
        for child in node.get("content", []):
            child_text += _extract_prosemirror_text(child, depth + 1)
        parts.append(f"\n{prefix}{child_text}\n")

    # Handle paragraphs
    elif node_type == "paragraph":
        child_text = ""
        for child in node.get("content", []):
            child_text += _extract_prosemirror_text(child, depth + 1)
        if child_text.strip():
            parts.append(child_text + "\n")

    # Handle bullet/ordered lists
    elif node_type in ("bulletList", "bullet_list", "orderedList", "ordered_list"):
        for child in node.get("content", []):
            parts.append(_extract_prosemirror_text(child, depth + 1))

    # Handle list items
    elif node_type in ("listItem", "list_item"):
        child_text = ""
        for child in node.get("content", []):
            child_text += _extract_prosemirror_text(child, depth + 1)
        indent = "  " * depth
        parts.append(f"{indent}- {child_text.strip()}\n")

    # Handle blockquotes
    elif node_type == "blockquote":
        child_text = ""
        for child in node.get("content", []):
            child_text += _extract_prosemirror_text(child, depth + 1)
        for line in child_text.strip().split("\n"):
            parts.append(f"> {line}\n")

    # Generic: recurse into children
    else:
        for child in node.get("content", []):
            parts.append(_extract_prosemirror_text(child, depth))

    return "".join(parts)


def format_transcript(utterances: list[dict]) -> str:
    """Format transcript utterances into readable text."""
    if not utterances:
        return ""

    lines = []
    for u in utterances:
        speaker = u.get("source", u.get("speaker", "Unknown"))
        text = u.get("text", "")
        if text.strip():
            lines.append(f"[{speaker}]: {text.strip()}")

    return "\n".join(lines)
