from typing import Dict, List, Optional
from uuid import UUID
import re

from psycopg.types.json import Json

from app.db.connection import get_db_connection


def vector_to_pgvector(embedding: List[float]) -> str:
    return '[' + ','.join(str(float(value)) for value in embedding) + ']'


def _normalise_search_term(term: str) -> str:
    return re.sub(r'\s+', ' ', re.sub(r'[^a-zA-Z0-9\s\-]', ' ', (term or '').lower())).strip()


def create_document(user_id: str, file_name: str, file_type: str, total_pages: int, total_chunks: int, folder_id: Optional[UUID] = None) -> UUID:
    query = '''
        insert into documents (user_id, file_name, file_type, total_pages, total_chunks, folder_id)
        values (%s, %s, %s, %s, %s, %s)
        returning id;
    '''
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id, file_name, file_type, total_pages, total_chunks, folder_id))
            document_id = cur.fetchone()[0]
            conn.commit()
    return document_id


def insert_document_chunks(document_id: UUID, user_id: str, chunks: List[Dict], embeddings: List[List[float]]) -> int:
    if len(chunks) != len(embeddings):
        raise ValueError('Chunks count and embeddings count do not match.')
    query = '''
        insert into document_chunks (
            document_id, user_id, chunk_index, page_number, content, embedding, section_title, section_index
        ) values (%s, %s, %s, %s, %s, %s::vector, %s, %s);
    '''
    count = 0
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            try:
                for chunk, embedding in zip(chunks, embeddings):
                    cur.execute(query, (
                        document_id,
                        user_id,
                        int(chunk['chunk_index']),
                        int(chunk['page_number']),
                        chunk['text'],
                        vector_to_pgvector(embedding),
                        chunk.get('section_title', '') or '',
                        int(chunk.get('section_index', 0) or 0),
                    ))
                    count += 1
                conn.commit()
            except Exception:
                conn.rollback()
                raise
    return count


def document_exists(user_id: str, file_name: str) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('select id from documents where user_id = %s and file_name = %s limit 1;', (user_id, file_name))
            return cur.fetchone() is not None


def list_documents(user_id: str) -> List[Dict]:
    query = '''
        select d.id, d.user_id, d.file_name, d.file_type, d.total_pages, d.total_chunks,
               d.folder_id, f.name as folder_name, d.created_at
        from documents d
        left join folders f on d.folder_id = f.id
        where d.user_id = %s
        order by d.created_at desc;
    '''
    documents: List[Dict] = []
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            for row in cur.fetchall():
                documents.append({
                    'id': str(row[0]),
                    'user_id': row[1],
                    'file_name': row[2],
                    'file_type': row[3],
                    'total_pages': row[4],
                    'total_chunks': row[5],
                    'folder_id': str(row[6]) if row[6] else None,
                    'folder_name': row[7],
                    'created_at': row[8].isoformat() if row[8] else None,
                })
    return documents


def delete_document(user_id: str, document_id: UUID) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('delete from documents where id = %s and user_id = %s returning id;', (document_id, user_id))
            deleted = cur.fetchone()
            conn.commit()
    return deleted is not None


def update_document_folder(user_id: str, document_id: UUID, folder_id: Optional[UUID]) -> Optional[Dict]:
    update_query = 'update documents set folder_id = %s where id = %s and user_id = %s returning id;'
    select_query = '''
        select d.id, d.user_id, d.file_name, d.file_type, d.total_pages, d.total_chunks,
               d.folder_id, f.name as folder_name, d.created_at
        from documents d
        left join folders f on d.folder_id = f.id
        where d.id = %s and d.user_id = %s limit 1;
    '''
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(update_query, (folder_id, document_id, user_id))
            if not cur.fetchone():
                conn.commit()
                return None
            cur.execute(select_query, (document_id, user_id))
            row = cur.fetchone()
            conn.commit()
    if not row:
        return None
    return {
        'id': str(row[0]), 'user_id': row[1], 'file_name': row[2], 'file_type': row[3],
        'total_pages': row[4], 'total_chunks': row[5], 'folder_id': str(row[6]) if row[6] else None,
        'folder_name': row[7], 'created_at': row[8].isoformat() if row[8] else None,
    }


def create_folder(user_id: str, name: str) -> Dict:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('insert into folders (user_id, name) values (%s, %s) returning id, user_id, name, created_at;', (user_id, name))
            row = cur.fetchone()
            conn.commit()
    return {'id': str(row[0]), 'user_id': row[1], 'name': row[2], 'created_at': row[3].isoformat() if row[3] else None}


def list_folders(user_id: str) -> List[Dict]:
    query = '''
        select f.id, f.user_id, f.name, f.created_at, count(d.id) as documents_count
        from folders f
        left join documents d on d.folder_id = f.id
        where f.user_id = %s
        group by f.id, f.user_id, f.name, f.created_at
        order by f.created_at desc;
    '''
    folders: List[Dict] = []
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            for row in cur.fetchall():
                folders.append({'id': str(row[0]), 'user_id': row[1], 'name': row[2], 'created_at': row[3].isoformat() if row[3] else None, 'documents_count': row[4]})
    return folders


