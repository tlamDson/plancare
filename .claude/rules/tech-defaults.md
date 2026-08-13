# Tech Defaults — Kiến trúc, hạ tầng, cạm bẫy

## Kiến trúc

Monorepo TypeScript, npm workspaces + turbo. Workspaces: `backend`, `frontend/web`, `frontend/mobile`, `packages/*`. `packageManager: npm@10.9.3`, `engines.node >= 20`.

- **`backend`** — Express 5 + Mongoose 9 + BullMQ/ioredis. Một workspace chứa cả API (`src/index.ts`) lẫn worker (`src/worker.ts`), không phải hai package riêng. Auth: Clerk (`@clerk/express`). AI: Gemini (`GEMINI_API_KEY`, **không phải** OpenAI hay Gemini 1.5 — bản đang dùng là Gemini 2.0). Zod cho validation. Vitest cho test.
- **`frontend/web`** — React 19 + Vite 7 SPA (không phải Next.js). `react-router-dom` v7, TanStack Query, Zustand, Tailwind + shadcn/ui, Clerk React, Mapbox GL.
- **`frontend/mobile`** — Expo/React Native, giai đoạn sớm.
- **`packages/shared`** (`@travelplan/shared`) — Zod schema + TS type dùng chung, build bằng `tsup`.

⚠️ **Lệch tài liệu**: `docs/agents/*.md` và `docs/PLAN.md` mô tả layout lý tưởng `web/` + `api/` + `worker/` + `@voyager/shared` tách riêng — thực tế không có các thư mục đó, dùng cấu trúc ở trên. Đừng đi tìm thư mục không tồn tại.

## Voyager core (áp dụng cho mọi layer)

- **Production Build Gate (không thương lượng):** chạy và pass `npm run build` từ root trước khi coi task xong. Zero TypeScript error, zero ESLint error, zero bundler error. Coi mọi warning là error — sửa, không suppress. Build fail → dừng mọi việc, sửa build trước.
- **Rule of 200:** không file source nào vượt 200 dòng. Cách xử lý: tách hook, tách sub-component, tách service. Ngoại lệ: file config toàn cục, `frontend/web/src/stores/useTranslationStore.ts`, trang settings dài ít logic động.
- **Repository Symmetry:** mỗi domain nghiệp vụ tồn tại đối xứng ở `frontend/web/src/features/<domain>/`, `backend/src/features/<domain>/`, và (khi có contract dùng chung) `packages/shared/src/schemas/<domain>.ts`.
- **Shared Kernel:** `packages/shared` là nguồn sự thật duy nhất cho data contract. Được phép: Zod schema, TS interface, error code, constant. Cấm: UI component, business logic, database model.
- **Cross-Layer Impact Rule:** trước khi implement bất kỳ thay đổi nào có tác động chéo, nêu rõ (1) layer nào bị ảnh hưởng, (2) đổi gì ở mỗi layer, (3) **thứ tự: `packages/shared` TRƯỚC → backend → frontend**. Không bao giờ sửa một layer khi thay đổi có tác động chéo tới layer khác.
- **Structured Logging:** không dùng `console.log`. Dùng Pino (`backend/src/lib/logger.ts`), kèm `correlationId`/`jobId` trên mỗi entry, tag `service: "api" | "worker" | "web"`, format JSON.
- **Zero Trust:** validate mọi input bằng Zod (cả request lẫn response); `DOMPurify` trước khi render output AI ở frontend; `sanitize-html` trước khi ghi output AI vào MongoDB; crash lúc startup nếu thiếu env var bắt buộc (đã làm qua `envalid` ở `backend/src/config/env.ts`).
- **Trip State Machine:** `DRAFT → QUEUED → PROCESSING → COMPLETED` (↘ `FAILED`). Worker phải kiểm tra `Trip.status` trước mỗi bước (idempotency).
- **Không tạo file `.md` mới ở thư mục gốc.** Chỉ `README.md` và `CLAUDE.md` được phép ở root. Ghi chú/kế hoạch mới → thư mục con trong `docs/`.

## Kiến trúc lớp backend

Controller "ngu": validate input → gọi service → trả JSON. Service "khôn": chứa business logic. Repository: chỉ chạm database, **không logic**. Controller chạm thẳng Mongoose = reject PR khi review.

**Fire & Listen:** `POST /api/trips` → Zod validate → `tripQueue.add()` → trả `{ jobId }` ngay. Controller **không bao giờ** `await` quá trình sinh trip. Worker: tối đa 5 job đồng thời, **phải** gọi `job.progress(n)` ở mỗi bước (25/50/75%), lưu kết quả từng phần để UI có thể hiển thị tiến độ.

