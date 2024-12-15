FROM oven/bun:alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
RUN bun pm untrusted

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx @puppeteer/browsers install chrome@stable --path $HOME/.cache/puppeteer

ENV DB_FILE_NAME="data/mydb.sqlite"
ENV ROOT_PATH="/app"
RUN bun run db:migrate
RUN bun run db:seed
RUN bun run build --debug

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/data ./data
# COPY --from=builder /app/data/mydb.sqlite ./data/mydb.sqlite

EXPOSE 3000
ENV DB_FILE_NAME="/app/data/mydb.sqlite"
ENV ROOT_PATH="/app"
CMD ["bun", "run", "server.js"]
