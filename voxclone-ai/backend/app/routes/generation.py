import asyncio
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.config import settings
from app.database import get_db_connection
from app.services.f5_tts_service import f5_tts_service
from app.models.schemas import (
    GenerationCreateRequest,
    GenerationResponse,
    GenerationRecordSchema
)

router = APIRouter(prefix="/api", tags=["Speech Generation"])

@router.post("/voice/{voice_id}/generate", response_model=GenerationResponse)
async def generate_speech(voice_id: str, req: GenerationCreateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM voices WHERE id = ?", (voice_id,))
    voice = cursor.fetchone()

    if not voice:
        conn.close()
        raise HTTPException(status_code=404, detail="Reference voice not found")

    ref_audio_path = voice["file_path"]
    if not Path(ref_audio_path).exists():
        conn.close()
        raise HTTPException(status_code=404, detail="Voice audio file missing from storage")

    # Use supplied ref_text or fallback to stored voice transcription
    ref_text = (req.ref_text or voice["transcription"] or "").strip()
    if not ref_text:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Reference transcription is required for F5-TTS conditioning. Please transcribe or enter the reference audio text."
        )

    generation_id = str(uuid.uuid4())
    output_wav_path = settings.GENERATED_DIR / f"{generation_id}.wav"
    
    # Insert initial pending record
    cursor.execute(
        """
        INSERT INTO generations (
            id, voice_id, voice_name, input_text, ref_text, output_file_path, 
            status, nfe_steps, speed, cfg_strength
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            generation_id, voice_id, voice["name"], req.target_text, ref_text,
            str(output_wav_path), "processing", req.nfe_steps, req.speed, req.cfg_strength
        )
    )
    conn.commit()
    conn.close()

    try:
        # Run inference in a worker thread so event loop remains responsive
        duration, sample_rate = await asyncio.to_thread(
            f5_tts_service.generate_speech,
            ref_audio_path=ref_audio_path,
            ref_text=ref_text,
            gen_text=req.target_text,
            output_wav_path=str(output_wav_path),
            nfe_steps=req.nfe_steps or 32,
            speed=req.speed or 1.0,
            cfg_strength=req.cfg_strength or 2.0
        )

        status_info = f5_tts_service.get_model_status()
        device_used = status_info["device"]

        # Update record to completed
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE generations 
            SET status = 'completed', duration_seconds = ?, device_used = ?
            WHERE id = ?
            """,
            (duration, device_used, generation_id)
        )
        conn.commit()
        conn.close()

        audio_url = f"/api/audio/{generation_id}"
        return GenerationResponse(
            generation_id=generation_id,
            audio_url=audio_url,
            status="completed"
        )

    except Exception as e:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE generations 
            SET status = 'failed', error_message = ?
            WHERE id = ?
            """,
            (str(e), generation_id)
        )
        conn.commit()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Voice synthesis failed: {str(e)}")

@router.get("/generation/{generation_id}/status", response_model=GenerationRecordSchema)
async def get_generation_status(generation_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM generations WHERE id = ?", (generation_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Generation record not found")

    return GenerationRecordSchema(
        id=row["id"],
        voice_id=row["voice_id"],
        voice_name=row["voice_name"],
        input_text=row["input_text"],
        ref_text=row["ref_text"],
        output_file_path=row["output_file_path"],
        duration_seconds=row["duration_seconds"],
        status=row["status"],
        error_message=row["error_message"],
        device_used=row["device_used"],
        nfe_steps=row["nfe_steps"],
        speed=row["speed"],
        cfg_strength=row["cfg_strength"],
        created_at=str(row["created_at"])
    )

@router.get("/audio/{generation_id}")
async def get_audio(generation_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT output_file_path, status FROM generations WHERE id = ?", (generation_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not row["output_file_path"]:
        raise HTTPException(status_code=404, detail="Audio file not found")

    file_path = Path(row["output_file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Generated audio file missing from storage")

    return FileResponse(
        file_path,
        media_type="audio/wav",
        filename=f"voxclone_{generation_id[:8]}.wav",
        headers={"Content-Disposition": f"inline; filename=voxclone_{generation_id[:8]}.wav"}
    )

@router.get("/history", response_model=List[GenerationRecordSchema])
async def list_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM generations ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [
        GenerationRecordSchema(
            id=r["id"],
            voice_id=r["voice_id"],
            voice_name=r["voice_name"],
            input_text=r["input_text"],
            ref_text=r["ref_text"],
            output_file_path=r["output_file_path"],
            duration_seconds=r["duration_seconds"],
            status=r["status"],
            error_message=r["error_message"],
            device_used=r["device_used"],
            nfe_steps=r["nfe_steps"],
            speed=r["speed"],
            cfg_strength=r["cfg_strength"],
            created_at=str(r["created_at"])
        )
        for r in rows
    ]

@router.delete("/history/{generation_id}")
async def delete_generation(generation_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT output_file_path FROM generations WHERE id = ?", (generation_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Generation record not found")

    if row["output_file_path"]:
        file_path = Path(row["output_file_path"])
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass

    cursor.execute("DELETE FROM generations WHERE id = ?", (generation_id,))
    conn.commit()
    conn.close()

    return {"message": "Generation record and audio file deleted"}

@router.post("/settings/cleanup")
async def cleanup_temporary():
    deleted_count = 0
    for f in settings.TEMP_DIR.glob("*"):
        if f.is_file():
            try:
                f.unlink()
                deleted_count += 1
            except Exception:
                pass
    return {"message": "Cleanup completed", "deleted_count": deleted_count}

