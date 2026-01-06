FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install Prisma CLI
RUN npm install -g prisma

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Generate Prisma Client
RUN npx prisma generate

# Copy and make init script executable
COPY init.sh /app/init.sh
RUN chmod +x /app/init.sh

# Expose port
EXPOSE 3000

# Start script that runs migrations and seed
CMD ["sh", "/app/init.sh"]
