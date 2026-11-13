import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import FileResponse
from app.config import settings
from app.database import get_db_connection
from app.services.audio_service import audio_service
from app.services.transcription_service import transcription_service
from app.models.schemas import VoiceUploadResponse, VoiceUpdateRequest, TranscribeRequest, TranscribeResponse

router = APIRouter(prefix="/api", tags=["Voices"])

@router.post("/voice/upload", response_model=VoiceUploadResponse)
async def upload_voice(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    consent_confirmed: bool = Form(...),
):
    if not consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Explicit voice ownership or authorization consent is required to process audio."
        )

    voice_id = str(uuid.uuid4())
    voice_name = name.strip() if name and name.strip() else f"Voice Sample {voice_id[:8]}"
    
    # Save uploaded file to temp location first
    temp_upload_path = settings.TEMP_DIR / f"upload_{voice_id}_{file.filename}"
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")
        if len(content) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=400, detail="Audio file exceeds 50MB limit.")

        with open(temp_upload_path, "wb") as f:
            f.write(content)

        # Standardize to 24kHz mono WAV in storage/voices/
        final_wav_path = settings.VOICES_DIR / f"{voice_id}.wav"
        duration, sample_rate = audio_service.validate_and_convert_to_wav(
            temp_upload_path, final_wav_path, target_sr=settings.TARGET_SAMPLE_RATE
        )

        if duration < 1.0:
            raise HTTPException(status_code=400, detail="Voice recording is too short. Please provide at least 1-2 seconds of clear speech.")

        # Persist record in SQLite
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO voices (id, name, file_path, duration_seconds, sample_rate, consent_confirmed)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (voice_id, voice_name, str(final_wav_path), duration, sample_rate, 1 if consent_confirmed else 0)
        )
        conn.commit()

        cursor.execute("SELECT * FROM voices WHERE id = ?", (voice_id,))
        row = cursor.fetchone()
        conn.close()

        return VoiceUploadResponse(
            id=row["id"],
            name=row["name"],
            file_path=row["file_path"],
            duration_seconds=row["duration_seconds"],
            sample_rate=row["sample_rate"],
            consent_confirmed=bool(row["consent_confirmed"]),
            transcription=row["transcription"],
            created_at=str(row["created_at"])
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid audio file: {str(e)}")
    finally:
        if temp_upload_path.exists():
            try:
                temp_upload_path.unlink()
            except Exception:
                pass

@router.get("/voice/{voice_id}/audio")
async def get_voice_audio(voice_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM voices WHERE id = ?", (voice_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not Path(row["file_path"]).exists():
        raise HTTPException(status_code=404, detail="Voice audio file not found")

    return FileResponse(row["file_path"], media_type="audio/wav")

@router.post("/voice/{voice_id}/transcribe", response_model=TranscribeResponse)
async def transcribe_voice(voice_id: str, req: TranscribeRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path, transcription FROM voices WHERE id = ?", (voice_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Voice not found")

    file_path = row["file_path"]

    # Use manual transcription if supplied
    if req.manual_transcription and req.manual_transcription.strip():
        text = req.manual_transcription.strip()
    else:
        # Run auto-transcribe with optional language hint (e.g. 'kn' for Kannada)
        text = transcription_service.transcribe_audio(file_path, language=req.language)

    cursor.execute("UPDATE voices SET transcription = ? WHERE id = ?", (text, voice_id))
    conn.commit()
    conn.close()

    return TranscribeResponse(transcription=text)

@router.get("/voices", response_model=List[VoiceUploadResponse])
async def list_voices():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM voices ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [
        VoiceUploadResponse(
            id=r["id"],
            name=r["name"],
            file_path=r["file_path"],
            duration_seconds=r["duration_seconds"],
            sample_rate=r["sample_rate"],
            consent_confirmed=bool(r["consent_confirmed"]),
            transcription=r["transcription"],
            created_at=str(r["created_at"])
        )
        for r in rows
    ]

@router.patch("/voices/{voice_id}", response_model=VoiceUploadResponse)
async def update_voice(voice_id: str, updates: VoiceUpdateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM voices WHERE id = ?", (voice_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Voice not found")

    new_name = updates.name if updates.name is not None else row["name"]
    new_transcription = updates.transcription if updates.transcription is not None else row["transcription"]

    cursor.execute("UPDATE voices SET name = ?, transcription = ? WHERE id = ?", (new_name, new_transcription, voice_id))
    conn.commit()
    cursor.execute("SELECT * FROM voices WHERE id = ?", (voice_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return VoiceUploadResponse(
        id=updated_row["id"],
        name=updated_row["name"],
        file_path=updated_row["file_path"],
        duration_seconds=updated_row["duration_seconds"],
        sample_rate=updated_row["sample_rate"],
        consent_confirmed=bool(updated_row["consent_confirmed"]),
        transcription=updated_row["transcription"],
        created_at=str(updated_row["created_at"])
    )

@router.delete("/voices/{voice_id}")
async def delete_voice(voice_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM voices WHERE id = ?", (voice_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Voice not found")

    file_path = Path(row["file_path"])
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

    cursor.execute("DELETE FROM voices WHERE id = ?", (voice_id,))
    conn.commit()
    conn.close()

    return {"message": "Voice and audio file successfully deleted"}

