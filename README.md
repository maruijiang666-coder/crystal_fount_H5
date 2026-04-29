# Crystal Fountain (水晶之泉)

## 项目简介

Crystal Fountain 是一个基于 Taro 框架开发的跨平台应用，专注于提供水晶手串相关的运势追踪和虚拟宠物养成体验。用户可以通过应用激活水晶手串，追踪运势数据，培养虚拟守护兽，并解锁各种成就。

## 技术栈

- **框架**: Taro 3.4.2
- **UI库**: React 17.0.0
- **样式**: CSS Modules
- **构建工具**: Webpack
- **代码规范**: ESLint

## 功能特性

### 水晶手串管理
- 激活日期追踪
- 水晶年纪计算
- 触碰次数统计
- 运势等级评估

### 虚拟守护兽系统
- 守护兽养成与进化
- 进化进度追踪
- 互动功能（触碰水晶加速进化）

### 里程碑系统
- 成就图鉴收集
- 已获得/未获得状态追踪
- 多阶段进化展示

### 运势功能
- 运势等级评估
- 抽牌功能（开发中）
- 触碰互动体验

## 项目结构

```
crystal_fount/
├── config/                 # 项目配置文件
│   ├── index.js            # 主配置文件
│   ├── dev.js              # 开发环境配置
│   └── prod.js             # 生产环境配置
├── src/                    # 源代码目录
│   ├── app.config.js       # 应用配置
│   ├── app.css             # 全局样式
│   ├── app.js              # 应用入口文件
│   ├── index.html          # HTML模板
│   ├── assets/             # 静态资源目录
│   │   ├── SJSY/           # SJShouYe页面图片资源
│   │   ├── ShouYe/         # ShouYe页面图片资源
│   │   ├── TaLuo/          # TaLuo页面图片资源
│   │   ├── haoyun/         # haoyun页面图片资源
│   │   ├── xiangxi/        # xiangxi页面图片资源
│   │   ├── yunshi/         # yunshi页面图片资源
│   │   └── oneCard.png     # 通用图片资源
│   └── pages/              # 页面目录
│       ├── CardSliderDemo/ # 卡片滑动演示页面
│       ├── SJShouYe/       # 水晶手串首页
│       │   ├── SJShouYe.jsx
│       │   ├── SJShouYe.module.css
│       │   └── SJShouYe.config.js
│       ├── ShouYe/         # 主首页
│       │   ├── ShouYe.jsx
│       │   ├── ShouYe.module.css
│       │   └── ShouYe.config.js
│       ├── TaLuo/          # 塔罗牌页面
│       │   ├── index.jsx
│       │   ├── index.module.css
│       │   └── index.config.js
│       ├── TaLuoAnswer/    # 塔罗牌答案页面
│       │   ├── index.jsx
│       │   ├── index.module.css
│       │   └── index.config.js
│       ├── haoyun/         # 好运页面
│       │   ├── index.jsx
│       │   ├── index.module.css
│       │   └── index.config.js
│       ├── testcard/       # 测试卡片页面
│       │   ├── testcard.jsx
│       │   ├── testcard.module.css
│       │   ├── testcard.config.js
│       │   ├── CardSlider.jsx
│       │   ├── CardSlider.module.css
│       │   └── index.js
│       ├── xiangxi/        # 详细页面
│       │   ├── xiangxi.jsx
│       │   ├── xiangxi.module.css
│       │   └── xiangxi.config.js
│       └── yunshi/         # 运势页面
│           ├── yunshi.jsx
│           ├── yunshi.module.css
│           └── yunshi.config.js
├── package.json            # 项目依赖
├── project.config.json     # 微信小程序配置
├── project.tt.json         # 字节跳动小程序配置
└── README.md               # 项目说明文档
```

## 安装与运行

### 环境要求

- Node.js >= 12.0.0
- npm >= 6.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

#### 微信小程序
```bash
npm run dev:weapp
```

#### H5
```bash
npm run dev:h5
```

#### 支付宝小程序
```bash
npm run dev:alipay
```

#### 字节跳动小程序
```bash
npm run dev:tt
```

### 生产构建

#### 微信小程序
```bash
npm run build:weapp
```

#### H5
```bash
npm run build:h5
```

#### 支付宝小程序
```bash
npm run build:alipay
```

#### 字节跳动小程序
```bash
npm run build:tt
```

## 环境配置

### 开发环境

- 开发环境配置文件：`config/dev.js`
- 当前开发接口地址：`http://9.9.9.5:8011`
- 本地 H5 开发时，`localhost`、`127.0.0.1`、`9.9.9.5` 会走同源 `/api` 代理

### 生产环境

- 生产环境配置文件：`config/prod.js`
- 当前生产接口地址：`https://crystal.quant-speed.com`
- H5 生产构建命令：`npm run build:h5`

### H5 上线说明

1. 执行 `npm run build:h5`
2. 部署生成后的 `dist` 目录
3. 确认前端可以访问 `https://crystal.quant-speed.com/api/...`
4. 如果前后端通过反向代理联通，请确认 `/api` 转发规则已正确配置

### Docker 部署

项目已提供以下 Docker 文件：

- `Dockerfile`：多阶段构建，先打包 H5，再用 Nginx 提供静态站点
- `docker-compose.yml`：本地或服务器快速启动
- `docker/nginx/default.conf`：Nginx 静态站点配置，包含 SPA 路由回退

#### 构建镜像

```bash
docker build -t crystal-fount-h5:latest .
```

#### 启动容器

```bash
docker run -d --name crystal-fount-h5 -p 8080:80 crystal-fount-h5:latest
```

#### 使用 Compose 启动

```bash
docker compose up -d --build
```

#### 访问地址

- 默认访问地址：`http://localhost:8080`

#### API 说明

- 当前 H5 生产环境接口地址编译为：`https://crystal.quant-speed.com`
- 如果你希望前端和后端走同一个域名，可以在 `docker/nginx/default.conf` 或外层网关中为 `/api` 增加反向代理
- 如果后端已经部署在 `https://crystal.quant-speed.com`，当前 Docker 镜像可以直接使用

## 开发指南

### 样式规范

项目采用 CSS Modules 进行样式管理，使用 rpx 作为响应式单位。全局样式定义在 `app.css` 中，包含常用的 flex 布局类和间距类。

### 页面开发

1. 在 `src/pages` 目录下创建新的页面文件夹
2. 创建页面组件文件（.jsx）
3. 创建页面样式文件（.module.css）
4. 创建页面配置文件（.config.js）
5. 在 `app.config.js` 中注册新页面

### 组件规范

- 使用函数式组件和 React Hooks
- 使用 Taro 提供的组件库（@tarojs/components）
- 遵循单一职责原则

## 部署说明

### 微信小程序

1. 运行 `npm run build:weapp` 构建项目
2. 使用微信开发者工具打开 `dist` 目录
3. 上传代码并提交审核

### H5

1. 运行 `npm run build:h5` 构建项目
2. 将 `dist` 目录部署到 Web 服务器

## 注意事项

- 图片资源使用了远程 URL，请确保网络连接正常
- 部分功能（如抽牌、线上调节）暂未开放
- 项目使用了自定义字体和样式，请确保在各平台兼容性

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至：[your-email@example.com]

## 更新日志

### v1.0.0 (2022-02-23)
- 初始版本发布
- 实现基础的水晶手串管理功能
- 添加虚拟守护兽系统
- 实现里程碑和成就系统



##代码：
当前没有
