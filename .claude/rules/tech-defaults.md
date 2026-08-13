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
npm run check:services       # ping Mongo/Redis/Clerk/Gemini/Places/Mapbox/… in bảng OK/FAIL/SKIP
npm run check:services -- --strict   # exit 1 nếu có FAIL (dùng cho CI)
```

`check:services` (`backend/scripts/check-services.ts`) **cố ý không import `src/config/env.ts`** — envalid fail-fast sẽ giết process khi thiếu key, mà script này phải _báo cáo_ tình trạng thiếu key chứ không chết theo. Nó đọc `backend/.env` rồi `.env` ở root (shell env thắng cả hai) và in ra biến nào đến từ file nào. Logic thật nằm ở `backend/src/lib/service-checks/` để test được; `scripts/` chỉ là runner mỏng.

`docker-compose.yml`: services `mongodb`, `redis`, `api`, `worker`, network `travelplan-network` — dùng khi cần môi trường gần giống production ở local.

## Bản đồ API (`backend/src/index.ts`)

`/api/webhooks` (raw body, mount **trước** Clerk middleware/json parser) · `/api/ai` · `/api/users` · `/api/billing` · `/api/dev` (⚠️ xem Cạm bẫy) · `/api` (planner + weather) · `/api` (calendar, chỉ khi `isCalendarSyncEnabled()`) · `/api/destinations` · `GET /health` (process) · `GET /ready` (Mongo + Redis) · `/api/docs` (swagger, phần lớn route thiếu annotation).

## Cạm bẫy hay gặp (bài học đã trả giá)

- **Bug "IDLE"**: với priority queue, job vào state BullMQ `"prioritized"` chứ không phải `"waiting"`. `JOB_STATE_TO_STATUS` phải map `prioritized → "QUEUED"`, nếu không UI báo 0% IDLE dù job đang chạy thật.
- **Mongoose defaults anti-pattern**: không truyền raw schema object `{ type: true, default: true }` lúc `create()` → `Cast to Boolean failed`. Luôn gán giá trị thuần `true`/`false`.
- **Pino "empty error object"**: `logger.error({ error }, "msg")` in ra `{}` rỗng vô dụng. Dùng `logger.error({ err: error }, "msg")` hoặc destructure `error.message`/`error.stack`.
- **CORS**: mỗi khi thêm custom header mới cho request (vd `x-idempotency-key`) **bắt buộc** thêm vào mảng `allowedHeaders` trong `backend/src/config/cors.ts`, nếu không request bị block ở preflight.
- **CI trước đây "nói dối"**: `lint`/`test` từng bị bọc `|| echo` trong workflow nên không bao giờ làm fail job — đã sửa ở `ci-pr.yml`/`ci-main.yml` (xem `.claude/rules/workflow.md`), nhưng nếu thấy pattern `|| echo` xuất hiện lại ở bất kỳ step CI nào thì đó là dấu hiệu ai đó đang vô hiệu hoá gate, cần hỏi lại trước khi giữ nguyên.
- **ioredis nuốt nguyên nhân thật**: `connect()` reject với message vô dụng `"Connection is closed."`, còn lỗi thật (`ECONNREFUSED`, `ENOTFOUND`, `NOAUTH`) chỉ đi ra qua event `"error"`. Luôn gắn `client.on("error", …)` và ưu tiên lỗi đó khi báo cáo — bỏ qua thì vừa mất thông tin chẩn đoán, vừa bị Node cảnh báo "Unhandled error event". Xem `backend/src/lib/service-checks/redis.check.ts`.
- **Logic connection Redis nằm ở `backend/src/lib/redis-options.ts`** (pure, có test), `queue.ts` chỉ gọi `buildRedisConnectionOptions(env)`. Đừng copy heuristic TLS ra chỗ khác — `queue.ts` import `config/env` và mở sẵn một IORedis connection lúc module load, nên **không import được từ script/tooling**; dùng `redis-options.ts` thay vì nhân bản.
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
- **Đừng để script scratch/debug trong `backend/src/`**: `src/**` nằm trong `include` của `backend/tsconfig.json` nên mọi file ở đó vào thẳng typecheck/lint/build thật (từng xảy ra với `src/test-rag.ts`, `test-db.js`, `tz-test*.js` bị commit nhầm và sống trong repo cả tháng). Script one-off phải nằm ở `backend/scripts/` (đã bị `tsconfig.json` `exclude`), và nếu cần giữ lại logic thì viết thành Vitest thật theo TDD rule chứ không để script rời.
- **Google Places bị bill oan do billing account dùng chung**: `GOOGLE_PLACES_API_KEY` sống ở GCP project `travelplan-486522`, `GEMINI_API_KEY` sống ở project riêng `gen-lang-client-0544187342` (project Google tự tạo khi generate key qua AI Studio) — hai project độc lập, không chung rủi ro với nhau. Sự cố thật (tháng 4/2026) đến từ một project **thứ ba** không liên quan (`gen-lang-client-0018284855`, tên "quickblog") share chung billing account `016473-6893AD-EB20F9` ("Mon compte de facturation") — key của project đó bị lộ, đốt $68.21/$68.29 hoá đơn trong đúng 1 ngày bằng Gemini 3 Pro/Flash. Đóng cả billing account để chặn khẩn cấp đã khiến Places bị "chết oan" theo, dù Places chỉ tốn $0.00 cả tháng đó. **Bài học: billing account dùng chung nhiều project là điểm rủi ro** — một project bị lộ key kéo mọi project khác trên cùng account bị vạ lây khi phải đóng billing khẩn cấp.
  - Kiểm nhanh: `gcloud billing projects describe <PROJECT_ID>` xem `billingEnabled`; `gcloud billing accounts describe <ACCOUNT_ID>` xem account có `open: true`; `gcloud billing accounts get-iam-policy <ACCOUNT_ID>` xem ai đang có quyền gắn project lạ vào billing account của mình.
  - Setup hiện tại: `travelplan-486522` link billing account riêng `t1amp` (`01C84D-A6B93B-F517F1`), tách hẳn khỏi account cũ dính sự cố. `gen-lang-client-0544187342` (Gemini) đã `gcloud billing projects unlink` — không còn billing account nào, chỉ chạy free tier, vượt quota ra lỗi 429 chứ không bao giờ bị tính tiền vì không có gì để trừ vào.
- **Killswitch tự ngắt billing khi vượt ngân sách**: pattern chuẩn của Google — Cloud Billing Budget → Pub/Sub topic → Cloud Function (`stop_billing`, Python, gen2) gọi `CloudBillingClient.update_project_billing_info` với `billing_account_name=""` để detach billing khỏi project khi `costAmount` vượt `budgetAmount`. Đã dựng cho `travelplan-486522`: budget **$5**, threshold 85% (~$4.25, chừa buffer vì Pub/Sub notification có độ trễ ~20 phút theo Google tự ghi). Function cần role **Billing Account Administrator** (`roles/billing.admin`) gắn trên **billing account**, không phải trên project. Luôn deploy với `SIMULATE_DEACTIVATION = True` trước, test bằng `gcloud pubsub topics publish <topic> --message='{"costAmount": X, "budgetAmount": Y}'` (X > Y), xác nhận log `"Billing disabled. (Simulated)"` trước khi chuyển `False` và redeploy — tuyệt đối không test bản live, nó sẽ thật sự ngắt billing.
- **`gcloud alpha services quota update` cần `--force` khi giảm quota >10%**: Google chặn giảm đột ngột (coi là "unsafe override") trừ khi thêm `--force`. Cần dùng khi hạ quota mặc định quá rộng của Google — vd `places.googleapis.com/GetPhotoMediaRequest` mặc định **175,000/ngày** (gần như không giới hạn), trong khi `SearchTextRequest`/`SearchNearbyRequest` Google đã tự giới hạn sẵn 100/ngày. Field mask request `rating`/`userRatingCount` (Atmosphere Data, dùng ở `places.service.ts`) đẩy SKU lên tier **Pro** (free quota 5,000/tháng), không phải Essentials (10,000/tháng) — tính đúng free tier phải theo field mask thật đang gọi, không phải theo mặc định rẻ nhất.

## Itinerary Builder Protocol

Chi tiết đầy đủ ở skill `itinerary-builder` (`.claude/skills/itinerary-builder/SKILL.md`) — chỉ nạp khi thực sự đụng vào pipeline sinh lịch trình. Tóm tắt bắt buộc nhớ:

Thứ tự 6 bước **không được đổi, không được bỏ**: `flattenIntents() → validateBatch() → [deficit check + fill] → buildTaggedPlaces() → clusterByProximity() → buildItinerary()`. Cấm global round-robin index để chọn place (sinh trùng lặp) — phải slice theo ngày.

## Nợ kỹ thuật đã xác minh (không tự sửa trừ khi được giao)

- **Mapbox lệch tên biến ở frontend (bug thật, chưa sửa)**: `frontend/web/src/features/map/hooks/useMap.ts` chỉ đọc `VITE_MAPBOX_TOKEN`, còn `frontend/web/src/config/env.ts` chấp nhận `VITE_MAPBOX_ACCESS_TOKEN || VITE_MAPBOX_TOKEN`. `render.yaml`, `ci-pr.yml`, `ci-main.yml` và `.env.example` **chỉ** cấp `VITE_MAPBOX_ACCESS_TOKEN` → bản đồ chạy ở local (vì `frontend/web/.env` có `VITE_MAPBOX_TOKEN`) nhưng token là `undefined` trên deploy cấu hình theo docs.
- **`railway.toml` lệch hẳn với project Railway thật**: file khai báo `travelplan-api` / `travelplan-worker` / `travelplan-redis` và `startCommand = node dist/index.js`; project `travelplan` thật có `travelplan-web` / `travelplan-worker` / `Redis`, source repo là `tlamDson/plancare`, và `backend/package.json` `start` là `node dist/backend/src/index.js` (do `rootDir: ".."`). Đừng tin `railway.toml` là mô tả đúng hiện trạng.
- `backend/src/features/planner/controllers/trip.controller.ts` — 882 dòng, vi phạm Rule of 200, 33 chỗ `as any` (`(trip as any).regenCount`…) vì type Mongoose `Trip` lệch schema thật code đang dùng.
- **`places.service.ts` không dùng `PlaceCache` (lỗ cache, cost driver thật)**: `nearby-food.service.ts` cache kết quả qua `PlaceCache`/`place-cache.repository.ts`, nhưng `places.service.ts` — nơi validate **mọi** place do AI sinh ra lúc tạo trip (`places:searchText`) — không gọi `PlaceCache` ở đâu cả. Hai user tạo trip tới cùng thành phố (Paris, Tokyo…) đang gọi Google Places API lặp lại y hệt nhau, không tận dụng cache có sẵn. Đây là nguồn ngốn quota/chi phí lớn nhất khi scale nhiều user — nên fix bằng cách route `places.service.ts` qua `place-cache.repository.ts` giống `nearby-food.service.ts` đã làm.
- 119 chỗ `any` rải rác 33 file backend, phần lớn ở `catch (error: any)`.
- `generalLimiter` (rate limiter) định nghĩa trong `backend/src/middlewares/rate-limiter.ts` nhưng **không gắn vào route nào** — chỉ `tripCreationLimiter` thật sự hoạt động trên `/api/trips`.
- `POST /api/dev/scrape-insights` **không có middleware auth**, mount vô điều kiện trong `index.ts` — trên repo public đây là lỗ hổng thật, nên xử lý bằng PR riêng.
- `frontend/web` không có test nào, không có script `test`/`typecheck` (đã bổ sung hạ tầng — xem `.claude/rules/workflow.md` mục TDD). Backend chỉ có 3 file test, đều trong `features/destinations/services/`.
- 19 component shadcn trong `frontend/web/src/components/ui/` (accordion, breadcrumb, carousel, chart, table, tabs, sheet, sidebar, menubar, drawer, pagination, scroll-area, collapsible, context-menu, hover-card, input-otp, navigation-menu, aspect-ratio, resizeable) **chưa được import ở đâu** — cố ý giữ lại (shadcn vốn copy-in on demand), nhưng đừng `npx shadcn add` thêm component mới nếu chưa dùng ngay.

## Deploy & vận hành

Railway (API + worker + Redis), Vercel (`npx turbo run build --filter=web`, output `frontend/web/dist`), `render.yaml` làm phương án dự phòng. `develop` → môi trường staging, `main` → production (xem checklist staging trong README hoặc hỏi maintainer nếu service Railway/Vercel staging chưa được set up). Container phải crash khi thiếu env bắt buộc. BullBoard `/admin/queues` **phải** có Basic Auth nếu bật ở production.