**AI là untrusted service:** AI không được gọi external API trực tiếp, phải qua tool trong `backend/src/features/planner/tools/`. Mọi place do AI sinh phải đối chiếu qua `searchPlaces`. Circuit breaker bằng `opossum` (`backend/src/features/planner/tools/circuit-breaker.ts`) bọc quanh Mapbox/Google Places. Retry AI tối đa 3 lần rồi fail gracefully.

## Hạ tầng dev

```bash
npm install                # root, cài toàn bộ workspaces
npm run dev:api             # backend API, http://localhost:3000
npm run dev:web              # frontend, http://localhost:5173
npm run dev:worker           # BullMQ worker
npm run build:shared         # PHẢI chạy trước typecheck/build nếu sửa packages/shared
npm run build                # tất cả workspace (--if-present)
npm run typecheck
npm run lint
npm run test
```

`docker-compose.yml`: services `mongodb`, `redis`, `api`, `worker`, network `travelplan-network` — dùng khi cần môi trường gần giống production ở local.

## Bản đồ API (`backend/src/index.ts`)

`/api/webhooks` (raw body, mount **trước** Clerk middleware/json parser) · `/api/ai` · `/api/users` · `/api/billing` · `/api/dev` (⚠️ xem Cạm bẫy) · `/api` (planner + weather) · `/api` (calendar, chỉ khi `isCalendarSyncEnabled()`) · `/api/destinations` · `GET /health` (process) · `GET /ready` (Mongo + Redis) · `/api/docs` (swagger, phần lớn route thiếu annotation).

## Cạm bẫy hay gặp (bài học đã trả giá)

- **Bug "IDLE"**: với priority queue, job vào state BullMQ `"prioritized"` chứ không phải `"waiting"`. `JOB_STATE_TO_STATUS` phải map `prioritized → "QUEUED"`, nếu không UI báo 0% IDLE dù job đang chạy thật.
- **Mongoose defaults anti-pattern**: không truyền raw schema object `{ type: true, default: true }` lúc `create()` → `Cast to Boolean failed`. Luôn gán giá trị thuần `true`/`false`.
- **Pino "empty error object"**: `logger.error({ error }, "msg")` in ra `{}` rỗng vô dụng. Dùng `logger.error({ err: error }, "msg")` hoặc destructure `error.message`/`error.stack`.
- **CORS**: mỗi khi thêm custom header mới cho request (vd `x-idempotency-key`) **bắt buộc** thêm vào mảng `allowedHeaders` trong `backend/src/config/cors.ts`, nếu không request bị block ở preflight.
- **CI trước đây "nói dối"**: `lint`/`test` từng bị bọc `|| echo` trong workflow nên không bao giờ làm fail job — đã sửa ở `ci-pr.yml`/`ci-main.yml` (xem `.claude/rules/workflow.md`), nhưng nếu thấy pattern `|| echo` xuất hiện lại ở bất kỳ step CI nào thì đó là dấu hiệu ai đó đang vô hiệu hoá gate, cần hỏi lại trước khi giữ nguyên.
- **Redis TLS**: `backend/src/lib/queue.ts` tự nhận diện `redis://` vs `rediss://` từ `REDIS_URL`, và có heuristic theo host (`railway.internal`/`localhost`/`127.0.0.1`/`redis` → không TLS). Khi bật TLS, code đặt `rejectUnauthorized: false` — chấp nhận được cho vài managed Redis có self-signed cert, nhưng đừng mở rộng phạm vi này mà không cân nhắc.
- **GitHub MCP OAuth — GitHub không hỗ trợ Dynamic Client Registration**: server `github` trong `.mcp.json` (remote HTTP, `https://api.githubcopilot.com/mcp/`) không tự đăng ký được client như một số MCP server khác — bắt buộc đăng ký thủ công một GitHub OAuth App rồi cấu hình `--client-id`/`--client-secret`/`--callback-port` ở scope local (không commit secret). Nếu bỏ qua bước này sẽ gặp lỗi `SDK auth failed: Incompatible auth server: does not support dynamic client registration`.
  - Callback URL Claude Code thực sự gửi là **`http://localhost:<port>/callback`** (không phải `/oauth/callback` như path hay đoán nhầm) — phải khớp **chính xác** với "Authorization callback URL" đã đăng ký trên GitHub, sai một ký tự cũng fail với lỗi "redirect_uri is not associated with this application".
  - GitHub OAuth App **vẫn yêu cầu `client_secret`** ở bước đổi `code` lấy `token` dù đã dùng PKCE (khác một số IdP khác cho phép public client PKCE-only) — thiếu secret sẽ fail với lỗi "The client_id and/or client_secret passed are incorrect".
  - OAuth App "TravelPlan" đã đăng ký sẵn, `client_id` công khai (an toàn để chia sẻ): `Ov23lijeoeW3qbp7cH35`, callback port đã chọn: `51004`. Xin `client_secret` từ chủ repo qua kênh an toàn (không qua git/chat công khai), rồi chạy:
    ```bash
    $env:MCP_CLIENT_SECRET = "<secret>"   # PowerShell — tránh paste vào prompt ẩn, xem cạm bẫy dưới
    claude mcp add --transport http --client-id Ov23lijeoeW3qbp7cH35 --client-secret --callback-port 51004 -s local github https://api.githubcopilot.com/mcp/
    ```
