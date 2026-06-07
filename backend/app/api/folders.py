from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.db.document_repository import create_folder, delete_folder, list_folders, rename_folder

router = APIRouter(prefix='/folders', tags=['Folders'])


class CreateFolderRequest(BaseModel):
    name: str


class RenameFolderRequest(BaseModel):
    name: str


@router.get('')
async def get_folders():
    folders = list_folders(settings.USER_ID)
    return {'folders_count': len(folders), 'folders': folders}


@router.post('')
async def add_folder(request: CreateFolderRequest):
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail='Folder name cannot be empty.')
    folder = create_folder(settings.USER_ID, name)
    return {'message': 'Folder created successfully', 'folder': folder}


@router.patch('/{folder_id}')
async def update_folder(folder_id: UUID, request: RenameFolderRequest):
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail='Folder name cannot be empty.')
    folder = rename_folder(settings.USER_ID, folder_id, name)
    if not folder:
        raise HTTPException(status_code=404, detail='Folder not found.')
    return {'message': 'Folder renamed successfully', 'folder': folder}


@router.delete('/{folder_id}')
async def remove_folder(folder_id: UUID):
    deleted = delete_folder(settings.USER_ID, folder_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='Folder not found.')
    return {'message': 'Folder deleted successfully', 'folder_id': str(folder_id)}
