from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    DATABASE_URL: str = Field(..., description='PostgreSQL/Supabase connection string')
    GROQ_API_KEY: str = Field('', description='Groq API key')
    GROQ_MODEL: str = Field('llama-3.1-8b-instant', description='Groq chat model')
    EMBEDDING_MODEL: str = Field('sentence-transformers/all-MiniLM-L6-v2')
    UPLOAD_DIR: str = Field('uploads')
    MAX_UPLOAD_MB: int = Field(50)
    USER_ID: str = Field('demo-user')


settings = Settings()
