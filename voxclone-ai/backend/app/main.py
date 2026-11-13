import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.f5_tts_service import f5_tts_service
from app.routes import health, voices, generation

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload the F5-TTS model in the background or during startup
    print(f"[VoxClone AI] Starting backend server on {settings.HOST}:{settings.PORT}")
    try:
        f5_tts_service.initialize_model()
    except Exception as e:
        print(f"[VoxClone AI] Warning during initial model load: {e}")
    yield
    print("[VoxClone AI] Shutting down backend...")
    f5_tts_service.cleanup()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VOXCLONE AI — Personal AI Voice Cloning Studio powered by F5-TTS",
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(voices.router)
app.include_router(generation.router)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tagline": "Your Voice. Your AI. Your Words.",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=False)

