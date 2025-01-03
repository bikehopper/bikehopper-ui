#!/bin/bash

# The .svgs are from the @mdi/svg package with the attribute
#   fill="#fff"
# added to the <path>. (They must be rendered white on black.)
#
# This script requires ImageMagick to be installed, and also the
# npm package image-sdf, globally.

for svg in *.svg; do
  echo Generating SDF for $svg...
  i=`basename $svg .svg`
  convert -density 10000 -fill white -background black -resize 256x256 \
    $i.svg ${i}_intermediate.png && \
  image-sdf ${i}_intermediate.png --spread 10 --downscale 1 --color black \
    >${i}_sdf.png && \
  rm ${i}_intermediate.png || echo Failed to convert $i
done


  # convert ${i}_intermediate.png -filter Jinc -resize 400% -threshold 30% \
  #   \( +clone -negate -morphology Distance Euclidean -level 50%,-50% \) \
  #   -morphology Distance Euclidean -compose Plus \
  #   -composite -level 45%,55% -resize 25% \
  #   ${i}_sdf.png && \