- **`claude mcp` chạy khác shell → khác project-key**: CLI dùng đường dẫn thư mục làm key lưu config theo project trong `~/.claude.json`, và **không chuẩn hoá chữ hoa/thường ổ đĩa trên Windows** — `claude mcp ...` chạy từ Git Bash (tự động viết thường `d:/...`) và từ PowerShell (`D:\...`) bị coi là **hai project khác nhau**, dẫn tới hiện tượng config "biến mất"/"already exists" giả tạo dù vừa mới add xong. Luôn quản lý MCP server (`claude mcp add/remove/get/list`) từ **cùng một shell** bạn dùng để chạy `claude` tương tác (trong repo này: PowerShell).
- **Paste vào prompt ẩn của `claude mcp add --client-secret` trên PowerShell 5.1 có thể bị lỗi** (thiếu ký tự khi paste vào hidden input) — dùng biến môi trường `$env:MCP_CLIENT_SECRET` trước khi chạy `--client-secret` để tránh hẳn việc paste vào prompt ẩn.
- **`github.com` (trang web) có thể chập chờn tách biệt với `api.github.com`/`api.githubcopilot.com`** (luôn ổn định) — nếu OAuth fail với `SDK auth failed: The socket connection was closed unexpectedly`, thường chỉ cần thử lại `/mcp` vài lần là qua, không phải lỗi cấu hình.

## Itinerary Builder Protocol

Chi tiết đầy đủ ở skill `itinerary-builder` (`.claude/skills/itinerary-builder/SKILL.md`) — chỉ nạp khi thực sự đụng vào pipeline sinh lịch trình. Tóm tắt bắt buộc nhớ:

Thứ tự 6 bước **không được đổi, không được bỏ**: `flattenIntents() → validateBatch() → [deficit check + fill] → buildTaggedPlaces() → clusterByProximity() → buildItinerary()`. Cấm global round-robin index để chọn place (sinh trùng lặp) — phải slice theo ngày.

## Nợ kỹ thuật đã xác minh (không tự sửa trừ khi được giao)

- `backend/src/features/planner/controllers/trip.controller.ts` — 882 dòng, vi phạm Rule of 200, 33 chỗ `as any` (`(trip as any).regenCount`…) vì type Mongoose `Trip` lệch schema thật code đang dùng.
- 119 chỗ `any` rải rác 33 file backend, phần lớn ở `catch (error: any)`.
- `generalLimiter` (rate limiter) định nghĩa trong `backend/src/middlewares/rate-limiter.ts` nhưng **không gắn vào route nào** — chỉ `tripCreationLimiter` thật sự hoạt động trên `/api/trips`.
- `POST /api/dev/scrape-insights` **không có middleware auth**, mount vô điều kiện trong `index.ts` — trên repo public đây là lỗ hổng thật, nên xử lý bằng PR riêng.
- `frontend/web` không có test nào, không có script `test`/`typecheck` (đã bổ sung hạ tầng — xem `.claude/rules/workflow.md` mục TDD). Backend chỉ có 3 file test, đều trong `features/destinations/services/`.

## Deploy & vận hành

Railway (API + worker + Redis), Vercel (`npx turbo run build --filter=web`, output `frontend/web/dist`), `render.yaml` làm phương án dự phòng. `develop` → môi trường staging, `main` → production (xem checklist staging trong README hoặc hỏi maintainer nếu service Railway/Vercel staging chưa được set up). Container phải crash khi thiếu env bắt buộc. BullBoard `/admin/queues` **phải** có Basic Auth nếu bật ở production.
