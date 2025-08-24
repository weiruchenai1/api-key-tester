# 🚀 Docker 快速部署指南

使用 Docker 一键部署本项目（生产模式：Nginx 托管静态文件）。

## 📂 项目目录
```
api-key-tester/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── nginx/
    └── default.conf
```

## 1. 环境准备
- 安装 **Docker** 与 **Docker Compose**
- Windows 用户需切换至 **Linux 容器模式**

验证安装：
```bash
docker version
docker compose version
```

## 2. 构建与启动
进入项目目录 `api-key-tester/`：
```bash
docker compose up -d --build
```

访问：http://localhost:8080

## 3. 常用命令
```bash
docker ps                  # 查看容器
docker compose logs -f     # 查看日志
docker compose down        # 停止并清理
docker compose up -d --build   # 更新
```

## 4. 配置
默认端口：`8080:80`  
如需修改，编辑 `docker-compose.yml`：
```yaml
ports:
  - "3000:80"
```

## 5. 常见问题
- **刷新 404** → 检查 `nginx/default.conf` 是否有：
  ```nginx
  try_files $uri $uri/ /index.html;
  ```
- **白屏/资源 404** → 确认 `package.json` 中 `"homepage": "."`
- **端口冲突** → 修改 `docker-compose.yml` 的 `ports`
- **构建慢** → 配置 npm 镜像源或代理

## 6. 服务器部署
将 `api-key-tester/` 上传服务器后执行：
```bash
docker compose up -d --build
```