# Graphdossier — Cloud Run image.
#
# The graph ships INSIDE the image: run `pnpm ingest` locally first so
# `data/graphdossier.kuzu` exists, then build. Cloud Run's filesystem is ephemeral,
# so runtime edits (chat-agent mutations, uploads) last until an instance is
# recycled — perfect for a demo; re-ingest + redeploy to change the corpus.
#
#   pnpm ingest --reset
#   gcloud run deploy graphdossier --source . --region asia-south1 \
#     --allow-unauthenticated --memory 1Gi --set-env-vars GEMINI_API_KEY=...

FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
# kuzu needs its postinstall step (allowed via pnpm.onlyBuiltDependencies)
RUN pnpm install --frozen-lockfile
COPY . .
ENV GEMINI_API_KEY=build-placeholder
RUN pnpm build

FROM node:22-slim AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
# the pre-ingested graph + corpus (see header)
COPY --from=build /app/data ./data
COPY --from=build /app/corpus ./corpus

EXPOSE 3000
# Next.js honors $PORT (set by Cloud Run).
CMD ["pnpm", "start"]
