FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11 --activate
COPY pnpm-workspace.yaml package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.mastra/output ./.mastra/output
COPY --from=builder /app/package.json ./
EXPOSE 4111
ENV NODE_ENV=production
CMD ["node", ".mastra/output/index.mjs"]
