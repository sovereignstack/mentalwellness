# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package.json ./
COPY client/package.json ./client/
RUN npm install --prefix client

COPY shared/ ./shared/
COPY client/ ./client/
RUN npm run build --prefix client

# ==========================================
# Stage 2: Build Backend (Express + TS)
# ==========================================
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package.json ./
COPY server/package.json ./server/
RUN npm install --prefix server

COPY shared/ ./shared/
COPY server/ ./server/
RUN npm run build --prefix server

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./
COPY server/package.json ./server/
RUN npm install --only=production --prefix server

COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 8080

CMD ["node", "server/dist/index.js"]
