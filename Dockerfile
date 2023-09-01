FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY bikehopper.org.conf /etc/nginx/conf.d/default.conf
COPY build /usr/share/nginx/html
