#!/bin/sh
# Encodes the frames from record-demo.mjs (scripts/.demo/frames.txt, 2560x1600) into web-ready files in
# public/video/: demo.mp4 (H.264) and demo.webm (VP9) at 1920x1200, both silent, plus 2x poster stills
# (WebP + JPEG). POSTER_AT is seconds into the film.
set -e
FF="${FFMPEG:-ffmpeg}"
IN=scripts/.demo/frames.txt
OUT=public/video
POSTER_AT="${POSTER_AT:-31}"
VF="fps=30,scale=1920:-2:flags=lanczos,format=yuv420p"
mkdir -p "$OUT"
"$FF" -hide_banner -loglevel error -y -f concat -safe 0 -i "$IN" -vf "fps=30,format=yuv420p" -c:v libx264 -crf 12 -preset fast scripts/.demo/master.mp4
"$FF" -hide_banner -loglevel error -y -i scripts/.demo/master.mp4 -an -vf "$VF" -c:v libx264 -preset slow -tune animation -crf 24 -pix_fmt yuv420p -movflags +faststart "$OUT/demo.mp4"
"$FF" -hide_banner -loglevel error -y -i scripts/.demo/master.mp4 -an -vf "$VF" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -deadline good -cpu-used 2 "$OUT/demo.webm"
"$FF" -hide_banner -loglevel error -y -ss "$POSTER_AT" -i scripts/.demo/master.mp4 -frames:v 1 -c:v libwebp -quality 88 "$OUT/demo-poster.webp"
"$FF" -hide_banner -loglevel error -y -ss "$POSTER_AT" -i scripts/.demo/master.mp4 -frames:v 1 -vf "format=yuvj420p" -q:v 3 "$OUT/demo-poster.jpg"
ls -la "$OUT"
