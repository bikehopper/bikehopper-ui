FROM node:20 as build

ARG VITE_MAPBOX_TOKEN
ARG API_DOMAIN

ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_API_DOMAIN=$API_DOMAIN

COPY . .
RUN npm install && \
    npx tsc && \
    npm run build

FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY bikehopper.org.conf /etc/nginx/conf.d/default.conf
COPY --from=build build /usr/share/nginx/html
