# Estágio de build para instalar e cachear dependências
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Estágio de produção final
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app ./

EXPOSE 5001

ENV PORT=5001
ENV NODE_ENV=production

CMD ["node", "index.js"]
