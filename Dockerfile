FROM node:20

# Install system dependencies + SWI-Prolog
RUN apt-get update && apt-get install -y \
    swi-prolog \
    ca-certificates \
    libgmp-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Force swipl into PATH (safety)
RUN ln -s /usr/bin/swipl /bin/swipl || true

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy prisma schema
COPY prisma ./prisma

# Dummy DB URL for build time (only for prisma generate, not actual connection)
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# Install dependencies
RUN npm install

# Copy prolog files
COPY prolog ./prolog

# Copy source
COPY src ./src

# Build application
RUN npm run build

# Expose port
ENV PORT=3001
EXPOSE 3001

# Start
CMD ["sh", "-c", "npm run migrate:deploy && npm run start:prod"]
