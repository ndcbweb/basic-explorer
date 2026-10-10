#!/bin/sh
# Packages the standalone Next.js build into dist/explorer.tar.gz (run after `npm run build`).
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/explorer
cp -R .next/standalone/. dist/explorer/
rm -rf dist/explorer/data
mkdir -p dist/explorer/.next
cp -R .next/static dist/explorer/.next/static
[ -d public ] && cp -R public dist/explorer/public
cp scripts/run.sh dist/explorer/run.sh
chmod +x dist/explorer/run.sh
tar -C dist -czf dist/explorer.tar.gz explorer
echo "dist/explorer.tar.gz $(du -h dist/explorer.tar.gz | cut -f1)"
