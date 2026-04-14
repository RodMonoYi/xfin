FROM node:20-slim AS build
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (including dev) to build and generate Prisma client
RUN npm ci

# Copy source and build
COPY . .

RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Remove dev dependencies to keep final image slim
RUN npm prune --production || true

RUN mkdir -p uploads

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy runtime artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/uploads ./uploads

COPY init.sh /app/init.sh
RUN chmod +x /app/init.sh

EXPOSE 3000

CMD ["sh", "/app/init.sh"]
