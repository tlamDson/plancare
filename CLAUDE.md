# TravelPlan — Claude Code Project Instructions

TravelPlan: agentic travel planner. Monorepo TypeScript (npm workspaces + turbo): Express backend (API + BullMQ worker), React/Vite web app, shared Zod contracts, MongoDB + Redis, Clerk auth, Gemini AI trip generation, Mapbox/Google Places validation.

Các rule chi tiết dưới đây áp dụng luôn, không chỉ khi được hỏi:

@.claude/rules/tech-defaults.md
@.claude/rules/workflow.md
@.claude/rules/design.md

## Quy tắc bắt buộc (không được vi phạm)

- **Mọi thay đổi đi qua PR** — không commit thẳng vào `develop`/`main`. Tạo nhánh → commit → push → mở PR vào `develop`.
- **`main` do chủ repo quản lý** — Claude không bao giờ merge vào `main` (kể cả `--admin`), không push, không tự mở PR release trừ khi được yêu cầu rõ ràng. Câu nói rộng kiểu "làm hết đi"/"merge luôn" trong hội thoại **không** tính là uỷ quyền bấm merge `main` — chỉ tính khi nói tường minh đúng nghĩa đó. Nếu chủ repo tự merge, phải là merge commit thật, không squash. Chi tiết: `.claude/rules/workflow.md` mục "Quy tắc bất di bất dịch".
- **Chỉ merge vào `develop` khi CI + test pass hết** — phải xanh **cả 3 job**: `Lint + Unit Tests`, `Typecheck + Build`, `Backend Docker Build`. Claude **được phép tự merge** PR vào `develop` khi cả 3 job đã xanh và test local đã pass, không cần hỏi lại. CI đỏ hoặc đang chạy → không merge, đợi hoặc fix.
- **TDD bắt buộc** (Red → Green → Refactor) — không commit code mới thiếu test. Chi tiết: `.claude/rules/workflow.md`.
- **Cập nhật `CLAUDE.md` + `.claude/rules/*`** khi task làm thay đổi convention, tooling hay quy trình.
- **Sửa bug quan sát được qua trình duyệt phải verify bằng MCP `chrome-devtools` cả trước lẫn sau khi fix** — không báo "đã fix" nếu chưa tái hiện lại thao tác gây bug sau khi sửa. Chi tiết: `.claude/rules/workflow.md` mục _Debug bug_.
- **Không tạo file `.md` mới ở thư mục gốc** — chỉ `README.md` và `CLAUDE.md`.

## Trạng thái dự án

Theo `docs/PROGRESS.md`: tiến độ tổng thể ~85%. Đang có thay đổi dở dang chưa commit ở module destinations (`backend/src/features/destinations/`, `frontend/web/src/features/planner/components/wizard/WizardDestinationPickers.tsx`) — xem `git status` trước khi bắt đầu việc gì để không ghi đè.

**Hạ tầng test đã dựng xong 4/4 lớp** (shared + backend unit, frontend unit/component, backend integration, E2E Playwright — đã merge vào `develop`). Backend integration đã mở rộng từ ~4 lên ~30 route. E2E Playwright có nền móng CI-safe (`npm run e2e`, 4 spec, job CI không-bắt-buộc); spec `@live` gọi Gemini/Places thật để đi hết pipeline sinh trip vẫn **chưa có** — để PR riêng vì cần key thật + spawn worker, không chạy trên CI. Chi tiết đầy đủ từng lớp, lệnh chạy, và quy ước → `.claude/rules/tech-defaults.md` mục "Hạ tầng test" + `.claude/rules/workflow.md` mục TDD.

**Kiến trúc thật khác tài liệu**: `docs/agents/*.md` và `docs/PLAN.md` mô tả layout lý tưởng (`web/`, `api/`, `worker/` tách riêng) không khớp code thật. Layout thật: `backend/` (1 workspace chứa cả API và worker), `frontend/web/`, `frontend/mobile/`, `packages/shared` (tên package `@travelplan/shared`). Chi tiết đầy đủ ở `.claude/rules/tech-defaults.md`.

