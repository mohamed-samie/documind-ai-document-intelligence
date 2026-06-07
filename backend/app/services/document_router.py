import re
from typing import Dict, List, Optional
from uuid import UUID

from app.db.document_repository import list_documents

_STOP_WORDS = {
    'what', 'are', 'the', 'is', 'of', 'and', 'or', 'to', 'in', 'on', 'for',
    'with', 'a', 'an', 'lecture', 'slide', 'pdf', 'file', 'document',
    'documents', 'course', 'compare', 'difference', 'between', 'vs', 'versus',
}


def _tokenise(text: str) -> List[str]:
    tokens = re.sub(r'[^a-z0-9 ]', ' ', (text or '').lower()).split()
    cleaned: List[str] = []
    for token in tokens:
        if token in _STOP_WORDS:
            continue
        if len(token) >= 3 or (len(token) == 2 and token.isalnum()):
            cleaned.append(token)
    return cleaned


def _score_document(doc_name_tokens: List[str], query_tokens: List[str]) -> float:
    if not doc_name_tokens or not query_tokens:
        return 0.0
    hits = sum(1 for token in set(query_tokens) if token in set(doc_name_tokens))
    return hits / max(1, len(set(query_tokens)))


def route_to_document(
    user_id: str,
    query_entities: List[str],
    document_id: Optional[UUID] = None,
    folder_id: Optional[UUID] = None,
    dominance_threshold: float = 0.55,
) -> Optional[UUID]:
    if document_id is not None:
        return document_id

    documents = list_documents(user_id)
    if folder_id is not None:
        documents = [doc for doc in documents if doc.get('folder_id') == str(folder_id)]
    if not documents:
        return None
    if len(documents) == 1:
        return UUID(documents[0]['id'])

    query_tokens: List[str] = []
    for entity in query_entities:
        query_tokens.extend(_tokenise(entity))
    if not query_tokens:
        return None

    scored: List[Dict] = []
    for doc in documents:
        name_tokens = _tokenise(doc.get('file_name', ''))
        score = _score_document(name_tokens, query_tokens)
        scored.append({'doc': doc, 'score': score})

    scored.sort(key=lambda item: -float(item['score']))
    best = scored[0]
    second = scored[1] if len(scored) > 1 else None

    if best['score'] < dominance_threshold:
        return None
    if second and best['score'] - second['score'] < 0.25:
        return None
    return UUID(best['doc']['id'])
