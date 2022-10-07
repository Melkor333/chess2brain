FROM node as build
WORKDIR /app
ENV NODE_ENV=production
COPY ["package.json", "package-lock.json*", "/app/"]
RUN npm install
FROM nginx
WORKDIR /usr/share/nginx/html
COPY --from=build /app /usr/share/nginx/html
COPY ./ /usr/share/nginx/html
