# This build stage duplicates client/Dockerfile's `build` target (that one is
# CI-only; this is the one that actually ships). Keep the install step
# (npm ci + lockfile) identical in both if you touch either.
FROM node:20-alpine AS client-build

WORKDIR /client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ .
RUN npm run build

FROM nginx:1.27-alpine AS prod

WORKDIR /etc/nginx/templates

COPY nginx/default.conf.prod.template ./default.conf.template
COPY --from=client-build /client/dist /usr/share/nginx/html

FROM nginx:1.27-alpine AS dev

WORKDIR /etc/nginx/templates

COPY nginx/default.conf.dev.template ./default.conf.template
