#!/bin/sh
set -e

echo "Criando diretório de uploads..."
mkdir -p uploads

echo "Gerando/atualizando Prisma Client..."
npx prisma generate

echo "Aplicando migrations (deploy)..."
# Tenta aplicar migrations, caso falhe, faz db push como fallback
npx prisma migrate deploy || npx prisma db push --accept-data-loss

if [ "$NODE_ENV" = "production" ]; then
	echo "Não executando seed em produção por padrão. Defina ENABLE_SEED=true para executar."
	if [ "$ENABLE_SEED" = "true" ]; then
		echo "Executando seed..."
		npx prisma db seed
	fi
fi

echo "Iniciando servidor (production)..."
npm run start
