#!/bin/sh
# Encodes scripts/.demo/raw.webm (from record-demo.mjs) into web-ready files in public/video/:
# demo.mp4 (H.264), demo.webm (VP9), both silent, plus poster stills (WebP + JPEG).
set -e
FF="${FFMPEG:-ffmpeg}"
IN=scripts/.demo/raw.webm
OUT=public/video
POSTER_AT="${POSTER_AT:-33.7}"
mkdir -p "$OUT"
"$FF" -hide_banner -loglevel error -y -i "$IN" -an -vf "fps=24,scale=1280:-2:flags=lanczos" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart "$OUT/demo.mp4"
"$FF" -hide_banner -loglevel error -y -i "$IN" -an -vf "fps=24,scale=1280:-2:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -deadline good -cpu-used 2 "$OUT/demo.webm"
"$FF" -hide_banner -loglevel error -y -ss "$POSTER_AT" -i "$IN" -frames:v 1 -vf "scale=1280:-2:flags=lanczos" -c:v libwebp -quality 82 "$OUT/demo-poster.webp"
"$FF" -hide_banner -loglevel error -y -ss "$POSTER_AT" -i "$IN" -frames:v 1 -vf "scale=1280:-2:flags=lanczos,format=yuvj420p" -q:v 4 "$OUT/demo-poster.jpg"
ls -la "$OUT"
