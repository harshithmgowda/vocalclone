import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    PROJECT_NAME: str = "VOXCLONE AI"
    VERSION: str = "1.0.0"
    
    # Storage
    STORAGE_DIR: Path = BASE_DIR / "storage"
    VOICES_DIR: Path = STORAGE_DIR / "voices"
    GENERATED_DIR: Path = STORAGE_DIR / "generated"
    TEMP_DIR: Path = STORAGE_DIR / "temporary"
    DB_PATH: Path = STORAGE_DIR / "database" / "voxclone.db"
    
    # Server
    HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Model configuration
    DEVICE: str = "cuda" if os.getenv("DEVICE", "cuda") == "cuda" else "cpu"
    TARGET_SAMPLE_RATE: int = 24000
    DEFAULT_NFE_STEPS: int = 32
    DEFAULT_CFG_STRENGTH: float = 2.0
    DEFAULT_SPEED: float = 1.0

settings = Settings()

# Ensure directories exist
for d in [settings.STORAGE_DIR, settings.VOICES_DIR, settings.GENERATED_DIR, settings.TEMP_DIR, settings.DB_PATH.parent]:
    d.mkdir(parents=True, exist_ok=True)
