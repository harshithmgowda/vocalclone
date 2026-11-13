import requests
import json
import soundfile as sf
import io

def run_integration_test():
    print("==================================================")
    print("   VOXCLONE AI — LIVE INTEGRATION TEST")
    print("==================================================")

    # 1. Health
    print("[1/5] Checking GET /api/health...")
    h = requests.get("http://127.0.0.1:8000/api/health")
    assert h.status_code == 200, f"Health check failed: {h.text}"
    health_data = h.json()
    print(f"      Status: {health_data['status']}")
    print(f"      Model Status: {health_data['model_status']}")
    print(f"      Accelerator: {health_data['gpu_name']} ({health_data['device']})")

    # 2. Voices
    print("\n[2/5] Checking GET /api/voices...")
    v = requests.get("http://127.0.0.1:8000/api/voices")
    assert v.status_code == 200, f"Voices check failed: {v.text}"
    voices = v.json()
    assert len(voices) > 0, "No voices found!"
    voice = voices[0]
    print(f"      Found {len(voices)} voice(s). Selected: '{voice['name']}' (ID: {voice['id']})")
    print(f"      Reference Transcript: '{voice['transcription']}'")

    # 3. Speech Generation
    print("\n[3/5] Triggering POST /api/voice/{id}/generate with F5-TTS...")
    payload = {
        "target_text": "Hello Harshith! VoxClone AI is fully operational with your NVIDIA RTX 5050 GPU.",
        "ref_text": voice["transcription"],
        "nfe_steps": 16,
        "speed": 1.0,
        "cfg_strength": 2.0
    }
    gen_res = requests.post(f"http://127.0.0.1:8000/api/voice/{voice['id']}/generate", json=payload)
    assert gen_res.status_code == 200, f"Generation failed: {gen_res.text}"
    gen_data = gen_res.json()
    print(f"      Generation ID: {gen_data['generation_id']}")
    print(f"      Status: {gen_data['status']}")
    print(f"      Audio URL: {gen_data['audio_url']}")

    # 4. Stream Audio
    print("\n[4/5] Checking GET /api/audio/{generation_id}...")
    audio_res = requests.get(f"http://127.0.0.1:8000{gen_data['audio_url']}")
    assert audio_res.status_code == 200, f"Audio fetch failed: {audio_res.status_code}"
    audio_bytes = audio_res.content
    print(f"      Audio Bytes Received: {len(audio_bytes)} bytes")
    
    # Verify WAV header with soundfile
    with sf.SoundFile(io.BytesIO(audio_bytes)) as f:
        print(f"      Decoded WAV Duration: {len(f) / f.samplerate:.2f}s at {f.samplerate}Hz ({f.channels} channel)")
        assert f.samplerate == 24000
        assert len(f) > 0

    # 5. History
    print("\n[5/5] Checking GET /api/history...")
    hist_res = requests.get("http://127.0.0.1:8000/api/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    print(f"      Total Generations in History: {len(history)}")

    print("\n==================================================")
    print("   ALL TESTS PASSED! VOXCLONE AI IS 100% OPERATIONAL")
    print("==================================================")

if __name__ == "__main__":
    run_integration_test()

