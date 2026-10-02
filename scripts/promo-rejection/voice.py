# Voice lines for the promo (out/v-1.wav ...), Kokoro TTS v1.0 (Apache 2.0), voice am_onyx ("voice B").
# Model files: scripts/intro-video/voice/ (see scripts/intro-video/README.md). Run from the repo root.
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("scripts/intro-video/voice/kokoro-v1.0.onnx", "scripts/intro-video/voice/voices-v1.0.bin")
LINES = ["Tired of getting this?", "They want experience. So get it.", "Work a real ticket queue.",
         "Get graded like it's the real job.", "Then show them you can do the job.", "Rolevara. Experience the role. Master the work."]
for i, line in enumerate(LINES, 1):
    ph = k.tokenizer.phonemize(line, "en-us").replace("ɹoʊlvˈɑːɹɹə", "ɹˌoʊlvˈɑːɹə")
    a, sr = k.create(ph, voice="am_onyx", speed=1.0 if i < 6 else 0.9, lang="en-us", is_phonemes=True)
    a = np.asarray(a, dtype=np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 400): nz[-1] + 2400]
    sf.write(f"scripts/promo-rejection/out/v-{i}.wav", a, sr); print(i, f"{len(a)/sr:.2f}s", line)
