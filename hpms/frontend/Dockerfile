FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Note: Ensure custom nginx.conf is copied via docker-compose volume or ADD here
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
