"""Generate dedicated public samples from built-in presets (never private clones)."""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / 'Voice-Backend'))
from app.tts_engine import TTSEngine

output = root / 'Voice-Frontend' / 'public' / 'audio'
output.mkdir(parents=True, exist_ok=True)
engine = TTSEngine()
engine.load()
presets = engine._engine.list_preset_voices()[:3]
text = 'Mỗi ý tưởng đều xứng đáng được lắng nghe. Với DreamHigh Voice, hãy biến những dòng chữ thành câu chuyện mang thanh âm của riêng bạn.'
manifest = []
for index, (label, voice_id) in enumerate(presets, 1):
    target = output / f'voice-{index}.wav'
    audio = engine._engine.infer(text, voice=voice_id)
    engine._engine.save(audio, str(target))
    manifest.append({'file': target.name, 'preset': label, 'text': text, 'engine': 'VieNeu v3 Turbo'})
    print(f'Generated {target.name}', flush=True)
(output / 'samples.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
