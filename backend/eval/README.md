# Retrieval evaluation on FinanceBench

How well does DocuMind find the right evidence in real business documents?
This folder measures it on [FinanceBench](https://github.com/patronus-ai/financebench)
(Patronus AI): 150 analyst questions over 84 SEC filings (10-K, 10-Q, 8-K, earnings
releases) from companies such as 3M, Pfizer, Boeing and JPMorgan. Every question comes
with the page an annotator marked as its evidence.

## Results

84 documents, 42,452 chunks. Hit@8 = at least one of the 8 chunks DocuMind passes to the
LLM comes from the annotated evidence page.

**Question asked inside the right document** (DocuMind's "selected document" mode)

| Retrieval | Hit@5 | Hit@8 | MRR@8 | Median latency |
|---|---|---|---|---|
| pgvector semantic search only | 43.3% | 50.0% | 0.288 | 9 ms |
| Hybrid (semantic + keyword + neighbour chunks) | 41.3% | 48.0% | 0.273 | 84 ms |
| Full pipeline (hybrid + reranking) | 43.3% | **53.3%** | **0.298** | 93 ms |

**Question asked across the whole 84-document library**

| Retrieval | Hit@5 | Hit@8 | MRR@8 | Median latency |
|---|---|---|---|---|
| pgvector semantic search only | 20.0% | 22.7% | 0.125 | 147 ms |
| Full pipeline, original document router | 16.0% | 24.0% | 0.105 | 2,463 ms |
| Full pipeline, company + fiscal-year router | **30.7%** | **41.3%** | **0.195** | **141 ms** |

### What the evaluation found

1. **The document router never fired.** Its score divides matching words by every word in
   the question, so a normal-length question can never reach the 0.55 threshold: 0 of 150
   questions were routed, and every library-wide question searched all 42K chunks.
   The new router matches the company named in the question against the file name
   (`AMERICANEXPRESS_2022_10K.pdf` <- "American Express") and, when a company has several
   filings, the fiscal year asked about. It routes 92/150 questions, all of them correctly,
   and falls back to library-wide search for the rest. Library-wide Hit@8 rose from 24.0%
   to 41.3% and median retrieval time fell from 2.5 s to 0.14 s.
   It relies on file names that contain the company and year, as FinanceBench's do.
2. **Keyword search alone slightly lowers quality** (Hit@8 50.0% -> 48.0% in-document);
   the reranker recovers it and adds a little on top (53.3%).
3. **Two ingestion bugs** surfaced while loading the filings: `chunk_text` returned an
   undefined name (`all_chunksls`), so every upload failed; and PDFs containing NUL bytes
   were rejected by PostgreSQL. Both are fixed.

Numbers are on 150 questions, so differences of 2-3 points (3-5 questions) are within
noise. The router change was designed while looking at this benchmark.

## How relevance is judged

A retrieved chunk is relevant when it comes from the annotated evidence page: same document,
and at least half of the chunk's word 3-grams appear on that page. Text overlap is used
because DocuMind labels every chunk with the first page of its section, so page numbers
alone would mis-score multi-page sections. Calibration: the best chunk for an evidence page
overlaps it at 0.99-1.0; no other chunk in the same filing reached 0.5.

## Reproduce

```bash
git clone https://github.com/patronus-ai/financebench   # questions + PDFs
cd backend
export DATABASE_URL=postgresql://...  # Postgres with pgvector, schema + migrations applied
export USER_ID=eval-user
python -m eval.ingest_financebench --financebench ../financebench   # ~1 h on 2 CPU cores
python -m eval.run_retrieval_eval  --financebench ../financebench   # ~15 min
```

Results land in `eval/results/` (`summary.json`, `per_question.json`).
Embeddings: all-MiniLM-L6-v2 (the results here were produced with its fp32 ONNX export,
the same weights `sentence-transformers` loads).
