set -e

echo "Criando diretório de uploads..."
mkdir -p uploads

echo "Regenerando Prisma Client..."
npx prisma generate

echo "Resolvendo migrações falhadas (se houver)..."
npx prisma migrate resolve --applied 20260103200317_add_name_to_recurring 2>/dev/null || true

echo "Aplicando migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

echo "Executando seed..."
npx prisma db seed

echo "Iniciando servidor..."
npm run dev