def rename_folder(user_id: str, folder_id: UUID, name: str) -> Optional[Dict]:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('update folders set name = %s where id = %s and user_id = %s returning id, user_id, name, created_at;', (name, folder_id, user_id))
            row = cur.fetchone()
            conn.commit()
    if not row:
        return None
    return {'id': str(row[0]), 'user_id': row[1], 'name': row[2], 'created_at': row[3].isoformat() if row[3] else None}


def delete_folder(user_id: str, folder_id: UUID) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('delete from folders where id = %s and user_id = %s returning id;', (folder_id, user_id))
            deleted = cur.fetchone()
            conn.commit()
    return deleted is not None


def search_similar_chunks(user_id: str, query_embedding: List[float], top_k: int = 10, document_id: Optional[UUID] = None, folder_id: Optional[UUID] = None) -> List[Dict]:
    query = '''
        select dc.id, dc.document_id, d.file_name, dc.chunk_index, dc.page_number,
               dc.content, coalesce(dc.section_title, ''), coalesce(dc.section_index, 0),
               dc.embedding <=> %s::vector as distance
        from document_chunks dc
        join documents d on dc.document_id = d.id
        where dc.user_id = %s
    '''
    params: List = [vector_to_pgvector(query_embedding), user_id]
    if document_id:
        query += ' and dc.document_id = %s'
        params.append(document_id)
    if folder_id:
        query += ' and d.folder_id = %s'
        params.append(folder_id)
    query += ' order by distance asc limit %s;'
    params.append(top_k)

    results: List[Dict] = []
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, tuple(params))
            for row in cur.fetchall():
                distance = float(row[8])
                results.append({
                    'chunk_id': str(row[0]), 'document_id': str(row[1]), 'file_name': row[2],
                    'chunk_index': row[3], 'page_number': row[4], 'content': row[5],
                    'section_title': row[6] or '', 'section_index': row[7] or 0,
                    'distance': distance, 'retrieval_score': 1.0 / (1.0 + distance),
                    'retrieval_type': 'semantic',
                })
    return results


def keyword_search_chunks(user_id: str, question: str, entities: List[str], top_k: int = 10, document_id: Optional[UUID] = None, folder_id: Optional[UUID] = None) -> List[Dict]:
    terms = [_normalise_search_term(entity) for entity in entities if _normalise_search_term(entity)]
    if not terms:
        terms = [token for token in _normalise_search_term(question).split() if len(token) >= 2]
    terms = list(dict.fromkeys(terms))
    if not terms:
        return []

    query = '''
        select dc.id, dc.document_id, d.file_name, dc.chunk_index, dc.page_number,
               dc.content, coalesce(dc.section_title, ''), coalesce(dc.section_index, 0), 0.0 as distance
        from document_chunks dc
        join documents d on dc.document_id = d.id
        where dc.user_id = %s
    '''
    params: List = [user_id]
    if document_id:
        query += ' and dc.document_id = %s'
        params.append(document_id)
    if folder_id:
        query += ' and d.folder_id = %s'
        params.append(folder_id)

    conditions = []
    for term in terms:
        conditions.append('(dc.content ilike %s or dc.section_title ilike %s)')
        params.extend([f'%{term}%', f'%{term}%'])
    query += ' and (' + ' or '.join(conditions) + ') order by dc.chunk_index asc limit %s;'
    params.append(max(top_k * 10, 80))

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

    question_lower = _normalise_search_term(question)
    noun_phrase = re.sub(r'^(what is|what are|define|explain|describe|tell me about)\s+', '', question_lower, flags=re.I).strip()
    results: List[Dict] = []

    for row in rows:
        content = row[5] or ''
        section_title = row[6] or ''
        content_lower = _normalise_search_term(content)
        section_lower = _normalise_search_term(section_title)
        score = 0.0
        for term in terms:
            is_phrase = ' ' in term
            if term in content_lower:
                score += 4.0 if is_phrase else 1.5
                score += min(content_lower.count(term), 3)
            if term in section_lower:
                score += 10.0 if is_phrase else 4.0
        if noun_phrase:
            if noun_phrase in section_lower:
                score += 20.0
            if noun_phrase in content_lower:
                score += 8.0
        results.append({
            'chunk_id': str(row[0]), 'document_id': str(row[1]), 'file_name': row[2],
            'chunk_index': row[3], 'page_number': row[4], 'content': content,
            'section_title': section_title, 'section_index': row[7] or 0,
            'distance': float(row[8]), 'retrieval_score': score, 'retrieval_type': 'keyword',
        })
    results.sort(key=lambda result: (-float(result['retrieval_score']), result['file_name'], result['chunk_index']))
    return results[:max(top_k, 20)]


