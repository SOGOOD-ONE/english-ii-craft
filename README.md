# English-II Craft

考研英语二备考攻坚工坊 — 基于 Django 5.1 + DRF + React 19 的真题练习与学习系统。

## 功能模块

| 模块 | 描述 |
|------|------|
| **阅读理解** | 2010-2026 年真题 Part A（Text 1-4），支持逐段 AI 翻译、题型分析 |
| **段落翻译** | 翻译练习与自动评分对比 |
| **图表写作** | 大作文真题 + AI 四维度批改（数据 / 逻辑 / 词汇 / 语法） |
| **生词复习** | 基于 FSRS 间隔重复算法的单词卡，支持查词、评分、导出 CSV |
| **系统设置** | 自定义 AI 模型、API Key 配置 |

## 技术栈

### 前端
- **React 19** + **TypeScript 6** + **Vite 8**
- **TanStack Query** 数据获取与缓存
- **ECharts 6** 图表渲染
- **Tailwind CSS 3** 样式
- **Zustand** 状态管理

### 后端
- **Django 5.1** + **Django REST Framework**
- **SQLite** 数据库
- **FSRS** 间隔重复调度（`py-fsrs` 包）
- **Swagger** API 文档

## 快速开始

### 前置要求
- Python 3.12+
- Node.js 22+
- npm 10+

### 1. 克隆项目

```bash
git clone https://github.com/SOGOOD-ONE/english-ii-craft.git
cd english-ii-craft
```

### 2. 启动后端

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 4. 访问

- 前端: http://localhost:5173
- 后端 API: http://localhost:8000/api/v1/
- API 文档: http://localhost:8000/api/schema/docs

## 项目结构

```
english-ii-craft/
├── backend/                    # Django 后端
│   ├── accounts/               # 设备注册与用户认证
│   ├── ai_provider/            # AI 模型调用封装（智谱 GLM-4-Flash）
│   ├── eii_craft/              # Django 项目配置
│   ├── exam/                   # 考试数据接口（阅读/翻译/写作）
│   ├── translation/            # 翻译练习 API
│   ├── vocab/                  # 生词本与 FSRS 复习 API
│   └── writing/                # 写作批改 API
├── content/                    # 真题数据（JSON）
│   ├── reading/                # 阅读理解
│   ├── translation/            # 翻译
│   └── writing/                # 写作
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── api/                # Axios 封装与 API 函数
│   │   ├── components/         # 通用组件
│   │   │   └── common/         # WordHoverTip, YearPicker
│   │   ├── content/            # 前端回退数据副本
│   │   │   ├── reading/
│   │   │   └── writing/
│   │   ├── pages/              # 页面组件
│   │   │   ├── Reading.tsx
│   │   │   ├── Writing.tsx
│   │   │   ├── Translation.tsx
│   │   │   ├── Vocab.tsx
│   │   │   └── Settings.tsx
│   │   ├── store/              # Zustand 状态
│   │   ├── types/              # TypeScript 类型定义
│   │   └── globals.css         # 全局样式
│   └── vite.config.ts
└── README.md
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/device/register/` | POST | 设备注册（匿名用户） |
| `/api/v1/device/config/` | GET/PATCH | 获取/更新设备配置 |
| `/api/v1/exam/years?module=reading` | GET | 获取历年真题元数据 |
| `/api/v1/exam/reading/{year}/` | GET | 获取某年阅读数据 |
| `/api/v1/exam/writing/{year}/` | GET | 获取某年写作数据 |
| `/api/v1/exam/translation/{year}/` | GET | 获取某年翻译数据 |
| `/api/v1/exam/translate/` | POST | AI 逐段翻译 |
| `/api/v1/vocab/words/lookup/` | POST | AI 查词（释义/音标） |
| `/api/v1/vocab/cards/` | GET/POST | 生词卡列表与创建 |
| `/api/v1/vocab/cards/{id}/review/` | POST | FSRS 复习评分 |
| `/api/v1/writing/review/` | POST | AI 作文批改 |

## 配置

### AI 模型
默认使用 **智谱 GLM-4-Flash**（免费额度），可在系统设置页面切换：
- 自定义 API Key
- 自定义模型名称
- 自定义 API 地址

### 主题色
克莱因蓝（Klein Blue `#002FA7`）极简配色。

## 数据来源

考研英语二真题（2010-2026）来源于 [kaoyanzhenti](https://github.com/Fantasia1999/kaoyanzhenti)。

## 许可证

MIT