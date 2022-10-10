FROM node as build
WORKDIR /app
ENV NODE_ENV=production
COPY ["package.json", "package-lock.json*", "/app/"]
RUN npm install
# Generate sitemap
RUN npm i -g static-sitemap-cli
COPY pub/ /app/
RUN /usr/local/bin/sscli -b https://chess2brain.com -r /app/

FROM nginx
WORKDIR /usr/share/nginx/html
COPY --from=build /app/ /usr/share/nginx/html
