FROM node:20-alpine

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install dependencies (monorepo-style; adjust if you use pnpm/yarn)
RUN npm install

# Copy source
COPY . .

# Build TypeScript (assumes you have build scripts wired)
RUN npm run build

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
