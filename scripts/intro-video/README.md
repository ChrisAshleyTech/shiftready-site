# Landing intro video

`public/video/intro.{mp4,webm}` (about 19 seconds, muted, loops) is the opening of the landing page:
someone working from home, people walking through the city to the office, the 3D Rolevara door R,
then a person in a suit at their desk.

## Footage

Free stock clips from Pexels (Pexels License: free to use, no attribution required), chosen and
downloaded by Christopher. They are not committed (4K originals, about 70 MB). To rebuild, download them
from Pexels into `clips/` under these names:

| File | Pexels video | Used for |
| --- | --- | --- |
| `clips/home-laptop.mp4` | 8434046 (portrait, 2160x4096) | Working on a laptop at home |
| `clips/street-walk.mp4` | 7255362 | Walking between office buildings |
| `clips/office-arrival.mp4` | 7224870 | Arriving at the office |
| `clips/suit-at-desk.mp4` | 8061445 | In a suit at the desk |

## 3D door R

`door3d.html` extrudes the door R from Christopher's logo (`door-r.svg` and `door-step.svg`, traced from
`brand-source/rolevara-mark.png`) with three.js, and the camera pushes through the doorway.

```
node scripts/intro-video/render-door.mjs      # 150 PNG frames into out/frames
bash scripts/intro-video/build-intro.sh       # edits everything into public/video/
```
