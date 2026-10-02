#!/usr/bin/env bash
# Builds the promo: out/promo-rejection-{4k,1080p}.mp4 (voice B + music) and out/promo-rejection-music-only-{4k,1080p}.mp4.
# Run from the repo root with `npx vite preview --port 4173` up:
#   CHROME_PATH=/opt/pw-browsers/chromium node scripts/promo-rejection/record.mjs
#   python3 scripts/promo-rejection/voice.py && python3 scripts/promo-rejection/music.py
#   CHROME_PATH=/opt/pw-browsers/chromium node scripts/promo-rejection/render.mjs
#   bash scripts/promo-rejection/build.sh
set -euo pipefail
O=scripts/promo-rejection/out
AT=(900 4750 6850 13750 19600 23900) # voice line start times, ms
ins=""; fil=""; mix=""
for i in 1 2 3 4 5 6; do ins+=" -i $O/v-$i.wav"; fil+="[$i]adelay=${AT[$((i-1))]}:all=1[v$i];"; mix+="[v$i]"; done
ffmpeg -loglevel error -y -i $O/music.wav $ins -filter_complex \
  "${fil}${mix}amix=inputs=6:normalize=0,aresample=44100,pan=stereo|c0=c0|c1=c0,volume=1.7,apad=whole_dur=28.6,asplit[voice][key];[0]volume=0.8[bed];[bed][key]sidechaincompress=threshold=0.03:ratio=4:attack=40:release=400[ducked];[ducked][voice]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]" \
  -map "[a]" -ar 44100 $O/audio-voice.wav
ffmpeg -loglevel error -y -i $O/music.wav -af "loudnorm=I=-14:TP=-1.5" -ar 44100 $O/audio-music.wav
# 4K vertical master (2160x3840) and a 1080x1920 copy, both at a high bitrate.
for v in voice music; do
  name=promo-rejection; [ $v = music ] && name=promo-rejection-music-only
  ffmpeg -loglevel error -y -framerate 30 -i $O/frames/f%05d.jpg -i $O/audio-$v.wav -c:v libx264 -profile:v high -level 5.2 -crf 14 -preset slow \
    -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest $O/$name-4k.mp4
  ffmpeg -loglevel error -y -i $O/$name-4k.mp4 -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -profile:v high -crf 15 -preset slow -b:v 0 \
    -pix_fmt yuv420p -c:a copy -movflags +faststart $O/$name-1080p.mp4
done
ffmpeg -loglevel error -y -i $O/frames/f00054.jpg -q:v 1 $O/cover.jpg
ls -la $O/*.mp4
