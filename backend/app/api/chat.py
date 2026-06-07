import time
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.db.document_repository import (
    conversation_exists,
    create_conversation,
    create_message,
    hybrid_search_chunks,
)
from app.services.document_router import route_to_document
from app.services.embedder import generate_embedding
from app.services.llm_service import generate_answer, generate_comparison_answer
from app.services.query_analyzer import analyze_query
from app.services.reranker import rerank_chunks

router = APIRouter(prefix='/chat', tags=['Chat'])


class SearchRequest(BaseModel):
    question: str
    top_k: int = 5
    document_id: Optional[UUID] = None
    folder_id: Optional[UUID] = None


class AskRequest(BaseModel):
    question: str
    top_k: int = 5
    document_id: Optional[UUID] = None
    folder_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None


def get_search_mode(document_id: Optional[UUID], folder_id: Optional[UUID]) -> str:
    if document_id:
        return 'selected_document'
    if folder_id:
        return 'selected_folder'
    return 'all_documents'


def clean_sources(results: List[Dict], max_sources: int = 5) -> List[Dict]:
    seen = set()
    sources: List[Dict] = []
    for result in results:
        key = (result.get('file_name'), result.get('page_number'), result.get('section_title', ''))
        if key in seen:
            continue
        seen.add(key)
        sources.append({
            'file_name': result.get('file_name', ''),
            'page_number': result.get('page_number'),
            'section_title': result.get('section_title', ''),
            'chunk_index': result.get('chunk_index'),
            'distance': result.get('distance', 0.0),
            'rerank_score': result.get('rerank_score', 0.0),
        })
        if len(sources) >= max_sources:
            break
    return sources


def _comparison_sides(question: str, analysis_entities: List[str], sides: List[str]) -> List[str]:
    if len(sides) == 2:
        return sides
    unique = list(dict.fromkeys(analysis_entities))
    if len(unique) >= 2:
        return [unique[0], unique[1]]
    return [question, question]


def run_retrieval(user_id: str, question: str, top_k: int, document_id: Optional[UUID], folder_id: Optional[UUID]) -> Dict:
    trace: Dict = {'timings': {}}

    t0 = time.perf_counter()
    analysis_obj = analyze_query(question)
    trace['analysis'] = {
        'intent': analysis_obj.intent,
        'entities': analysis_obj.entities,
        'needs_multiple_sources': analysis_obj.needs_multiple_sources,
        'comparison_sides': analysis_obj.comparison_sides,
    }
    trace['timings']['query_analysis_ms'] = round((time.perf_counter() - t0) * 1000, 1)

    t0 = time.perf_counter()
    routed_doc_id = route_to_document(user_id, analysis_obj.entities, document_id, folder_id)
    trace['routed_document_id'] = str(routed_doc_id) if routed_doc_id else None
    trace['timings']['routing_ms'] = round((time.perf_counter() - t0) * 1000, 1)

    effective_doc_id = document_id or routed_doc_id
    effective_folder_id = folder_id

    t0 = time.perf_counter()
    query_embedding = generate_embedding(question)
    trace['timings']['embedding_ms'] = round((time.perf_counter() - t0) * 1000, 1)

    t0 = time.perf_counter()
    if analysis_obj.intent == 'comparison':
        side_a, side_b = _comparison_sides(question, analysis_obj.entities, analysis_obj.comparison_sides)
        trace['analysis']['comparison_sides'] = [side_a, side_b]

        emb_a = generate_embedding(side_a)
        emb_b = generate_embedding(side_b)
        analysis_a = analyze_query(side_a)
        analysis_b = analyze_query(side_b)

        chunks_a = hybrid_search_chunks(user_id, side_a, emb_a, [side_a] + analysis_obj.entities, top_k, effective_doc_id, effective_folder_id)
        chunks_b = hybrid_search_chunks(user_id, side_b, emb_b, [side_b] + analysis_obj.entities, top_k, effective_doc_id, effective_folder_id)

        trace['raw_chunks_a'] = len(chunks_a)
        trace['raw_chunks_b'] = len(chunks_b)
        trace['reranked_chunks_a'] = rerank_chunks(side_a, chunks_a, analysis=analysis_a, top_n=5)
        trace['reranked_chunks_b'] = rerank_chunks(side_b, chunks_b, analysis=analysis_b, top_n=5)
        trace['mode'] = 'comparison'
    else:
        raw_chunks = hybrid_search_chunks(user_id, question, query_embedding, analysis_obj.entities, top_k, effective_doc_id, effective_folder_id)
        reranked = rerank_chunks(question, raw_chunks, analysis=analysis_obj, top_n=max(top_k, 8))
        trace['raw_chunks_count'] = len(raw_chunks)
        trace['reranked_chunks'] = reranked
        trace['reranked_chunks_count'] = len(reranked)
        trace['mode'] = 'standard'

    trace['timings']['retrieval_ms'] = round((time.perf_counter() - t0) * 1000, 1)
    return trace


