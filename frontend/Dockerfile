# Estágio de compilação do React + Vite
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Compila o frontend para produção
RUN npm run build

# Estágio de produção usando Nginx para servir arquivos estáticos e atuar como Proxy Reverso
FROM nginx:alpine

# Copia os arquivos compilados do React
COPY --from=build /app/dist /usr/share/nginx/html

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
