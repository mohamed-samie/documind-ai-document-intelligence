from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.db.document_repository import get_conversation_messages, list_conversations

router = APIRouter(prefix='/conversations', tags=['Conversations'])


@router.get('')
async def get_conversations():
    conversations = list_conversations(settings.USER_ID)
    return {'conversations_count': len(conversations), 'conversations': conversations}


@router.get('/{conversation_id}')
async def get_conversation(conversation_id: UUID):
    messages = get_conversation_messages(settings.USER_ID, conversation_id)
    if not messages:
        raise HTTPException(status_code=404, detail='Conversation not found or has no messages.')
    return {'conversation_id': str(conversation_id), 'messages_count': len(messages), 'messages': messages}
