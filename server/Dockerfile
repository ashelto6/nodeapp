FROM node:20-alpine AS base

WORKDIR /server

COPY package.json package-lock.json ./

FROM base AS dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm ci --omit=dev
COPY . .
CMD ["npm", "start"]
