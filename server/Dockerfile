FROM node:20-alpine AS base

WORKDIR /server

COPY package.json .

FROM base AS dev
RUN npm i
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm i --omit=dev
COPY . .
CMD ["npm", "start"]
