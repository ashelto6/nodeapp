# The `build` target here is CI-only (see .github/workflows/ci.yml) — the
# image that actually ships is nginx/Dockerfile's `client-build` stage. Keep
# the install step (npm ci + lockfile) identical in both if you touch either.
FROM node:20-alpine AS base

WORKDIR /client

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

FROM base AS dev
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm run build
