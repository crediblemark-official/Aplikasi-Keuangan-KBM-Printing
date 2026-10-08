FROM oven/bun:1-slim AS runner

WORKDIR /app

# Salin package.json & install dependensi
COPY package.json ./
RUN bun install --production

# Salin source code & tsconfig
COPY src ./src
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["bun", "src/index.ts"]