@router.post('/search')
async def search_documents(request: SearchRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail='Question cannot be empty.')
    if not 1 <= request.top_k <= 20:
        raise HTTPException(status_code=400, detail='top_k must be between 1 and 20.')

    trace = run_retrieval(settings.USER_ID, question, request.top_k, request.document_id, request.folder_id)
    chunks = trace.get('reranked_chunks') or (trace.get('reranked_chunks_a', []) + trace.get('reranked_chunks_b', []))
    return {
        'question': question,
        'top_k': request.top_k,
        'mode': get_search_mode(request.document_id, request.folder_id),
        'analysis': trace['analysis'],
        'results_count': len(chunks),
        'results': chunks,
        'timings': trace['timings'],
    }


@router.post('/ask')
async def ask_documents(request: AskRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail='Question cannot be empty.')
    if not 1 <= request.top_k <= 20:
        raise HTTPException(status_code=400, detail='top_k must be between 1 and 20.')

    conversation_id = request.conversation_id
    if conversation_id and not conversation_exists(settings.USER_ID, conversation_id):
        raise HTTPException(status_code=404, detail='Conversation not found.')
    if conversation_id is None:
        conversation_id = create_conversation(settings.USER_ID, question[:80])

    create_message(conversation_id, settings.USER_ID, 'user', question, sources=None)

    try:
        t_total = time.perf_counter()
        trace = run_retrieval(settings.USER_ID, question, request.top_k, request.document_id, request.folder_id)
        analysis = trace['analysis']

        if trace['mode'] == 'comparison':
            chunks_a = trace.get('reranked_chunks_a', [])
            chunks_b = trace.get('reranked_chunks_b', [])
            sides = analysis.get('comparison_sides', ['Side A', 'Side B'])
            if not chunks_a and not chunks_b:
                answer = 'I could not find enough information in the uploaded documents.'
                sources = []
            else:
                answer = generate_comparison_answer(
                    question,
                    chunks_a,
                    sides[0] if len(sides) > 0 else 'Side A',
                    chunks_b,
                    sides[1] if len(sides) > 1 else 'Side B',
                )
                sources = clean_sources(chunks_a + chunks_b)
        else:
            chunks = trace.get('reranked_chunks', [])
            if not chunks:
                answer = 'I could not find enough information in the uploaded documents.'
                sources = []
            else:
                answer = generate_answer(question, chunks, intent=analysis.get('intent'))
                sources = clean_sources(chunks)

        create_message(conversation_id, settings.USER_ID, 'assistant', answer, sources=sources)
        return {
            'conversation_id': str(conversation_id),
            'question': question,
            'mode': get_search_mode(request.document_id, request.folder_id),
            'analysis': analysis,
            'answer': answer,
            'sources': sources,
            'total_ms': round((time.perf_counter() - t_total) * 1000, 1),
        }
    except HTTPException:
        raise
    except Exception as error:
        fallback = 'Sorry, something went wrong while generating the answer. Please try again.'
        create_message(conversation_id, settings.USER_ID, 'assistant', fallback, sources=[])
        raise HTTPException(status_code=500, detail={'message': fallback, 'conversation_id': str(conversation_id), 'error': str(error)})


@router.post('/debug')
async def debug_retrieval(request: SearchRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail='Question cannot be empty.')

    trace = run_retrieval(settings.USER_ID, question, request.top_k, request.document_id, request.folder_id)
    chunks = trace.get('reranked_chunks') or (trace.get('reranked_chunks_a', []) + trace.get('reranked_chunks_b', []))
    debug_chunks = []
    for chunk in chunks:
        debug_chunks.append({
            'chunk_id': chunk.get('chunk_id'),
            'file_name': chunk.get('file_name'),
            'page_number': chunk.get('page_number'),
            'section_title': chunk.get('section_title', ''),
            'chunk_index': chunk.get('chunk_index'),
            'retrieval_type': chunk.get('retrieval_type', ''),
            'retrieval_score': round(float(chunk.get('retrieval_score', 0.0)), 4),
            'rerank_score': round(float(chunk.get('rerank_score', 0.0)), 4),
            'content_preview': (chunk.get('content') or '')[:300],
        })
    return {
        'question': question,
        'query_analysis': trace['analysis'],
        'routed_document_id': trace.get('routed_document_id'),
        'retrieval_mode': trace.get('mode'),
        'chunks_found': len(debug_chunks),
        'chunks': debug_chunks,
        'timings': trace['timings'],
        'diagnosis': 'No chunks retrieved — check uploads/indexing.' if not debug_chunks else 'Chunks retrieved — inspect content_preview for relevance.',
    }
