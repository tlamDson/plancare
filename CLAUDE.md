# TravelPlan — Claude Code Project Instructions

Project Voyager: agentic travel planner. Monorepo TypeScript (npm workspaces + turbo): Express backend (API + BullMQ worker), React/Vite web app, shared Zod contracts, MongoDB + Redis, Clerk auth, Gemini AI trip generation, Mapbox/Google Places validation.

Các rule chi tiết dưới đây áp dụng luôn, không chỉ khi được hỏi:

@.claude/rules/tech-defaults.md
@.claude/rules/workflow.md
@.claude/rules/design.md

## Quy tắc bắt buộc (không được vi phạm)

- **Mọi thay đổi đi qua PR** — không commit thẳng vào `develop`/`main`. Tạo nhánh → commit → push → mở PR vào `develop`.
- **`main` do chủ repo quản lý** — Claude không merge, không push vào `main`, không tự mở PR release trừ khi được yêu cầu rõ ràng.
- **Chỉ merge vào `develop` khi CI + test pass hết** — phải xanh **cả 3 job**: `Lint + Unit Tests`, `Typecheck + Build`, `Backend Docker Build`. Claude **được phép tự merge** PR vào `develop` khi cả 3 job đã xanh và test local đã pass, không cần hỏi lại. CI đỏ hoặc đang chạy → không merge, đợi hoặc fix.
- **TDD bắt buộc** (Red → Green → Refactor) — không commit code mới thiếu test. Chi tiết: `.claude/rules/workflow.md`.
- **Cập nhật `CLAUDE.md` + `.claude/rules/*`** khi task làm thay đổi convention, tooling hay quy trình.
- **Sửa bug quan sát được qua trình duyệt phải verify bằng MCP `chrome-devtools` cả trước lẫn sau khi fix** — không báo "đã fix" nếu chưa tái hiện lại thao tác gây bug sau khi sửa. Chi tiết: `.claude/rules/workflow.md` mục _Debug bug_.
- **Không tạo file `.md` mới ở thư mục gốc** — chỉ `README.md` và `CLAUDE.md`.

## Trạng thái dự án

Theo `docs/PROGRESS.md`: tiến độ tổng thể ~85%. Đang có thay đổi dở dang chưa commit ở module destinations (`backend/src/features/destinations/`, `frontend/web/src/features/planner/components/wizard/WizardDestinationPickers.tsx`) — xem `git status` trước khi bắt đầu việc gì để không ghi đè.

**Hạ tầng test đã dựng xong 3/4 lớp** (shared + backend unit, frontend unit/component, backend integration — đã merge vào `develop` qua PR #6/#8/#9). Lớp E2E Playwright còn **dở dang**: mới có `package.json` scripts (`npm run e2e`, `npm run e2e:ui`) + `e2e/playwright.config.ts` checkpoint trên nhánh `test/e2e-playwright` (chưa mở PR — thiếu `global-setup.ts` và toàn bộ spec). Chi tiết đầy đủ từng lớp, lệnh chạy, và quy ước → `.claude/rules/tech-defaults.md` mục "Hạ tầng test" + `.claude/rules/workflow.md` mục TDD.

**Kiến trúc thật khác tài liệu**: `docs/agents/*.md` và `docs/PLAN.md` mô tả layout lý tưởng (`web/`, `api/`, `worker/` tách riêng) không khớp code thật. Layout thật: `backend/` (1 workspace chứa cả API và worker), `frontend/web/`, `frontend/mobile/`, `packages/shared` (tên package `@travelplan/shared`). Chi tiết đầy đủ ở `.claude/rules/tech-defaults.md`.

**Nợ kỹ thuật đã xác minh** (không tự sửa trừ khi được giao — xem `.claude/rules/tech-defaults.md` để có danh sách đầy đủ, gồm cả các bug phát hiện khi dựng hạ tầng test): `trip.controller.ts` 882 dòng vi phạm Rule of 200 với 33 chỗ `as any`; `generalLimiter` chưa gắn route nào; `POST /api/dev/scrape-insights` thiếu auth (lỗ hổng thật trên repo public); `places.service.ts` không dùng `PlaceCache` dù `nearby-food.service.ts` đã có sẵn (cost driver thật khi scale nhiều user); `billing/stripe.service.ts` và `clerkMiddleware()` đều có thể khiến server crash lúc boot hoặc lúc request nếu thiếu `STRIPE_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY` — hai biến này **không** được `envalid` khai báo bắt buộc dù thực tế bắt buộc.

**Google Cloud billing đã tách theo project, có killswitch**: `GOOGLE_PLACES_API_KEY` ở project `travelplan-486522` (billing account riêng, tự ngắt billing nếu vượt $5/tháng), `GEMINI_API_KEY` ở project `gen-lang-client-0544187342` (không gắn billing account nào, chỉ chạy free tier). Không bao giờ dùng chung billing account cho nhiều app — bài học từ sự cố tháng 4/2026 khiến Places bị đóng oan theo project khác bị lộ key. Chi tiết đầy đủ + lệnh `gcloud` ở `.claude/rules/tech-defaults.md`.

**CI trước đây "nói dối"**: `lint`/`test` từng bị bọc `|| echo` nên không bao giờ fail — CI xanh không có nghĩa test pass. Đã sửa trong `ci-pr.yml`/`ci-main.yml`.

**Git Flow**: `develop` (staging) → `main` (production, chỉ chủ repo merge). Hai môi trường deploy tách biệt qua Railway/Vercel — xem checklist staging trong README nếu cần set up.

**GitHub MCP đã verify hoạt động thật** (không chỉ cấu hình lý thuyết) — client_id `Ov23lijeoeW3qbp7cH35` của OAuth App "TravelPlan" đã đăng ký và test xong luồng OAuth đầy đủ. Chi tiết cạm bẫy (DCR không hỗ trợ, path callback thật, lỗi do Windows Git Bash vs PowerShell tính khác project) ở `.claude/rules/tech-defaults.md`.

## MCP Servers

Khai báo ở `.mcp.json`, mỗi người tự approve/authorize khi dùng lần đầu (`/mcp`).

| Server            | Dùng để                                                                       | Cần gì trên máy                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `github`          | Thao tác PR / issue / code search trực tiếp qua remote HTTP, OAuth qua `/mcp` | Đăng ký OAuth App thủ công + `--client-id`/`--client-secret`/`--callback-port` — xem cạm bẫy "GitHub MCP OAuth" ở `.claude/rules/tech-defaults.md`, đừng chỉ bấm `/mcp` suông vì sẽ fail với lỗi DCR |
| `chrome-devtools` | Mở app thật trong Chrome để xem UI, đọc console/network, đo performance/a11y  | Google Chrome + Node (chạy qua `npx`)                                                                                                                                                                |

Chỉ nhóm tool đọc (`screenshot`, `snapshot`, `console`, `network`) auto-allow trên `chrome-devtools`; `navigate_page` / `click` / gõ phím / `evaluate_script` vẫn hỏi xác nhận từng lần.
