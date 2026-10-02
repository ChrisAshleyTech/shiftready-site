# Landing intro video

`public/video/intro.{mp4,webm}` (about 29 seconds, loops) opens the landing page. It shows people
working from home, the commute, and an identity team at the office, then the 3D Rolevara door R reveal
and the logo end card, over music and one spoken line. The site autoplays it muted with captions
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

- `music.py` synthesizes the soft music bed (an original piece made in code, so there's no licence to track).
  There's no talking over the footage.
- `narration.py` speaks `narration.txt` (only the closing line, "Rolevara. Experience the role. Master the work.") with Kokoro TTS v1.0 (Apache 2.0), voice `am_onyx`, slightly
  slowed. A recorded read of `narration.txt` can replace `out/voice-*.wav`. To set it up, run
  `pip install kokoro-onnx soundfile` and put `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the
  kokoro-onnx GitHub release `model-files-v1.0` in `voice/`.
- If the narration changes, update the line start times in `build-intro.sh` (VOICE_AT) and `public/video/intro.vtt`.

```
node scripts/intro-video/render-door.mjs      # 3D frames into out/frames
node scripts/intro-video/endcard.mjs          # out/endcard.png
python3 scripts/intro-video/music.py          # out/music.wav
python3 scripts/intro-video/narration.py      # out/voice-1.wav ...
bash scripts/intro-video/build-intro.sh       # edits everything into public/video/
```
