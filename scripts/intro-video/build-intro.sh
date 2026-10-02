#!/usr/bin/env bash
# Builds public/video/intro.{mp4,webm} and the poster: real footage, then the 3D door R, then the office (a man, then a woman, at their desks).
# Needs ffmpeg, the four Pexels clips in scripts/intro-video/clips/ (see README.md), and the door frames
# from render-door.mjs. Run from the repo root: bash scripts/intro-video/build-intro.sh
set -euo pipefail
D=scripts/intro-video; C=$D/clips; O=$D/out; mkdir -p "$O"
N="fps=25,format=yuv420p,setsar=1"
enc() { ffmpeg -loglevel error -y "$@" -an -c:v libx264 -crf 16 -preset fast; }
# Home: the clip is portrait, so a square crop sits over a blurred fill.
enc -ss 1 -t 3.6 -i $C/home-laptop.mp4 -filter_complex "[0:v]crop=2160:2160:0:1650,split[a][b];[a]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=30:2,eq=brightness=-0.06[bg];[b]scale=720:720[fg];[bg][fg]overlay=(W-w)/2:0,$N" $O/A.mp4
enc -ss 0.4 -t 4.0 -i $C/street-walk.mp4 -vf "scale=1280:720,$N" $O/B.mp4
enc -ss 1.6 -t 3.8 -i $C/office-arrival.mp4 -vf "scale=1280:720,$N" $O/C.mp4
enc -framerate 30 -i $O/frames/f%04d.png -vf "scale=1280:720,$N" $O/D.mp4
enc -ss 0 -t 4.0 -i $C/suit-at-desk.mp4 -vf "scale=1280:720,$N" $O/E.mp4
enc -ss 1.5 -t 5.0 -i $C/woman-at-desk.mp4 -vf "scale=1280:720,$N" $O/F.mp4
ffmpeg -loglevel error -y -i $O/A.mp4 -i $O/B.mp4 -i $O/C.mp4 -i $O/D.mp4 -i $O/E.mp4 -i $O/F.mp4 -filter_complex \
  "[0][1]xfade=transition=fade:duration=0.6:offset=2.96[ab];[ab][2]xfade=transition=smoothleft:duration=0.6:offset=6.36[abc];[abc][3]xfade=transition=fadeblack:duration=0.7:offset=9.46[abcd];[abcd][4]xfade=transition=fadewhite:duration=0.5:offset=13.96[abcde];[abcde][5]xfade=transition=fade:duration=0.7:offset=17.26,eq=contrast=1.04:saturation=0.95,vignette=PI/6,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 15 -preset slow $O/master.mp4
ffmpeg -loglevel error -y -i $O/master.mp4 -c:v libx264 -profile:v high -crf 27 -preset slow -movflags +faststart -an public/video/intro.mp4
ffmpeg -loglevel error -y -i $O/master.mp4 -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -deadline good -cpu-used 2 -an public/video/intro.webm
ffmpeg -loglevel error -y -ss 12.3 -i $O/master.mp4 -frames:v 1 -q:v 3 public/video/intro-poster.jpg
ffmpeg -loglevel error -y -i public/video/intro-poster.jpg -c:v libwebp -quality 80 public/video/intro-poster.webp
echo "intro video written to public/video/"
