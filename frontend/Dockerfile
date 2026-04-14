FROM node:20-alpine AS build
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:stable-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html

# Remove default nginx config and add our own at runtime via nginx/default.conf mount
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


