"""Retrieval evaluation of DocuMind on FinanceBench (150 questions, 84 SEC filings).

Run from backend/ after eval.ingest_financebench:
    python -m eval.run_retrieval_eval --financebench /path/to/financebench

Three retrieval setups, all calling DocuMind's own code:
  semantic  pgvector cosine search only            (document_repository.search_similar_chunks)
  hybrid    semantic + keyword + neighbour chunks  (document_repository.hybrid_search_chunks)
  full      the production path behind /chat      (api.chat.run_retrieval: query analysis,
            document routing, hybrid search, reranking)

Two scopes:
  all       question asked across the whole 84-document library (no filter)
  doc       question asked inside the correct document (DocuMind's "selected document" mode)

Relevance: a retrieved chunk counts as relevant when it comes from the evidence page that
FinanceBench's annotators marked for that question - same document, and at least half of the
chunk's word 3-grams appear on that evidence page. Text overlap is used instead of page numbers
because DocuMind stamps every chunk with the first page of its section.

Metrics: Hit@k (at least one relevant chunk in the top k) and MRR@k, for k = 5 and k = 8
(8 = the number of chunks DocuMind passes to the LLM).
"""
import argparse
import json
import re
import statistics
import time
from collections import defaultdict
from pathlib import Path

from app.api.chat import run_retrieval
from app.core.config import settings
from app.db.connection import get_db_connection
from app.db.document_repository import hybrid_search_chunks, search_similar_chunks
from app.services.embedder import generate_embedding
from app.services.query_analyzer import analyze_query

KS = (5, 8)
OVERLAP_THRESHOLD = 0.5


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def _shingles(text: str, n: int = 3) -> set:
    t = _tokens(text)
    return {tuple(t[i:i + n]) for i in range(len(t) - n + 1)}


def is_relevant(chunk: dict, evidence: list[dict]) -> bool:
    cs = _shingles(chunk.get("content", ""))
    if not cs:
        return False
    for ev in evidence:
        if chunk.get("file_name") != f"{ev['doc_name']}.pdf":
            continue
        page = ev["_shingles"]
        if len(cs & page) / len(cs) >= OVERLAP_THRESHOLD:
            return True
    return False


def _doc_ids() -> dict:
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute("select file_name, id from documents where user_id = %s", (settings.USER_ID,))
        return {name: doc_id for name, doc_id in cur.fetchall()}


def _full_pipeline(question: str, doc_id) -> tuple[list[dict], float]:
    trace = run_retrieval(settings.USER_ID, question, 5, doc_id, None)
    if trace.get("mode") == "comparison":
        a, b = trace["reranked_chunks_a"], trace["reranked_chunks_b"]
        merged = [c for pair in zip(a, b) for c in pair] + a[len(b):] + b[len(a):]
    else:
        merged = trace["reranked_chunks"]
    return merged, trace["timings"]["retrieval_ms"]


def score(ranked: list[dict], evidence: list[dict]) -> dict:
    first = next((i for i, c in enumerate(ranked[:max(KS)], 1) if is_relevant(c, evidence)), None)
    out = {}
    for k in KS:
        out[f"hit@{k}"] = 1.0 if first and first <= k else 0.0
        out[f"mrr@{k}"] = 1.0 / first if first and first <= k else 0.0
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--financebench", required=True)
    ap.add_argument("--out", default="eval/results")
    args = ap.parse_args()

    rows = [json.loads(line) for line in open(Path(args.financebench) / "data" / "financebench_open_source.jsonl")]
    for r in rows:
        for ev in r["evidence"]:
            ev["_shingles"] = _shingles(ev["evidence_text_full_page"])

    ids = _doc_ids()
    missing = {f"{r['doc_name']}.pdf" for r in rows} - set(ids)
    if missing:
        raise SystemExit(f"{len(missing)} documents not ingested yet, e.g. {sorted(missing)[:3]}")

    per_q, latencies = [], defaultdict(list)
    for i, r in enumerate(rows, 1):
        q, ev = r["question"], r["evidence"]
        emb = generate_embedding(q)
        entities = analyze_query(q).entities
        rec = {"id": r["financebench_id"], "doc": r["doc_name"], "type": r["question_type"]}
        for scope in ("all", "doc"):
            doc_id = ids[f"{r['doc_name']}.pdf"] if scope == "doc" else None

            t0 = time.perf_counter()
            sem = search_similar_chunks(settings.USER_ID, emb, max(KS), doc_id, None)
            latencies[f"semantic/{scope}"].append((time.perf_counter() - t0) * 1000)

            t0 = time.perf_counter()
            hyb = hybrid_search_chunks(settings.USER_ID, q, emb, entities, 5, doc_id, None)
            latencies[f"hybrid/{scope}"].append((time.perf_counter() - t0) * 1000)

            full, ms = _full_pipeline(q, doc_id)
            latencies[f"full/{scope}"].append(ms)

            for name, ranked in (("semantic", sem), ("hybrid", hyb), ("full", full)):
                rec[f"{name}/{scope}"] = score(ranked, ev)
        per_q.append(rec)
        if i % 10 == 0:
            print(f"{i}/{len(rows)} questions", flush=True)

    summary = {}
    for key in per_q[0]:
        if "/" not in key:
            continue
        summary[key] = {m: round(statistics.mean(q[key][m] for q in per_q), 4) for m in per_q[0][key]}
        summary[key]["median_retrieval_ms"] = round(statistics.median(latencies[key]), 1)
    by_type = {}
    for qtype in sorted({q["type"] for q in per_q}):
        sub = [q for q in per_q if q["type"] == qtype]
        by_type[qtype] = {k: round(statistics.mean(q[k]["hit@8"] for q in sub), 4)
                          for k in summary} | {"n": len(sub)}

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "per_question.json").write_text(json.dumps(per_q, indent=1))
    (out / "summary.json").write_text(json.dumps({"n_questions": len(per_q), "n_documents": len(ids),
                                                  "summary": summary, "hit@8_by_question_type": by_type}, indent=1))
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
