# Voiceover: one WAV per line of narration.txt (out/voice-1.wav ...), spoken by Kokoro TTS (Apache 2.0)
# with a male narrator voice, slightly slowed. Needs `pip install kokoro-onnx soundfile` and the model
# files in scripts/intro-video/voice/ (see README.md). Run from the repo root:
#   python3 scripts/intro-video/narration.py [voice]      (default am_onyx)
import sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

D = "scripts/intro-video"
VOICE = sys.argv[1] if len(sys.argv) > 1 else "am_onyx"
LANG = "en-gb" if VOICE.startswith("b") else "en-us"
k = Kokoro(f"{D}/voice/kokoro-v1.0.onnx", f"{D}/voice/voices-v1.0.bin")
lines = [l.strip() for l in open(f"{D}/narration.txt") if l.strip()]
for i, line in enumerate(lines, 1):
    ph = k.tokenizer.phonemize(line, LANG)
    # "Rolevara" as roll-VAR-uh: the default reading doubles the r.
    ph = ph.replace("ɹoʊlvˈɑːɹɹə", "ɹˌoʊlvˈɑːɹə").replace("ɹəʊlvˈɑːɹə", "ɹˌəʊlvˈɑːɹə")
    audio, sr = k.create(ph, voice=VOICE, speed=0.9, lang=LANG, is_phonemes=True)
    sf.write(f"{D}/out/voice-{i}.wav", np.asarray(audio, dtype=np.float32), sr)
    print(f"voice-{i}.wav {len(audio) / sr:.2f}s  {line}")
