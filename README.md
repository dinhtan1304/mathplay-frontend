# MathPlay Frontend — Next.js 14

Frontend React/Next.js cho MathPlay Teacher Dashboard, tối ưu lại từ Jinja2 templates.

## Stack
- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** custom dark theme
- **Recharts** data visualization
- **Lucide React** icons
- **Axios** HTTP client với interceptors

## Setup nhanh

```bash
# 1. Clone / copy thư mục này vào project
cd mathplay-frontend

# 2. Cài dependencies
npm install

# 3. Tạo file env
cp .env.example .env.local
# Sửa NEXT_PUBLIC_API_URL thành URL backend của bạn

# 4. Chạy dev
npm run dev
# → http://localhost:3000
```

## Cấu trúc project

```
src/
  app/
    login/              ← Trang đăng nhập
    register/           ← Trang đăng ký
    dashboard/          ← Tổng quan (stats + charts + activity)
    upload/             ← Upload PDF với SSE progress
    bank/               ← Ngân hàng câu hỏi (filter, edit, export)
    generate/           ← Sinh đề AI từ ngân hàng
    classes/            ← Danh sách lớp học
    classes/[id]/       ← Chi tiết lớp (học sinh, bài tập, analytics, leaderboard)
  lib/
    api.ts              ← Toàn bộ API calls (100% endpoints)
    auth.tsx            ← Auth context + hooks
    utils.ts            ← Helper functions
  types/
    index.ts            ← TypeScript types cho tất cả API
```

## API endpoints đã tích hợp

| Module | Endpoints |
|--------|-----------|
| Auth | login, register, me, logout |
| Dashboard | stats, charts, activity |
| Parser | upload (multipart), SSE progress, getExam, listExams |
| Questions | list (filter+search+pagination), filters, update, delete, bulkCreate |
| Generator | generate, generateFromBank |
| Export | export DOCX/PDF/JSON |
| Classes | list, create, get, update, delete, getMembers, join, getLeaderboard |
| Assignments | list, create, get, update, delete, getSubmissions |
| Submissions | submit, myXP, history |
| Game | startSession (với game_mode selection) |
| Analytics | class analytics, assignment analytics, student detail |

## Deploy với Railway

Thêm vào `railway.toml` của frontend service:
```toml
[build]
command = "npm run build"

[deploy]
startCommand = "npm start"
```

Env vars cần thiết:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```
