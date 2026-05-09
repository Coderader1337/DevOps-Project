FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_MODE=mock
ARG VITE_HISTORY_MODE=local
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_DEFAULT_MODEL=default

ENV VITE_API_MODE=$VITE_API_MODE
ENV VITE_HISTORY_MODE=$VITE_HISTORY_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DEFAULT_MODEL=$VITE_DEFAULT_MODEL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
