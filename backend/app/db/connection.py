from contextlib import contextmanager

import psycopg

from app.core.config import settings


@contextmanager
def get_db_connection():
    conn = psycopg.connect(settings.DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()
