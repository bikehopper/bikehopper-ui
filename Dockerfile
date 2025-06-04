FROM node:22 AS build

ARG API_DOMAIN

ENV VITE_API_DOMAIN=$API_DOMAIN

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci
COPY . .
RUN npm run lint
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY bikehopper.org.conf /etc/nginx/conf.d/default.conf
COPY --from=build build /usr/share/nginx/html
