#!/bin/sh
set -e

echo "Criando diretório de uploads..."
mkdir -p uploads

echo "Regenerando Prisma Client..."
npx prisma generate

echo "Aplicando migrations (produção)..."
npx prisma migrate deploy

echo "Iniciando servidor (produção)..."
npm start
