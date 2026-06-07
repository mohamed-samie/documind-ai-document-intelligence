import os
import shutil
from pathlib import Path
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.db.document_repository import (
    create_document,
    delete_document,
    document_exists,
    insert_document_chunks,
    list_documents,
    update_document_folder,
)
from app.services.chunker import chunk_text
from app.services.embedder import generate_embeddings
from app.services.file_parser import SUPPORTED_EXTENSIONS, parse_file

router = APIRouter(prefix='/documents', tags=['Documents'])


class UpdateDocumentFolderRequest(BaseModel):
    folder_id: Optional[UUID] = None


@router.get('')
async def get_documents():
    user_id = settings.USER_ID
    documents = list_documents(user_id)
    return {'documents_count': len(documents), 'documents': documents}


@router.patch('/{document_id}/folder')
async def move_document_to_folder(document_id: UUID, request: UpdateDocumentFolderRequest):
    document = update_document_folder(settings.USER_ID, document_id, request.folder_id)
    if not document:
        raise HTTPException(status_code=404, detail='Document not found.')
    return {'message': 'Document folder updated successfully', 'document': document}


@router.delete('/{document_id}')
async def remove_document(document_id: UUID):
    deleted = delete_document(settings.USER_ID, document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='Document not found.')
    return {'message': 'Document deleted successfully', 'document_id': str(document_id)}


def _safe_upload_path(original_filename: str) -> tuple[str, str, str]:
    extension = Path(original_filename).suffix.lower()
    safe_stem = Path(original_filename).stem.strip().replace('/', '_').replace('\\', '_') or 'document'
    stored_filename = f'{uuid4().hex}_{safe_stem}{extension}'
    return extension, stored_filename, os.path.join(settings.UPLOAD_DIR, stored_filename)


@router.post('/upload')
async def upload_document(file: UploadFile = File(...), folder_id: Optional[UUID] = Form(None)):
    if not file.filename:
        raise HTTPException(status_code=400, detail='File name is missing.')

    extension, stored_filename, file_path = _safe_upload_path(file.filename)
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{extension}'. Supported types: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")

    if document_exists(settings.USER_ID, file.filename):
        raise HTTPException(status_code=409, detail='A document with this file name already exists.')

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    try:
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        if os.path.getsize(file_path) > max_bytes:
            raise HTTPException(status_code=413, detail=f'File is too large. Max size is {settings.MAX_UPLOAD_MB} MB.')

        pages = parse_file(file_path)
        if not pages:
            raise HTTPException(status_code=400, detail='Could not read any content from this file.')

        chunks = chunk_text(pages)
        if not chunks:
            raise HTTPException(status_code=400, detail='No readable text was found in this file.')

        embeddings = generate_embeddings([chunk['text'] for chunk in chunks])
        if len(embeddings) != len(chunks):
            raise HTTPException(status_code=500, detail='Embedding count does not match chunk count.')

        document_id = create_document(
            user_id=settings.USER_ID,
            file_name=file.filename,
            file_type=extension.lstrip('.'),
            total_pages=len(pages),
            total_chunks=len(chunks),
            folder_id=folder_id,
        )
        inserted = insert_document_chunks(document_id, settings.USER_ID, chunks, embeddings)

        preview = ''
        for page in pages[:2]:
            preview += f"\n\n--- Page {page['page_number']} ---\n{page.get('text', '')[:1000]}"

        return {
            'message': 'Document uploaded, parsed, chunked, embedded, and saved successfully',
            'document_id': str(document_id),
            'folder_id': str(folder_id) if folder_id else None,
            'file_name': file.filename,
            'stored_filename': stored_filename,
            'file_type': extension.lstrip('.'),
            'total_pages': len(pages),
            'total_characters': sum(len(page.get('text', '')) for page in pages),
            'total_chunks': len(chunks),
            'embedded_chunks_count': len(embeddings),
            'inserted_chunks_count': inserted,
            'embedding_dimensions': len(embeddings[0]) if embeddings else 0,
            'preview': preview,
            'chunks_preview': chunks[:3],
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f'Upload failed: {str(error)}')
    finally:
        try:
            file.file.close()
        except Exception:
            pass
