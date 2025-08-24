# Docker 快速部署指南

适用对象：希望在本地或服务器上，使用 Docker 一键部署本项目（生产模式：Nginx 托管静态文件）。

- 项目目录：`api-key-tester/`
- 关键文件：
  - `Dockerfile`（Node 构建 + Nginx 运行的多阶段镜像）
  - `nginx/default.conf`（SPA 路由与压缩）
  - `docker-compose.yml`（端口默认 8080:80）
  - `.dockerignore`

## 1. 环境准备
- 安装 Docker（Desktop 或 Engine），推荐最新稳定版。
- Windows 用户：Docker Desktop 需使用 Linux 引擎（Linux containers）。
- 初次构建需联网以拉取基础镜像与 npm 依赖。

验证 Docker：
```bash
docker version
docker compose version
```

> Windows 如遇引擎未就绪，重启 Docker Desktop，并在 PowerShell 执行 `wsl --shutdown` 后再次打开 Docker Desktop。

## 2. 一键构建与启动
在项目目录 `api-key-tester/` 内执行：
```bash
docker compose up -d --build
```
完成后访问：
```
http://localhost:8080
```

## 3. 常用操作
- 查看容器状态：
```bash
docker ps
```
- 查看运行日志：
```bash
docker compose logs -f
```
- 停止并清理：
```bash
docker compose down
```
- 更新（代码变更后）：
```bash
docker compose up -d --build
```

## 4. 端口与配置
- 默认端口映射在 `api-key-tester/docker-compose.yml`：
```yaml
ports:
  - "8080:80"
```
- 如本机 8080 被占用，可改为例如 `"3000:80"`，然后重新执行 `docker compose up -d`。

## 5. 验收检查
- 页面可正常打开，无 404/500。
- 刷新任意前端路由不 404（`nginx/default.conf` 已配置 `try_files`）。
- 语言切换、主题切换、批量测试与 Web Worker 并发正常。
- 如需调用第三方 API，请在应用内配置“自定义代理”以避免浏览器 CORS 限制。

## 6. 常见问题与排查
- 无法连接 `dockerDesktopLinuxEngine`（Windows）：
  1) 确认 Docker Desktop 正在运行并处于 Linux 模式；
  2) 关闭 Docker Desktop，执行 `wsl --shutdown`，重新开启；
  3) `docker context ls` 确认 `default` 指向 `desktop-linux`；
  4) `docker info` 成功返回。

- 刷新页面 404：
  - 检查 `nginx/default.conf` 中是否有 `try_files $uri $uri/ /index.html;`。

- 打开后白屏或资源 404：
  - 确保 `package.json` 中 `homepage` 为 `"."`，重新构建镜像。

- 端口冲突：
  - 修改 `docker-compose.yml` 的 `ports` 映射并重新启动。

- 公司代理网络：
  - 构建阶段若 npm 拉取缓慢/失败，可配置镜像源或在 Docker Desktop 中设置代理。

## 7. 服务器部署（可选）
- 将整个 `api-key-tester/` 目录上传到服务器；
- 服务器已安装 Docker/Compose 后在该目录执行：
```bash
docker compose up -d --build
```
- 使用反向代理（如 Nginx/Traefik/Caddy）将 80 或 8080 暴露到公网域名。

## 8. 目录与文件说明
- `api-key-tester/Dockerfile`
  - 使用 Node 20 Alpine 构建前端，产物复制到 `nginx:alpine` 运行镜像；
- `api-key-tester/nginx/default.conf`
  - 配置根目录、SPA 路由 fallback、gzip 压缩；
- `api-key-tester/docker-compose.yml`
  - 定义服务、端口映射、自动重启策略；
- `api-key-tester/.dockerignore`
  - 排除无关内容，缩小构建上下文。

---
如需：
- 增加健康检查、Brotli 压缩、细化缓存策略（HTML no-cache、静态长缓存）；
- 在 compose 中集成后端代理服务；
请提出需求，我可以直接为你调整配置。
