FROM node:16 as build
COPY . .
RUN npm install && \
    npm run build

FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY bikehopper.org.conf /etc/nginx/conf.d/default.conf
COPY --from=build build /usr/share/nginx/html
