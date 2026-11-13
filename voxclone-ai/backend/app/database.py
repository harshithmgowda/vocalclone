import sqlite3
from typing import List, Optional, Dict, Any
from pathlib import Path
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Voices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS voices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        duration_seconds REAL NOT NULL,
        sample_rate INTEGER NOT NULL,
        consent_confirmed INTEGER NOT NULL DEFAULT 1,
        transcription TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Generations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        voice_id TEXT NOT NULL,
        voice_name TEXT,
        input_text TEXT NOT NULL,
        ref_text TEXT NOT NULL,
        output_file_path TEXT,
        duration_seconds REAL,
        status TEXT NOT NULL,
        error_message TEXT,
        device_used TEXT,
        nfe_steps INTEGER,
        speed REAL,
        cfg_strength REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voice_id) REFERENCES voices (id) ON DELETE SET NULL
    );
    """)
    
    conn.commit()
    conn.close()

# Auto-init upon import
init_db()

