FROM node:20 as build

ARG VITE_MAPBOX_TOKEN
ARG API_DOMAIN

ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_API_DOMAIN=$API_DOMAIN

COPY package.json package.json
RUN npm install
COPY . .
RUN npm run lint
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY bikehopper.org.conf /etc/nginx/conf.d/default.conf
COPY --from=build build /usr/share/nginx/html
