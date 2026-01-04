#!/bin/sh
set -e

echo "📁 Criando diretório de uploads..."
mkdir -p uploads

echo "🔄 Aplicando migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

echo "🌱 Executando seed..."
npx prisma db seed

echo "🚀 Iniciando servidor..."
npm run dev
