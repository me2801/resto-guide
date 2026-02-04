#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export SINGLE_SERVICE=true
export NEXT_PUBLIC_API_BASE_URL="http://localhost:${PORT:-3000}"

echo "==> Building API"
cd "$ROOT_DIR/api"
npm ci
npm run build

echo "==> Building mobile app"
cd "$ROOT_DIR/frontend"
npm ci
npm run build

echo "==> Building web app"
cd "$ROOT_DIR/frontend-desktop"
npm ci
npm run build
