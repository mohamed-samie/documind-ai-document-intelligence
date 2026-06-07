import re
from typing import Dict, List, Optional, Set

from app.services.query_analyzer import QueryAnalysis, analyze_query


def _normalise(text: str) -> str:
    return re.sub(r'\s+', ' ', re.sub(r'[^a-zA-Z0-9\s\-]', ' ', (text or '').lower())).strip()


def _tokenise(text: str) -> List[str]:
    return [token for token in _normalise(text).split() if len(token) >= 2]


def _token_coverage(text_lower: str, tokens: List[str]) -> float:
    if not tokens:
        return 0.0
    return sum(1 for token in tokens if token in text_lower) / len(tokens)


def _heading_score(chunk: Dict, entities: List[str]) -> float:
    section = _normalise(chunk.get('section_title', ''))
    if not section:
        return 0.0
    score = 0.0
    for entity in entities:
        if entity and entity in section:
            score += 4.0 if ' ' in entity else 2.5
    return score


def _exact_phrase_score(text_lower: str, analysis: QueryAnalysis) -> float:
    score = 0.0
    for entity in analysis.entities:
        entity = _normalise(entity)
        if not entity:
            continue
        if entity in text_lower:
            score += 5.0 if ' ' in entity else 1.5
    return score


def _seed_bonus(chunk: Dict, top_seed_ids: Set[str]) -> float:
    return 1.0 if chunk.get('chunk_id') in top_seed_ids else 0.0


def rerank_chunks(
    question: str,
    chunks: List[Dict],
    analysis: Optional[QueryAnalysis] = None,
    top_n: int = 8,
) -> List[Dict]:
    if not chunks:
        return []
    if analysis is None:
        analysis = analyze_query(question)

    entities = [_normalise(entity) for entity in analysis.entities if len(_normalise(entity)) >= 2]
    query_tokens = _tokenise(' '.join(analysis.entities) or question)

    top_seed_ids = {
        chunk['chunk_id']
        for chunk in sorted(chunks, key=lambda c: -float(c.get('retrieval_score', 0.0)))[:12]
        if chunk.get('chunk_id')
    }

    scored = []
    for chunk in chunks:
        content_lower = _normalise(chunk.get('content', ''))
        heading = _heading_score(chunk, entities)
        phrase = _exact_phrase_score(content_lower, analysis)
        coverage = _token_coverage(content_lower, query_tokens) * 5.0
        original = min(float(chunk.get('retrieval_score', 0.0)) / 10.0, 5.0)
        seed = _seed_bonus(chunk, top_seed_ids)
        section_continuity = 0.5 if chunk.get('section_title') else 0.0

        rerank_score = phrase * 2.0 + heading * 2.5 + coverage + original + seed + section_continuity
        scored.append({**chunk, 'rerank_score': round(rerank_score, 4)})

    scored.sort(key=lambda c: (-float(c.get('rerank_score', 0.0)), c.get('file_name', ''), c.get('chunk_index', 0)))
    return scored[:top_n]


def rerank_with_cross_encoder(
    question: str,
    chunks: List[Dict],
    top_n: int = 8,
    model_name: str = 'cross-encoder/ms-marco-MiniLM-L-6-v2',
) -> List[Dict]:
    try:
        from sentence_transformers import CrossEncoder  # type: ignore
        model = CrossEncoder(model_name, max_length=512)
        pairs = [(question, chunk.get('content', '')) for chunk in chunks]
        scores = model.predict(pairs)
        scored = [{**chunk, 'rerank_score': float(score)} for chunk, score in zip(chunks, scores)]
        scored.sort(key=lambda c: -float(c.get('rerank_score', 0.0)))
        return scored[:top_n]
    except Exception:
        return rerank_chunks(question, chunks, top_n=top_n)
