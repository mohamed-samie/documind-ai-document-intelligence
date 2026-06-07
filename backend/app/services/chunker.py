"""
chunker.py — Section-aware, overlap-preserving text chunker.

Key improvements over the original:
1. Section-aware grouping: pages that share a section_index are concatenated
   before chunking, so multi-page topics stay together.
2. Section metadata (section_title, section_index) is carried forward into
   every chunk so retrieval can boost heading matches.
3. Sentence-boundary splitting is preserved.
4. The chunk dict now includes `section_title` and `section_index` fields
   that document_repository uses for heading-aware scoring.
"""

import re
from typing import List, Dict, Optional


# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """
    Normalise whitespace without destroying paragraph structure.
    Collapse blank lines to a single newline so chunker can split on them.
    """
    # Collapse runs of spaces/tabs on the same line
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse 3+ consecutive newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Sentence-boundary helper
# ---------------------------------------------------------------------------

def find_sentence_boundary(text: str, start: int, target_end: int) -> int:
    """
    Return the position of the nearest sentence boundary at or before
    target_end.  Falls back to target_end if none is found.
    """
    if target_end >= len(text):
        return len(text)

    boundary_chars = [".", "?", "!", ":", ";", "\n"]
    search_window_start = max(start, target_end - 300)
    search_window = text[search_window_start:target_end]

    best_position = -1
    for char in boundary_chars:
        pos = search_window.rfind(char)
        if pos > best_position:
            best_position = pos

    if best_position == -1:
        return target_end

    return search_window_start + best_position + 1


# ---------------------------------------------------------------------------
# Core chunking logic
# ---------------------------------------------------------------------------

def _chunk_single_text(
    text: str,
    chunk_size: int,
    overlap: int,
    min_chunk_size: int,
    base_chunk_index: int,
    page_number: int,
    section_title: Optional[str],
    section_index: int,
) -> List[Dict]:
    """
    Split `text` into overlapping chunks and attach metadata.
    """
    chunks = []
    chunk_index = base_chunk_index
    start = 0

    while start < len(text):
        target_end = start + chunk_size
        end = find_sentence_boundary(text, start, target_end)

        chunk = text[start:end].strip()

        if len(chunk) >= min_chunk_size:
            chunks.append({
                "chunk_index":   chunk_index,
                "page_number":   page_number,
                "section_index": section_index,
                "section_title": section_title or "",
                "text":          chunk,
            })
            chunk_index += 1

        if end >= len(text):
            break

        start = max(end - overlap, start + 1)

    return chunks


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def chunk_text(
    pages: List[Dict],
    chunk_size: int = 1200,
    overlap: int = 150,
    min_chunk_size: int = 200,
) -> List[Dict]:
    """
    Convert a list of page dicts (from pdf_parser) into chunks.

    Section-aware strategy:
    - Consecutive pages that share the same `section_index` are merged into
      one text block before chunking.  This keeps multi-page topics intact.
    - Each chunk carries `section_title` and `section_index` for downstream
      heading-aware scoring.

    Falls back gracefully when pages lack section metadata (backwards
    compatible with the original pdf_parser output format).
    """
    if not pages:
        return []

    # ------------------------------------------------------------------
    # Group pages by section_index (or treat each page as its own section
    # if no section metadata is present — backwards compatibility).
    # ------------------------------------------------------------------
    sections: List[Dict] = []          # [{section_index, section_title, pages:[]}]

    for page in pages:
        sec_idx = page.get("section_index", page["page_number"])
        sec_title = page.get("section_title") or page.get("title") or ""

        if sections and sections[-1]["section_index"] == sec_idx:
            sections[-1]["pages"].append(page)
        else:
            sections.append({
                "section_index": sec_idx,
                "section_title": sec_title,
                "pages": [page],
            })

    # ------------------------------------------------------------------
    # Chunk each section
    # ------------------------------------------------------------------
    all_chunks: List[Dict] = []
    chunk_index_counter = 0

    for section in sections:
        sec_title = section["section_title"]
        sec_idx = section["section_index"]
        section_pages = section["pages"]

        # Merge all page texts for this section.
        # Prepend the section title as the very first line so keyword
        # search always finds it in the first chunk.
        combined_parts = []

        if sec_title:
            combined_parts.append(sec_title)

        for page in section_pages:
            raw = page.get("text", "")
            cleaned = clean_text(raw)
            if cleaned:
                combined_parts.append(cleaned)

        combined_text = "\n\n".join(combined_parts)

        if not combined_text.strip():
            continue

        # Use the first page number in this section as the representative
        # page number for all chunks (retrieval UI shows it to the user).
        first_page = section_pages[0]["page_number"]

        new_chunks = _chunk_single_text(
            text=combined_text,
            chunk_size=chunk_size,
            overlap=overlap,
            min_chunk_size=min_chunk_size,
            base_chunk_index=chunk_index_counter,
            page_number=first_page,
            section_title=sec_title,
            section_index=sec_idx,
        )

        all_chunks.extend(new_chunks)
        chunk_index_counter += len(new_chunks)

    return all_chunksls