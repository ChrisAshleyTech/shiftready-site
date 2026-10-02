#!/usr/bin/env bash
# Draft voiceover: one WAV per line of narration.txt (out/voice-1.wav ...), spoken by Piper TTS with the
# LibriTTS high voice (CC BY 4.0, speaker 140). Needs `pip install piper-tts` and the voice in
# scripts/intro-video/voice/ (see README.md). Run from the repo root.
set -euo pipefail
D=scripts/intro-video; mkdir -p $D/out; i=0
# Pronunciation fixes: "Rolevara" as roll-VAR-uh (the default reading mangles it), and the question read
# as a firm statement so it doesn't swoop up.
fix() { sed -e 's/Rolevara/[[ ɹˌoʊlvˈɑːɹə ]]/g' -e 's/Can you do the job?/[[ kˈæn juː dˈuː ðə dʒˈɑːb ]]./'; }
while IFS= read -r line; do
  i=$((i+1))
  echo "$line" | fix | python3 -m piper -m $D/voice/en-us-libritts-high.onnx -s 140 --length-scale 1.15 --noise-scale 0.5 \
    --noise-w-scale 0.6 --sentence-silence 0.35 -f $D/out/voice-$i.wav 2>/dev/null
done < $D/narration.txt
echo "$i narration lines in $D/out/"