def get_neighbor_chunks(user_id: str, chunks: List[Dict], window: int = 1) -> List[Dict]:
    if not chunks:
        return []
    doc_chunk_scores: Dict[str, Dict[int, float]] = {}
    for chunk in chunks:
        doc_id = chunk['document_id']
        idx = int(chunk['chunk_index'])
        base = float(chunk.get('retrieval_score', 0.0))
        doc_chunk_scores.setdefault(doc_id, {})
        for offset in range(-window, window + 1):
            neighbor_idx = idx + offset
            if neighbor_idx < 0:
                continue
            score = base - abs(offset) * 0.5
            if score > doc_chunk_scores[doc_id].get(neighbor_idx, -999.0):
                doc_chunk_scores[doc_id][neighbor_idx] = score

    results: List[Dict] = []
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            for doc_id, chunk_scores in doc_chunk_scores.items():
                cur.execute('''
                    select dc.id, dc.document_id, d.file_name, dc.chunk_index, dc.page_number,
                           dc.content, coalesce(dc.section_title, ''), coalesce(dc.section_index, 0), 0.0 as distance
                    from document_chunks dc
                    join documents d on dc.document_id = d.id
                    where dc.user_id = %s and dc.document_id = %s and dc.chunk_index = any(%s)
                    order by dc.chunk_index asc;
                ''', (user_id, doc_id, list(chunk_scores.keys())))
                for row in cur.fetchall():
                    idx = int(row[3])
                    results.append({
                        'chunk_id': str(row[0]), 'document_id': str(row[1]), 'file_name': row[2],
                        'chunk_index': idx, 'page_number': row[4], 'content': row[5],
                        'section_title': row[6] or '', 'section_index': row[7] or 0,
                        'distance': float(row[8]), 'retrieval_score': chunk_scores.get(idx, 0.0),
                        'retrieval_type': 'neighbor',
                    })
    return results


def hybrid_search_chunks(user_id: str, question: str, query_embedding: List[float], entities: List[str], top_k: int = 5, document_id: Optional[UUID] = None, folder_id: Optional[UUID] = None) -> List[Dict]:
    candidate_k = max(top_k * 6, 40)
    semantic = search_similar_chunks(user_id, query_embedding, candidate_k, document_id, folder_id)
    keyword = keyword_search_chunks(user_id, question, entities, candidate_k, document_id, folder_id)
    combined = semantic + keyword
    if not combined:
        return []
    seed_pool = sorted(combined, key=lambda chunk: -float(chunk.get('retrieval_score', 0.0)))[:12]
    neighbors = get_neighbor_chunks(user_id, seed_pool, window=1)
    all_results = combined + neighbors

    deduped: Dict[str, Dict] = {}
    for result in all_results:
        cid = result['chunk_id']
        score = float(result.get('retrieval_score', 0.0))
        if cid not in deduped or score > float(deduped[cid].get('retrieval_score', 0.0)):
            deduped[cid] = result
    final = list(deduped.values())
    final.sort(key=lambda chunk: (-float(chunk.get('retrieval_score', 0.0)), chunk.get('file_name', ''), chunk.get('chunk_index', 0)))
    return final[:max(top_k * 6, 40)]


def create_conversation(user_id: str, title: str) -> UUID:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('insert into conversations (user_id, title) values (%s, %s) returning id;', (user_id, title))
            cid = cur.fetchone()[0]
            conn.commit()
    return cid


def conversation_exists(user_id: str, conversation_id: UUID) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('select id from conversations where id = %s and user_id = %s limit 1;', (conversation_id, user_id))
            return cur.fetchone() is not None


def create_message(conversation_id: UUID, user_id: str, role: str, content: str, sources: Optional[List[Dict]] = None) -> UUID:
    query = 'insert into messages (conversation_id, user_id, role, content, sources) values (%s, %s, %s, %s, %s) returning id;'
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (conversation_id, user_id, role, content, Json(sources) if sources is not None else None))
            mid = cur.fetchone()[0]
            conn.commit()
    return mid


def list_conversations(user_id: str) -> List[Dict]:
    query = '''
        select c.id, c.user_id, c.title, c.created_at, count(m.id) as messages_count
        from conversations c
        left join messages m on m.conversation_id = c.id
        where c.user_id = %s
        group by c.id, c.user_id, c.title, c.created_at
        order by c.created_at desc;
    '''
    items: List[Dict] = []
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            for row in cur.fetchall():
                items.append({'id': str(row[0]), 'user_id': row[1], 'title': row[2], 'created_at': row[3].isoformat() if row[3] else None, 'messages_count': row[4]})
    return items


def get_conversation_messages(user_id: str, conversation_id: UUID) -> List[Dict]:
    query = '''
        select m.id, m.conversation_id, m.user_id, m.role, m.content, m.sources, m.created_at
        from messages m
        join conversations c on m.conversation_id = c.id
        where m.conversation_id = %s and c.user_id = %s
        order by m.created_at asc;
    '''
    messages: List[Dict] = []
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (conversation_id, user_id))
            for row in cur.fetchall():
                messages.append({
                    'id': str(row[0]), 'conversation_id': str(row[1]), 'user_id': row[2], 'role': row[3],
                    'content': row[4], 'sources': row[5], 'created_at': row[6].isoformat() if row[6] else None,
                })
    return messages
