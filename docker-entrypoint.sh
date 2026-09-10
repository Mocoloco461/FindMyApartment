#!/bin/sh
set -e

echo "🚀 Starting Karmei Gat App Entrypoint..."

echo "📦 Ensuring database schema is synced..."
node ./node_modules/prisma/build/index.js db push --skip-generate

echo "🌟 Launching Next.js Standalone Server on port ${PORT:-3000}..."
exec node server.js