**Nợ kỹ thuật đã xác minh** (không tự sửa trừ khi được giao — xem `.claude/rules/tech-defaults.md` để có danh sách đầy đủ, gồm cả các bug phát hiện khi dựng hạ tầng test): `trip.controller.ts` 882 dòng vi phạm Rule of 200 với 33 chỗ `as any`; `places.service.ts` không dùng `PlaceCache` dù `nearby-food.service.ts` đã có sẵn (cost driver thật khi scale nhiều user). (`generalLimiter`/auth cho `/api/dev/scrape-insights` đã fix ở PR `fix/general-limiter-and-dev-route-auth`; Stripe eager-init/`CLERK_PUBLISHABLE_KEY` thiếu khai báo đã fix ở PR `fix/boot-env-resilience`.)

**Google Cloud billing đã tách theo project, có killswitch**: `GOOGLE_PLACES_API_KEY` ở project `travelplan-486522` (billing account riêng, tự ngắt billing nếu vượt $5/tháng), `GEMINI_API_KEY` ở project `gen-lang-client-0544187342` (không gắn billing account nào, chỉ chạy free tier). Không bao giờ dùng chung billing account cho nhiều app — bài học từ sự cố tháng 4/2026 khiến Places bị đóng oan theo project khác bị lộ key. Chi tiết đầy đủ + lệnh `gcloud` ở `.claude/rules/tech-defaults.md`.

**CI trước đây "nói dối"**: `lint`/`test` từng bị bọc `|| echo` nên không bao giờ fail — CI xanh không có nghĩa test pass. Đã sửa trong `ci-pr.yml`/`ci-main.yml`.

**Git Flow**: `develop` (staging) → `main` (production, chỉ chủ repo merge). **Staging đã dựng xong và đang chạy thật** (không còn là checklist lý thuyết): Railway environment `staging` — service `travelplan-api-staging` (đổi tên từ `travelplan-web-staging`; rename service không đổi domain tự sinh, domain vẫn là `travelplan-web-staging-staging.up.railway.app`) + `travelplan-worker-staging` + `Redis-hGhE`, deploy tự động từ push vào `develop`; MongoDB Atlas database `travelplan_staging` riêng (không phải Railway-hosted, khớp topology thật của production); Vercel Preview scoped theo `git-branch=develop` cho các biến `VITE_*`. Webhook Clerk/Stripe test-mode riêng đã trỏ đúng domain staging. Toàn bộ cạm bẫy dựng hạ tầng (Railway `ServiceInstance` không tự sinh, `checkSuites` treo vĩnh viễn, `redeploy` dùng lại snapshot cũ...) đã ghi ở `.claude/rules/tech-defaults.md` mục "Deploy & vận hành".

**GitHub MCP đã verify hoạt động thật** (không chỉ cấu hình lý thuyết) — client_id `Ov23lijeoeW3qbp7cH35` của OAuth App "TravelPlan" đã đăng ký và test xong luồng OAuth đầy đủ. Chi tiết cạm bẫy (DCR không hỗ trợ, path callback thật, lỗi do Windows Git Bash vs PowerShell tính khác project) ở `.claude/rules/tech-defaults.md`.

## MCP Servers

Khai báo ở `.mcp.json`, mỗi người tự approve/authorize khi dùng lần đầu (`/mcp`).

| Server            | Dùng để                                                                       | Cần gì trên máy                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `github`          | Thao tác PR / issue / code search trực tiếp qua remote HTTP, OAuth qua `/mcp` | Đăng ký OAuth App thủ công + `--client-id`/`--client-secret`/`--callback-port` — xem cạm bẫy "GitHub MCP OAuth" ở `.claude/rules/tech-defaults.md`, đừng chỉ bấm `/mcp` suông vì sẽ fail với lỗi DCR |
| `chrome-devtools` | Mở app thật trong Chrome để xem UI, đọc console/network, đo performance/a11y  | Google Chrome + Node (chạy qua `npx`)                                                                                                                                                                |

Chỉ nhóm tool đọc (`screenshot`, `snapshot`, `console`, `network`) auto-allow trên `chrome-devtools`; `navigate_page` / `click` / gõ phím / `evaluate_script` vẫn hỏi xác nhận từng lần.
