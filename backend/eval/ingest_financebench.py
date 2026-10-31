"""Ingest FinanceBench PDFs into DocuMind using DocuMind's own pipeline.

Run from backend/:  python -m eval.ingest_financebench --financebench /path/to/financebench

Uses the exact production path of the upload endpoint:
parse_file -> chunk_text -> generate_embeddings -> create_document -> insert_document_chunks
"""
import argparse
import json
import time
from pathlib import Path

from app.core.config import settings
from app.db.document_repository import create_document, document_exists, insert_document_chunks
from app.services.chunker import chunk_text
from app.services.embedder import generate_embeddings
from app.services.file_parser import parse_file


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--financebench", required=True, help="path to a clone of patronus-ai/financebench")
    args = ap.parse_args()

    fb = Path(args.financebench)
    rows = [json.loads(line) for line in open(fb / "data" / "financebench_open_source.jsonl")]
    doc_names = sorted({r["doc_name"] for r in rows} | {e["doc_name"] for r in rows for e in r["evidence"]})

    total_chunks, t_start = 0, time.perf_counter()
    for i, name in enumerate(doc_names, 1):
        file_name = f"{name}.pdf"
        if document_exists(settings.USER_ID, file_name):
            print(f"[{i}/{len(doc_names)}] {file_name} already ingested, skipping")
            continue
        t0 = time.perf_counter()
        pages = parse_file(str(fb / "pdfs" / file_name))
        chunks = chunk_text(pages)
        embeddings = generate_embeddings([c["text"] for c in chunks])
        doc_id = create_document(settings.USER_ID, file_name, "pdf", len(pages), len(chunks))
        insert_document_chunks(doc_id, settings.USER_ID, chunks, embeddings)
        total_chunks += len(chunks)
        print(f"[{i}/{len(doc_names)}] {file_name}: {len(pages)} pages, {len(chunks)} chunks, "
              f"{time.perf_counter() - t0:.1f}s", flush=True)

    print(f"done: {total_chunks} chunks in {time.perf_counter() - t_start:.0f}s")


if __name__ == "__main__":
    main()
