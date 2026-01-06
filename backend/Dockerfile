FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN npm install -g prisma

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN mkdir -p uploads

RUN npx prisma generate

COPY init.sh /app/init.sh
RUN chmod +x /app/init.sh

EXPOSE 3000

CMD ["sh", "/app/init.sh"]
