#!/usr/bin/env bash

for i in A B C D E F G H 1 2 3 4 5 6 7 8; do gtts-cli $i -o ${i}_woman.mp3; done
for f in ./*.mp3; do ffmpeg -i "$f" -c:a libvorbis -q:a 4 "${f/%mp3/ogg}"; done
