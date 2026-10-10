#!/bin/sh
# Builds the Telegram / GitHub Pages version (index.html) from padel-americano.html
set -e
cd "$(dirname "$0")"

{
  printf '%s\n' '<!doctype html><html lang="ru"><head><meta charset="utf-8">' \
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">' \
    '<script src="https://telegram.org/js/telegram-web-app.js"></script>' \
    '<style>html{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>' \
    '</head><body>'
  cat padel-americano.html
  printf '%s\n' '</body></html>'
} > index.html
touch .nojekyll
echo "built index.html"
