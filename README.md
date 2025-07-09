# Makera Community

创客社区平台 - 连接创客与创作者的社区平台

## 🛠️ 技术栈

- **前端框架**: Next.js 15.3.1, React 19.0.0
- **样式方案**: Tailwind CSS 4.x
- **UI 组件库**: Shadcn UI, Ant Design 5.25.2
- **数据库 ORM**: Prisma 6.6.0
- **数据库**: Supabase, PostgreSQL
- **身份认证**: Supabase Auth
- **类型检查**: TypeScript 5.x
- **富文本编辑器**: Tiptap 2.11.7
- **图标库**: Lucide React, React Icons
- **动画库**: Framer Motion 12.9.1
- **3D 渲染**: Three.js 0.145.0
- **工具函数**: AHooks 3.8.4

## 🚀 快速开始

### 环境要求

- Node.js 18.0.0+
- pnpm 8.0.0+ (推荐)

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 环境配置

1. 在项目根目录创建 `.env` 和 `.env.local` 文件
2. 配置环境变量，包括数据库连接和 Supabase 配置

```bash
# .env - Prisma 数据库配置
DATABASE_URL="postgresql://username:password@host:port/database_name?schema=public"

# Supabase 连接信息
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase 服务端密钥
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# 网站域名配置
NEXT_PUBLIC_API_URL=your_api_url
```

### 本地开发

```bash
# 启动开发服务器 (使用 Turbopack)
pnpm dev

# 或使用其他包管理器
npm run dev
# yarn dev
# bun dev
```

开发服务器将在 [http://localhost:3000](http://localhost:3000) 启动。

## 🗄️ 数据库配置

### Prisma 数据库连接

克隆项目后，请按照以下步骤连接数据库：

1. **配置数据库连接**

   确保在 `.env` 文件中正确配置了 `DATABASE_URL`：

   ```env
   DATABASE_URL="postgresql://username:password@host:port/database_name?schema=public"
   ```

2. **生成 Prisma Client**

   ```bash
   pnpm prisma:generate
   ```

3. **初始化数据库** (首次运行)

   ```bash
   # 创建并应用迁移
   pnpm prisma:migrate:dev

   # 或直接推送模式 (开发环境)
   pnpm prisma:push
   ```

4. **填充初始数据** (首次运行)

   ```bash
   pnpm db:seed
   ```

5. **验证连接成功**

   ```bash
   # 启动 Prisma Studio 可视化管理界面
   pnpm prisma:studio
   ```

### Prisma 基础命令

```bash
# 验证模式文件格式
pnpm prisma:validate

# 格式化模式文件
pnpm prisma:format

# 生成 Prisma 客户端
pnpm prisma:generate

# 启动 Prisma Studio 可视化管理界面
pnpm prisma:studio
```

### 数据库同步命令

```bash
# 直接推送模式更改到数据库 (不创建迁移记录，适用于开发环境)
pnpm prisma:push
```

### 迁移相关命令

```bash
# 创建并应用新迁移 (开发环境)
# 示例: pnpm prisma:migrate:dev --name add_products_table
pnpm prisma:migrate:dev --name migration_name

# 应用待处理的迁移 (生产环境)
pnpm prisma:migrate:deploy

# 检查迁移状态
pnpm prisma:migrate:status

# 重置数据库并重新应用所有迁移 (谨慎使用)
pnpm prisma:migrate:reset
```

### 数据填充命令

```bash
# 运行种子脚本填充测试数据
pnpm db:seed
```

## 📁 项目结构

```
MakeraCommunity/
├── api/                          # 统一 API 请求层
├── app/                          # Next.js 应用目录
│   ├── (client)/                 # 客户端路由组
│   │   ├── (site)/               # 公开站点页面
│   │   ├── admin/                # 管理后台页面
│   │   ├── auth/                 # 身份认证相关页面
│   ├── api/                      # API 接口路由
│   ├── layout.tsx                # 根布局组件
├── components/                   # 共享组件库
│   ├── ui/                       # UI 基础组件 (Shadcn)
│   ├── admin/                    # 管理后台组件
│   ├── form/                     # 表单相关组件
│   ├── editor/                   # 编辑器组件
│   ├── tiptap-ui/                # Tiptap 编辑器 UI 组件
│   ├── tiptap-node/              # Tiptap 自定义节点
│   ├── tiptap-extension/         # Tiptap 扩展
│   ├── tiptap-templates/         # Tiptap 模板
│   ├── tiptap-icons/             # Tiptap 图标
│   ├── makeraui/                 # Makera 自定义 UI 组件
│   ├── magicui/                  # Magic UI 组件
│   ├── custom-table/             # 自定义表格组件
│   ├── icons/                    # 图标组件
│   ├── providers/                # 应用提供者组件
│   ├── header.tsx                # 头部组件
│   ├── footer.tsx                # 底部组件
│   ├── logo.tsx                  # 品牌标志组件
│   ├── nav-user.tsx              # 用户导航组件
│   ├── theme-mode-button.tsx     # 主题切换按钮
│   ├── protected-route.tsx       # 路由保护组件
│   └── checkbox-tree.tsx         # 树形复选框组件
├── constants/                    # 共享常量定义
├── db/                          # Supabase RLS 授权 + RPC SQL
├── hooks/                       # 自定义 React Hooks
├── lib/                         # 工具库和函数
│   ├── prisma/                  # Prisma 连接配置
│   ├── supabase/                # Supabase 客户端
│   ├── server/                  # 统一接口服务
│   └── validations/             # 表单验证规则
├── prisma/                      # Prisma 配置
│   ├── schema.prisma            # 数据库模型定义
│   └── data/                    # 数据种子脚本
├── public/                      # 静态资源文件
├── styles/                      # 全局样式文件
├── types/                       # TypeScript 类型定义
├── docs/                        # 项目文档
│   ├── interface/               # 接口文档
│   ├── dbml/                    # 数据库关系图
│   └── db-er.md                 # 数据库 ER 图文档
├── generated/                   # 生成的文件
│   └── prisma/                  # Prisma Client 生成文件
├── middleware.ts                # Next.js 中间件
├── tailwind.config.ts           # Tailwind CSS 配置
├── next.config.ts               # Next.js 配置
└── package.json                 # 项目配置和依赖项
```

## 🔧 开发工具配置

### ESLint 配置

项目使用 ESLint 9.x 进行代码质量检查，配置文件为 `eslint.config.mjs`。

### Prettier 配置

使用 Prettier 进行代码格式化，支持 Tailwind CSS 类名排序插件。

### TypeScript 配置

完整的 TypeScript 5.x 配置，支持最新的 ES 特性和严格类型检查。

## 📚 文档生成

项目自动生成以下文档：

- **API 接口文档**: 位于 `docs/interface/`
- **数据库关系图**: 位于 `docs/dbml/` (可在 dbdiagram.io 查看)
- **ER 图文档**: `docs/db-er.md`
