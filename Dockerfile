# Use the official Bun image as base
FROM oven/bun:1.0.35-slim as base

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
    fonts-kacst fonts-freefont-ttf dbus dbus-x11

WORKDIR /app

# Install dependencies stage
FROM base as deps
# Copy package files
COPY package.json bun.lockb ./
# Install dependencies
RUN bun install --frozen-lockfile
# RUN bunx --bun run puppeteer browsers install chrome --install-deps

# Builder stage
FROM base as builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Set production environment
ENV NODE_ENV=production
# Build the application
RUN DEBUG=true bun run build --debug

# Runner stage
FROM base as runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000
# Start the application
CMD ["bun", "server.js"] 
