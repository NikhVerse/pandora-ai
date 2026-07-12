import os
from pydantic_settings import BaseSettings
from typing import Optional

# Resolve root .env path relative to this file location
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env")

class Settings(BaseSettings):
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    FIREWORKS_API_KEY: Optional[str] = None
    FIREWORKS_MODEL: Optional[str] = None
    FIREWORKS_BASE_URL: Optional[str] = None
    TEMPERATURE: float = 0.2
    TOP_P: float = 0.9
    MAX_TOKENS: int = 4096
    STREAM: bool = True

    class Config:
        env_file = dotenv_path
        extra = "ignore"

# Make settings globally accessible
settings = Settings()
