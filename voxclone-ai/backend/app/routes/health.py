from fastapi import APIRouter
from app.services.f5_tts_service import f5_tts_service
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health & Model"])

@router.get("/api/health", response_model=HealthResponse)
async def get_health():
    status_info = f5_tts_service.get_model_status()
    return HealthResponse(
        status="ok",
        model_status=status_info["model_status"],
        model_loaded=status_info["model_loaded"],
        device=status_info["device"],
        cuda_available=status_info["cuda_available"],
        gpu_name=status_info["gpu_name"],
        vram_allocated_mb=status_info["vram_allocated_mb"],
        vram_total_mb=status_info["vram_total_mb"],
    )

@router.get("/api/model/status")
async def get_model_status():
    return f5_tts_service.get_model_status()

