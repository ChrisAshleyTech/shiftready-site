#!/usr/bin/env bash
# Builds public/video/intro.{mp4,webm}, its poster and captions: home, the commute, the office, then the
# 3D door R reveal and the end card, with soft music and a voiceover. Needs ffmpeg, the Pexels clips in
# scripts/intro-video/clips/ (see README.md), and out/ filled by render-door.mjs, endcard.mjs, music.py
# and narration.sh. Run from the repo root: bash scripts/intro-video/build-intro.sh
set -euo pipefail
D=scripts/intro-video; C=$D/clips; O=$D/out
N="fps=25,format=yuv420p,setsar=1"
enc() { ffmpeg -loglevel error -y "$@" -an -c:v libx264 -crf 16 -preset fast; }
# Portrait clips: a square crop over a blurred fill of itself.
portrait() { enc -ss "$2" -t "$3" -i "$1" -filter_complex "[0:v]crop=2160:2160:0:$4,split[a][b];[a]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=30:2,eq=brightness=-0.06[bg];[b]scale=720:720[fg];[bg][fg]overlay=(W-w)/2:0,$N" "$5"; }
wide() { enc -ss "$2" -t "$3" -i "$1" -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,$N" "$4"; }
portrait $C/home-desk.mp4 1 3.5 960 $O/s1.mp4
portrait $C/home-laptop.mp4 1 3.0 1650 $O/s2.mp4
wide $C/street-walk.mp4 0.4 3.5 $O/s3.mp4
wide $C/office-arrival.mp4 1.6 3.5 $O/s4.mp4
wide $C/team-table.mp4 6 4.0 $O/s5.mp4
wide $C/office-window.mp4 2 3.0 $O/s6.mp4
wide $C/woman-at-desk.mp4 1.5 3.5 $O/s7.mp4
enc -framerate 30 -i $O/frames/f%04d.png -vf "scale=1280:720,$N" $O/s8.mp4
enc -loop 1 -t 5.5 -i $O/endcard.png -vf "scale=1408:792,zoompan=z='1+0.03*on/137':d=1:s=1280x720:fps=25,$N" $O/s9.mp4
# 0.5 s dissolves; shot starts: 0, 3, 5.5, 8.5, 11.5, 15, 17.5, 20.5, 24 -> 29.5 s.
ffmpeg -loglevel error -y $(for i in 1 2 3 4 5 6 7 8 9; do printf -- "-i $O/s$i.mp4 "; done) -filter_complex \
  "[0][1]xfade=fade:duration=0.5:offset=3[a];[a][2]xfade=fade:duration=0.5:offset=5.5[b];[b][3]xfade=fade:duration=0.5:offset=8.5[c];[c][4]xfade=fade:duration=0.5:offset=11.5[d];[d][5]xfade=fade:duration=0.5:offset=15[e];[e][6]xfade=fade:duration=0.5:offset=17.5[f];[f][7]xfade=fadeblack:duration=0.5:offset=20.5[g];[g][8]xfade=fade:duration=0.8:offset=23.7,eq=contrast=1.04:saturation=0.95,vignette=PI/6,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 15 -preset slow $O/picture.mp4
# Voice lines placed on their shots; music ducks under the voice.
ffmpeg -loglevel error -y -i $O/music.wav -i $O/voice-1.wav -i $O/voice-2.wav -i $O/voice-3.wav -i $O/voice-4.wav -i $O/voice-5.wav -filter_complex \
  "[1]adelay=600:all=1[v1];[2]adelay=5800:all=1[v2];[3]adelay=11600:all=1[v3];[4]adelay=21300:all=1[v4];[5]adelay=23900:all=1[v5];[v1][v2][v3][v4][v5]amix=inputs=5:normalize=0,aresample=44100,pan=stereo|c0=c0|c1=c0,volume=1.6,asplit[voice][key];[0]volume=0.5,atrim=0:29.5,afade=t=out:st=27:d=2.5[bed];[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=80:release=600[ducked];[ducked][voice]amix=inputs=2:normalize=0,loudnorm=I=-18:TP=-2[a]" \
  -map "[a]" -c:a pcm_s16le $O/audio.wav
ffmpeg -loglevel error -y -i $O/picture.mp4 -i $O/audio.wav -c:v libx264 -profile:v high -crf 27 -preset slow -c:a aac -b:a 96k -movflags +faststart -shortest public/video/intro.mp4
ffmpeg -loglevel error -y -i $O/picture.mp4 -i $O/audio.wav -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -deadline good -cpu-used 2 -c:a libopus -b:a 80k -shortest public/video/intro.webm
ffmpeg -loglevel error -y -ss 26 -i $O/picture.mp4 -frames:v 1 -q:v 3 public/video/intro-poster.jpg
ffmpeg -loglevel error -y -i public/video/intro-poster.jpg -c:v libwebp -quality 80 public/video/intro-poster.webp
echo "intro video written to public/video/"
