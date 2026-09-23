FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY backend/src ./src/
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY backend/package*.json ./
RUN npm ci --only=production
RUN npm install -g prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY backend/prisma ./prisma/
COPY backend/scripts ./scripts/
COPY frontend ./frontend/

# Run as non-root user
RUN chown -R node:node /app
USER node

EXPOSE 8080

CMD ["node", "dist/server.js"]
