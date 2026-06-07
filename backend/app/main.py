from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.conversations import router as conversations_router
from app.api.documents import router as documents_router
from app.api.folders import router as folders_router

app = FastAPI(
    title='DocuMind API',
    description='Production-oriented multi-document RAG API for PDF, Word, Excel, and CSV files.',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(documents_router)
app.include_router(folders_router)
app.include_router(conversations_router)
app.include_router(chat_router)


@app.get('/')
async def root():
    return {'status': 'ok', 'service': 'DocuMind API'}


@app.get('/health')
async def health():
    return {'status': 'healthy'}
