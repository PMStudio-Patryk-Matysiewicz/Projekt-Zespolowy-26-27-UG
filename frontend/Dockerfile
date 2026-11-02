# 1. Build: Node compiles the React app into static files (dist/).
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Short commit hash for the page footer (SCRUM-59); the deploy passes the real one.
ARG GIT_SHA=dev
ENV VITE_GIT_SHA=$GIT_SHA
RUN npm run build

# 2. Serve: nginx with only the built files, no Node.js in the final image.
FROM nginx:1.30-alpine
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
