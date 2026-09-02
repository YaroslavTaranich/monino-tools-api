FROM node:20-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM dependencies AS builder

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN mkdir -p /app/static

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
