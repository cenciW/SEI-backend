FROM node:20-slim

# Install SWI-Prolog
RUN apt-get update && \
    apt-get install -y swi-prolog && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Copy prolog files
COPY prolog ./prolog

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port (Render will use PORT env var)
ENV PORT=3001
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npm run migrate:deploy && npm run start:prod"]
