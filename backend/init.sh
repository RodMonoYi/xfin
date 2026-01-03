#!/bin/sh
set -e

echo "🔄 Criando/atualizando schema do banco..."
npx prisma db push --accept-data-loss

echo "🌱 Executando seed..."
npx prisma db seed

echo "🚀 Iniciando servidor..."
npm run dev
