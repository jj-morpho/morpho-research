"""
Granola API client for fetching meeting notes from shared folders.

Supports two authentication methods:
1. Auto-discovery from the local Granola desktop app (macOS/Linux)
2. Access token via environment variable GRANOLA_ACCESS_TOKEN

Uses the Granola API endpoints:
- get-document-lists: discover folders and their document IDs
- get-documents-batch: fetch full document content (including shared docs)
- get-document-transcript: fetch meeting transcripts
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
WORKOS_CLIENT_ID = "client_01HYEM4Y9BSXKCY4Y9QZPFRWWG"


def _find_local_credentials() -> Optional[dict]:
    """Attempt to find Granola credentials from the local desktop app."""
    system = platform.system()
    candidate_paths = []

    if system == "Darwin":
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
                return json.loads(path.read_text())
            except (json.JSONDecodeError, OSError):
                continue
    return None


def _refresh_access_token(refresh_token: str) -> dict:
    """Exchange a refresh token for a new access token via WorkOS."""
    resp = requests.post(
        WORKOS_AUTH_URL,
        json={
            "client_id": WORKOS_CLIENT_ID,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
        headers={"Content-Type": "application/json"},
    )
    resp.raise_for_status()
    return resp.json()


class GranolaClient:
    """Client for the Granola API."""

    def __init__(self, access_token: Optional[str] = None):
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
        creds = _find_local_credentials()
        if not creds:
            return

        refresh_token = creds.get("refresh_token") or (
            creds.get("session", {}).get("refresh_token")
        )
        if refresh_token:
            try:
                token_data = _refresh_access_token(refresh_token)
                self.access_token = token_data.get("access_token")
            except requests.RequestException as e:
                print(f"Warning: Could not refresh Granola token: {e}", file=sys.stderr)

    def _post(self, endpoint: str, payload: dict = None) -> dict:
        url = f"{GRANOLA_API_BASE}{endpoint}"
        resp = self._session.post(url, json=payload or {})
        resp.raise_for_status()
        return resp.json()

    def get_document_lists(self) -> list[dict]:
        """Fetch all document lists (folders)."""
        try:
            data = self._post("/v2/get-document-lists")
        except requests.HTTPError:
            data = self._post("/v1/get-document-lists")
        if isinstance(data, list):
            return data
        return data.get("lists", data.get("data", []))

    def find_folder_by_name(self, name_fragment: str) -> Optional[dict]:
        """Find a folder whose name contains the given fragment."""
        lists = self.get_document_lists()
        name_lower = name_fragment.lower()
        for lst in lists:
            folder_name = (lst.get("name", "") or lst.get("title", "") or "").lower()
            if name_lower in folder_name:
                return lst
        return None

    def get_document_ids_from_folder(self, folder: dict) -> list[str]:
        if "documents" in folder:
            return [
                doc["id"] if isinstance(doc, dict) else doc
                for doc in folder["documents"]
            ]
        return folder.get("document_ids", [])

    def get_documents_batch(self, document_ids: list[str]) -> list[dict]:
        """Fetch full documents by ID (works for shared docs)."""
        all_docs = []
        for i in range(0, len(document_ids), 50):
            batch = document_ids[i : i + 50]
            data = self._post(
                "/v1/get-documents-batch",
                {"document_ids": batch, "include_last_viewed_panel": True},
            )
            if isinstance(data, list):
                all_docs.extend(data)
            else:
                all_docs.extend(data.get("documents", data.get("data", [])))
        return all_docs

    def get_document_transcript(self, document_id: str) -> list[dict]:
        try:
            data = self._post(
                "/v1/get-document-transcript", {"document_id": document_id}
            )
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
        """Fetch notes from a named folder within a date range."""
        if until is None:
            until = datetime.now(timezone.utc)

        folder = self.find_folder_by_name(folder_name)
        if not folder:
            raise ValueError(f"Could not find folder matching '{folder_name}'.")

        doc_ids = self.get_document_ids_from_folder(folder)
        if not doc_ids:
            return []

        documents = self.get_documents_batch(doc_ids)

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

        if include_transcripts:
            for doc in filtered:
                doc_id = doc.get("id", "")
                if doc_id:
                    doc["transcript"] = self.get_document_transcript(doc_id)

        return filtered


def extract_note_text(document: dict) -> str:
    """Extract readable text from a Granola document (ProseMirror JSON or plain text)."""
    content = document.get("content") or document.get("notes", "")
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        return _extract_prosemirror_text(content)
    return str(content)


def _extract_prosemirror_text(node: dict, depth: int = 0) -> str:
    parts = []
    node_type = node.get("type", "")

    if node_type == "text":
        return node.get("text", "")

    if node_type == "heading":
        level = node.get("attrs", {}).get("level", 1)
        child_text = "".join(
            _extract_prosemirror_text(c, depth + 1) for c in node.get("content", [])
        )
        parts.append(f"\n{'#' * level} {child_text}\n")
    elif node_type == "paragraph":
        child_text = "".join(
            _extract_prosemirror_text(c, depth + 1) for c in node.get("content", [])
        )
        if child_text.strip():
            parts.append(child_text + "\n")
    elif node_type in ("bulletList", "bullet_list", "orderedList", "ordered_list"):
        for child in node.get("content", []):
            parts.append(_extract_prosemirror_text(child, depth + 1))
    elif node_type in ("listItem", "list_item"):
        child_text = "".join(
            _extract_prosemirror_text(c, depth + 1) for c in node.get("content", [])
        )
        parts.append(f"{'  ' * depth}- {child_text.strip()}\n")
    elif node_type == "blockquote":
        child_text = "".join(
            _extract_prosemirror_text(c, depth + 1) for c in node.get("content", [])
        )
        for line in child_text.strip().split("\n"):
            parts.append(f"> {line}\n")
    else:
        for child in node.get("content", []):
            parts.append(_extract_prosemirror_text(child, depth))

    return "".join(parts)


def format_transcript(utterances: list[dict]) -> str:
    lines = []
    for u in utterances:
        speaker = u.get("source", u.get("speaker", "Unknown"))
        text = u.get("text", "")
        if text.strip():
            lines.append(f"[{speaker}]: {text.strip()}")
    return "\n".join(lines)
