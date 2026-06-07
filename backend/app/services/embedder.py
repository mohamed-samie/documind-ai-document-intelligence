from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

from app.core.config import settings


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(settings.EMBEDDING_MODEL)


def _prepare_text(text: str) -> str:
    return ' '.join((text or '').split())[:8000]


def generate_embedding(text: str) -> List[float]:
    model = get_embedding_model()
    embedding = model.encode(
        _prepare_text(text),
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return embedding.tolist()


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = model.encode(
        [_prepare_text(text) for text in texts],
        convert_to_numpy=True,
        normalize_embeddings=True,
        batch_size=32,
        show_progress_bar=False,
    )
    return embeddings.tolist()
