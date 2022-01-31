FROM nginx:1.21.6-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY build /usr/share/nginx/html
