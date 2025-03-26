# Makera Community

一个使用现代技术栈构建的社区平台 ✨

> **注意**: 这是一个私有项目，未经授权请勿分享或使用代码 🔒

## 技术栈

- **框架**: [Next.js 15](https://nextjs.org) (App Router)
- **UI**: [TailwindCSS 4](https://tailwindcss.com)
- **数据库**: PostgreSQL + [Prisma ORM](https://prisma.io)
- **认证**: [Supabase Auth](https://supabase.com)
- **部署**: [Vercel](https://vercel.com)
- **状态管理**: React Hooks
- **开发语言**: TypeScript

## 快速开始

首先，安装依赖:

```bash
pnpm install
```

设置环境变量:

1. 复制 `.env.local.example` 文件为 `.env.local`（如果存在）
2. 填写所需的环境变量

启动开发服务器:

```bash
pnpm dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000) 查看结果。

## 项目结构

```
makera-community/
├── app/              # Next.js App Router 页面
├── components/       # 可复用的UI组件
├── hooks/            # 自定义 React Hooks
├── lib/              # 工具函数和配置
├── prisma/           # Prisma 数据库配置
├── public/           # 静态资源
├── styles/           # 全局样式
└── types/            # TypeScript 类型定义
```

## 数据库管理

初始化或更新数据库：

```bash
npx prisma db push
```

查看数据库内容：

```bash
npx prisma studio
```

## 部署

项目可以轻松部署到 Vercel 平台：

[![部署到 Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fmakera-community)

## 贡献指南

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

## 许可证

私有项目，保留所有权利 © Makera Team
