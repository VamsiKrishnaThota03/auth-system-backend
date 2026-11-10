# syntax=docker/dockerfile:1

FROM node:26-alpine AS build
WORKDIR /app
# openssl is required by Prisma's query engine.
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY src ./src
RUN npx prisma generate && npx tsc -p tsconfig.build.json
RUN npm prune --omit=dev

FROM node:26-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production
# The published port is the security boundary (see docker-compose.yml); inside
# the container the listener must accept the Docker network.
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
