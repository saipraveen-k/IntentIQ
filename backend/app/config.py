import os
import re
import logging
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("intent_iq.config")

# Load .env file explicitly
env_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(env_file_path):
    load_dotenv(dotenv_path=env_file_path, override=False)
else:
    load_dotenv()

def sanitize_database_url(url: str) -> str:
    if not url:
        return "sqlite+aiosqlite:///./intentiq.db"
    
    # Handle PostgreSQL async driver prefix
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    # Clean query parameters for asyncpg compatibility
    if "asyncpg" in url:
        url = url.replace("sslmode=require", "ssl=require")
        url = url.replace("sslmode=verify-full", "ssl=require")
        url = url.replace("sslmode=prefer", "ssl=prefer")
        if "&channel_binding=" in url:
            url = re.sub(r"&channel_binding=[^&]+", "", url)
        elif "?channel_binding=" in url:
            url = re.sub(r"\?channel_binding=[^&]+(&?)", r"?\1", url)
            if url.endswith("?"):
                url = url[:-1]
    return url

class Settings(BaseSettings):
    PROJECT_NAME: str = "IntentIQ API Engine"
    VERSION: str = "1.0.0-HACKATHON"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./intentiq.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Gemini AI
    GEMINI_API_KEY: str = ""
    SECRET_KEY: str = "default_hackathon_secret_key"
    
    # Vector Search
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    VECTOR_DIMENSION: int = 384

    model_config = SettingsConfigDict(
        env_file=env_file_path if os.path.exists(env_file_path) else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
settings.DATABASE_URL = sanitize_database_url(settings.DATABASE_URL)

def get_masked_value(val: str, show_chars: int = 6) -> str:
    if not val:
        return "[NOT SET]"
    if len(val) <= show_chars:
        return "*****"
    return f"{val[:show_chars]}...*****"

def print_loaded_config_safely():
    masked_db = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    logger.info(f"Loaded DATABASE_URL (host): {masked_db}")
    logger.info(f"Loaded GEMINI_API_KEY: {get_masked_value(settings.GEMINI_API_KEY)}")
    logger.info(f"Loaded SECRET_KEY: {get_masked_value(settings.SECRET_KEY)}")

