FROM node:20-alpine AS base

WORKDIR /client

COPY package.json .
RUN npm i

COPY . .

FROM base AS dev
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm run build
