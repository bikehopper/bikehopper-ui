#!/bin/bash

# This script requires ImageMagick to be installed, and also the
# npm package image-sdf, globally.

for svg in *.svg; do
  echo Generating SDF for $svg...
  i=`basename $svg .svg`
  convert -density 10000 -fill white -background black -resize 256x256 \
    $i.svg ${i}_intermediate.png && \
  image-sdf ${i}_intermediate.png --spread 15 --downscale 1 --color black \
    >${i}_sdf.png && \
  rm ${i}_intermediate.png || echo Failed to convert $i
done
