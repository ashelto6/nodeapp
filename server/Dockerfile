FROM node:20-alpine AS base

WORKDIR /server

COPY package.json package-lock.json ./

FROM base AS dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm ci --omit=dev
COPY --chown=node:node . .
# Drop root (issue #112): node:20-alpine ships a ready-made unprivileged
# `node` user. SERVER_PORT is unprivileged so binding still works.
USER node
# Run node directly rather than `npm start` (issue #29): Docker sends
# SIGTERM to PID 1 on shutdown, and PID 1 must be the process with our
# graceful-shutdown handler, not the npm CLI sitting in front of it.
CMD ["node", "./src/server.js"]
