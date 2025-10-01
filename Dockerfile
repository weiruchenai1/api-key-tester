# -------- Stage 1: Build --------
FROM node:20-alpine AS build
WORKDIR /app

# 更好利用构建缓存
COPY package*.json ./
# 如无 package-lock.json，请改为 `npm install`
RUN npm ci

# 复制源码并构建
COPY . .
ENV DOCKER_BUILD=true
RUN npm run build

# -------- Stage 2: Runtime (Nginx) --------
FROM nginx:alpine
# 自定义 Nginx 配置
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# 构建产物
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
