FROM oven/bun:alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build --no-lint --debug

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
RUN bunx @puppeteer/browsers install chrome@stable --path $HOME/.cache/puppeteer
RUN bun run db:migrate
RUN bun run db:seed
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV DB_FILE_NAME="mydb.sqlite"
ENV ROOT_PATH="/app"
CMD ["bun", "run", "server.js"]
