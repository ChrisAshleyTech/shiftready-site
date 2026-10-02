# Landing intro video

`public/video/intro.{mp4,webm}` (about 29 seconds, loops) opens the landing page. It shows people
working from home, the commute, and an identity team at the office, then the 3D Rolevara door R reveal
and the logo end card, over soft music and a voiceover. The site autoplays it muted with captions
(`public/video/intro.vtt`), and a "Sound on" button turns the audio on.

## Footage

Free stock clips from Pexels (Pexels License: free to use, no attribution required), chosen and
downloaded by Christopher. They are not committed (4K originals, about 150 MB). To rebuild, download them
from Pexels into `clips/` under these names:

| File | Pexels video | Used for |
| --- | --- | --- |
| `clips/home-desk.mp4` | 7010228 (portrait) | A woman working at her desk at home |
| `clips/home-laptop.mp4` | 8434046 (portrait) | A man working on the sofa at home |
| `clips/street-walk.mp4` | 7255362 | Walking between office buildings |
| `clips/office-arrival.mp4` | 7224870 | Arriving at the office |
| `clips/team-table.mp4` | 7534581 | A team at a table in the office |
| `clips/office-window.mp4` | 5637944 | A man by the office window |
| `clips/woman-at-desk.mp4` | 8632589 | A woman in a blazer at her desk |

## Picture

- `door3d.html` lights the door R in 3D. It's extruded with three.js from Christopher's logo (`door-r.svg`
  and `door-step.svg`, traced from `brand-source/rolevara-mark.png`), held face-on with one slow light
  sweep. `render-door.mjs` renders it to frames.
- `endcard.mjs` renders the end card from `public/brand/rolevara-logo-dark.png` and the tagline.

## Sound

- `music.py` synthesizes the music bed (an original piece made in code, so there's no licence to track).
- `narration.sh` speaks `narration.txt` with Piper TTS, using the LibriTTS "high" voice, speaker 140.
  The LibriTTS dataset is CC BY 4.0 (Zen et al., openslr.org/60). This is a draft voice, and a recorded
  read of `narration.txt` can replace `out/voice-*.wav`. To set it up, run `pip install piper-tts` and
  put `en-us-libritts-high.onnx` and its `.json` from the Piper v0.0.2 GitHub release
  (`voice-en-us-libritts-high.tar.gz`) in `voice/`.
- If the narration changes, update the line start times in `build-intro.sh` (VOICE_AT) and `public/video/intro.vtt`.

```
node scripts/intro-video/render-door.mjs      # 3D frames into out/frames
node scripts/intro-video/endcard.mjs          # out/endcard.png
python3 scripts/intro-video/music.py          # out/music.wav
bash scripts/intro-video/narration.sh         # out/voice-1.wav ...
bash scripts/intro-video/build-intro.sh       # edits everything into public/video/
```
