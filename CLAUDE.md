# TravelPlan — Claude Code Project Instructions

Project Voyager: agentic travel planner. Monorepo TypeScript (npm workspaces + turbo): Express backend (API + BullMQ worker), React/Vite web app, shared Zod contracts, MongoDB + Redis, Clerk auth, Gemini AI trip generation, Mapbox/Google Places validation.

Các rule chi tiết dưới đây áp dụng luôn, không chỉ khi được hỏi:

@.claude/rules/tech-defaults.md
@.claude/rules/workflow.md
@.claude/rules/design.md

## Quy tắc bắt buộc (không được vi phạm)

- **Mọi thay đổi đi qua PR** — không commit thẳng vào `develop`/`main`. Tạo nhánh → commit → push → mở PR vào `develop`.
- **`main` do chủ repo quản lý** — Claude không merge, không push vào `main`.
- **Chỉ merge vào `develop` khi CI + test pass hết** — phải xanh **cả 3 job**: `Lint + Unit Tests`, `Typecheck + Build`, `Backend Docker Build`. Claude không tự merge bất kỳ PR nào, kể cả khi xanh — chỉ báo cáo sẵn sàng.
- **TDD bắt buộc** (Red → Green → Refactor) — không commit code mới thiếu test. Chi tiết: `.claude/rules/workflow.md`.
- **Cập nhật `CLAUDE.md` + `.claude/rules/*`** khi task làm thay đổi convention, tooling hay quy trình.
- **Sửa bug quan sát được qua trình duyệt phải verify bằng MCP `chrome-devtools` cả trước lẫn sau khi fix** — không báo "đã fix" nếu chưa tái hiện lại thao tác gây bug sau khi sửa. Chi tiết: `.claude/rules/workflow.md` mục _Debug bug_.
- **Không tạo file `.md` mới ở thư mục gốc** — chỉ `README.md` và `CLAUDE.md`.

## Trạng thái dự án

Theo `docs/PROGRESS.md`: tiến độ tổng thể ~85%. Đang có thay đổi dở dang chưa commit ở module destinations (`backend/src/features/destinations/`, `frontend/web/src/features/planner/components/wizard/WizardDestinationPickers.tsx`) — xem `git status` trước khi bắt đầu việc gì để không ghi đè.

**Kiến trúc thật khác tài liệu**: `docs/agents/*.md` và `docs/PLAN.md` mô tả layout lý tưởng (`web/`, `api/`, `worker/` tách riêng) không khớp code thật. Layout thật: `backend/` (1 workspace chứa cả API và worker), `frontend/web/`, `frontend/mobile/`, `packages/shared` (tên package `@travelplan/shared`). Chi tiết đầy đủ ở `.claude/rules/tech-defaults.md`.

**Nợ kỹ thuật đã xác minh** (không tự sửa trừ khi được giao — xem `.claude/rules/tech-defaults.md` để có danh sách đầy đủ): `trip.controller.ts` 882 dòng vi phạm Rule of 200 với 33 chỗ `as any`; `generalLimiter` chưa gắn route nào; `POST /api/dev/scrape-insights` thiếu auth (lỗ hổng thật trên repo public); frontend chưa có test nào trước đợt setup này.

**CI trước đây "nói dối"**: `lint`/`test` từng bị bọc `|| echo` nên không bao giờ fail — CI xanh không có nghĩa test pass. Đã sửa trong `ci-pr.yml`/`ci-main.yml`.

**Git Flow**: `develop` (staging) → `main` (production, chỉ chủ repo merge). Hai môi trường deploy tách biệt qua Railway/Vercel — xem checklist staging trong README nếu cần set up.

## MCP Servers

Khai báo ở `.mcp.json`, mỗi người tự approve/authorize khi dùng lần đầu (`/mcp`).

| Server            | Dùng để                                                                      | Cần gì trên máy                       |
| ----------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| `github`          | Thao tác PR / issue / code search trực tiếp qua remote HTTP, OAuth qua `/mcp`  | Không cần cài gì, chỉ cần authorize    |
| `chrome-devtools` | Mở app thật trong Chrome để xem UI, đọc console/network, đo performance/a11y | Google Chrome + Node (chạy qua `npx`) |

Chỉ nhóm tool đọc (`screenshot`, `snapshot`, `console`, `network`) auto-allow trên `chrome-devtools`; `navigate_page` / `click` / gõ phím / `evaluate_script` vẫn hỏi xác nhận từng lần.
