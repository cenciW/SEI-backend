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

# Copy prisma schema (needs to be before npm install for Prisma 7)
COPY prisma ./prisma

# Set dummy DATABASE_URL for build time only
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# Install dependencies (will run postinstall which runs prisma generate)
RUN npm install

# Copy prolog files
COPY prolog ./prolog

# Copy source code
COPY src ./src

# Build application (prebuild script will run prisma generate)
RUN npm run build

# Expose port (Render will use PORT env var)
ENV PORT=3001
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npm run migrate:deploy && npm run start:prod"]
