# Workflow — Git Flow, Commit, PR, TDD

## Quy tắc bất di bất dịch

1. **Mọi thay đổi đều phải qua PR.** Không bao giờ commit thẳng vào `develop` hay `main`. Có gì cần commit → tạo nhánh mới → commit → push → mở PR vào `develop`.
2. **`main` do chủ repo quản lý.** Claude/dev **không được** merge vào `main` dưới bất kỳ hình thức nào (kể cả khi CI xanh, kể cả dùng `--admin`/bypass required checks), không push thẳng, không tự mở PR release trừ khi được yêu cầu rõ ràng. PR `develop → main` chỉ chủ repo tự thực hiện khi release — kể cả khi chủ repo nói những câu rộng như "làm hết đi", "bạn tự xử lý", "merge luôn" trong lúc trò chuyện, **không** coi đó là uỷ quyền bấm merge vào `main` trừ khi họ nói tường minh đúng nghĩa đó (vd "bạn merge main luôn"). Khi không chắc, luôn hỏi lại "bạn muốn tôi bấm merge, hay để bạn tự bấm?" trước khi chạm `main` — quy tắc viết sẵn ở đây luôn thắng suy luận từ câu nói mơ hồ trong hội thoại. **Nếu chủ repo tự merge `develop → main`, PR đó phải là merge commit thật (giữ nguyên lịch sử `develop`), không squash** — `main` cần phản ánh đúng lịch sử commit đã review trên `develop`, không phải một commit gộp duy nhất.
3. **Chỉ merge PR vào `develop` khi CI + toàn bộ test pass.** Bắt buộc xác nhận **cả 3 job** đã xanh: `Lint + Unit Tests`, `Typecheck + Build`, `Backend Docker Build`. CI đỏ hoặc đang chạy → không merge, đợi hoặc fix.
4. **Cập nhật `CLAUDE.md` và `.claude/rules/*` khi task làm thay đổi convention/tooling**, để lần sau còn áp dụng đúng.
5. **Sửa bug quan sát được qua trình duyệt (UI/frontend, hoặc backend bug lộ ra qua UI) phải verify bằng `chrome-devtools` MCP cả trước lẫn sau khi fix** — xem mục [Debug bug](#debug-bug--verify-bằng-chrome-devtools-mcp).
6. **Claude được tự merge PR vào `develop`** ngay khi cả 3 CI job bắt buộc đã xanh và test local đã pass — không cần hỏi lại người dùng trước khi merge. **Merge vào `main` thì không bao giờ tự làm**, dù CI xanh — luôn để chủ repo tự thực hiện.

## Git Flow

`develop ← feature/* (PR + CI pass)`, `main ← develop (PR + CI pass, production-ready — chỉ chủ repo merge)`. Không bao giờ push thẳng lên `main`. Luôn tạo nhánh mới từ `develop` mới nhất:

```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<short-kebab-case-description>
```

**Branch types:** `feature/`, `fix/`, `test/`, `docs/`, `chore/`. Chữ thường, phân tách bằng `-`, mô tả cụ thể phạm vi (không dùng `feature/update`, `fix/bug`, `feature/wip`). Ghi rõ module/trang liên quan khi có thể: `feature/destination-picker-search`, `fix/trip-detail-drag-drop`.

## Versioning

Số version sống ở root `package.json` — đây là nguồn sự thật duy nhất. 5 chỗ còn lại phải mirror theo mỗi lần bump: `backend/package.json`, `packages/shared/package.json`, `frontend/mobile/package.json`, `frontend/web/package.json`, và `backend/src/app.ts`'s Swagger `info.version` (lộ ra ở `/api/docs`, dễ bỏ sót vì không nằm trong package.json nào). Tag release dạng `v<version>` (vd `v0.1.0`), gắn trên `main` sau khi `develop → main` merge — theo mục "Merge policy" ở dưới, chỉ chủ repo merge/tag.

## Commit Messages

Imperative mood, hoàn thành câu _"If applied, this commit will… [message]"_. Một dòng, không dùng prefix `feat:`/`fix:` (prefix đó chỉ dành cho PR title).

Verb chuẩn: `add`, `fix`, `update`, `remove`, `refactor`, `test`, `docs`, `chore`.

```
add unit test for trip status idempotency
fix itinerary clustering duplicate place bug
update wizard destination picker empty state copy
```

Không dùng: `fix bug`, `update code`, `WIP`, `added stuff`, past tense (`Fixed login`), hay prefix `feat:` trong commit.

Không commit: `.env`/credentials/tokens, `node_modules/`, `dist/`, coverage reports, file không liên quan task.

## Pull Requests

Target mặc định là `develop` (chỉ target `main` khi release, từ `develop`). Title format `<type>: <short description>` (< 72 ký tự): `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`.

PR description dùng template:

```markdown
## Summary

- <thay đổi chính>
- <lý do / impact>

## Test plan

- [ ] Unit tests added/updated (TDD: RED → GREEN)
- [ ] `npm run test` pass locally
- [ ] `npm run typecheck` và `npm run build` pass locally
- [ ] No `.env` or secrets committed
```

Trước khi đề xuất merge, tự verify: nhánh tạo từ `develop` mới nhất, commit message đúng convention, có test cho logic mới, không hardcode secrets, PR target đúng branch. CI check bắt buộc: `Lint + Unit Tests`, `Typecheck + Build`, `Backend Docker Build`.

### Merge policy

| Target    | Ai merge                                                                     | Điều kiện                                                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `develop` | **Claude được tự merge**, không cần hỏi lại                                  | **Cả 3 CI job pass** + toàn bộ test local pass. CI đỏ/đang chạy → đợi, không merge.                                                                                                    |
| `main`    | **Chỉ chủ repo** — kể cả khi được nói "làm hết"/"merge luôn" trong hội thoại | Claude không bao giờ bấm merge (kể cả `--admin`), không push, không tự mở PR release trừ khi được yêu cầu rõ ràng. Merge commit thật, **không squash** — giữ nguyên lịch sử `develop`. |

Kiểm tra CI trước khi merge:

```bash
gh pr checks <PR-number>          # xem trạng thái từng check
gh pr merge <PR-number> --squash  # CHỈ dùng cho PR target develop, sau khi cả 3 check bắt buộc xanh
# PR target main: Claude KHÔNG chạy gh pr merge dưới bất kỳ flag nào — chuẩn bị xong rồi dừng, để chủ repo tự bấm merge (merge commit thật, không squash).
```

### Theo dõi CI sau khi mở PR

Mặc định: ngay sau khi mở PR, dùng `ScheduleWakeup` để tự đánh thức lại sau **120 giây** rồi check `gh pr checks <PR-number>` — không giữ turn chờ đồng bộ và không để user tự check tay. Pipeline `ci-pr.yml` hiện tại mất khoảng 2-3 phút để chạy xong cả 3 job bắt buộc; mốc 120s là ước lượng ban đầu, nếu CI chưa xong thì `ScheduleWakeup` lại một vòng nữa thay vì báo sai. Điều chỉnh lại con số này khi có dữ liệu thời gian chạy thực tế.

**Trước khi push thêm commit vào một PR đã mở**, luôn `gh pr view <PR-number> --json state,mergedAt` trước — nếu `state` đã `MERGED`/`CLOSED` thì push đó **không** trigger CI mới (`ci-pr.yml` chỉ chạy trên event `pull_request`, PR đóng thì không có `synchronize`). Tạo nhánh mới từ `develop` mới nhất cho phần việc còn lại thay vì push vào branch đã merged rồi ngồi chờ CI không bao giờ tới.

### Sửa `ci-pr.yml` — đừng làm mất required check

Tên ba job trong `.github/workflows/ci-pr.yml` **chính là** định danh required status check phía GitHub. Vì vậy:

- **Không đổi tên** `Lint + Unit Tests` / `Typecheck + Build` / `Backend Docker Build`. Cần tách việc thì thêm job mới tên khác.
- **Không thêm `paths:` vào `on: pull_request`** — workflow sẽ không chạy, check treo ở _Expected_ vĩnh viễn và PR **không merge được**.
- **Không đặt `if:` ở cấp job** cho ba job này. Muốn bỏ qua việc nặng thì gate ở cấp **step**, để job vẫn chạy và vẫn kết thúc Success.

Mẫu đang dùng: job `changes` (`dorny/paths-filter`) xuất `outputs.backend`; job `docker` đặt `env.SHOULD_BUILD` rồi gắn `if: env.SHOULD_BUILD == 'true'` lên từng step build, kèm một step `echo` cho nhánh còn lại. PR target `main` (release) luôn build thật, không tin vào filter.

Job phụ không-bắt-buộc (`security`, `e2e`) đứng ngoài ba job trên, được phép đỏ mà không chặn merge — nhưng **đừng tự ý thêm chúng vào branch protection required checks**, kể cả khi thấy chúng đã ổn định lâu.

> `gh` có thể chưa được auth trên máy khác. Khi đó dùng GitHub MCP server, hoặc gọi thẳng REST API bằng token.

## TDD (Red → Green → Refactor) — bắt buộc cho mọi feature/fix

1. **RED** — viết test fail trước, chưa viết implementation. Backend unit: `backend/src/features/<domain>/**/<name>.test.ts`. Backend integration: `backend/src/test/integration/<name>.integration.test.ts` (chỉ khi cần verify qua HTTP thật với Mongo/Redis thật — xem `.claude/rules/tech-defaults.md` mục "Hạ tầng test"). Frontend: `frontend/web/src/features/<domain>/__tests__/<Component>.test.tsx` (hoặc `hooks/__tests__/`, `stores/__tests__/` tuỳ vị trí file gốc). Xác nhận thấy đỏ thật (assertion fail hoặc import error đúng nghĩa, **không phải lỗi cấu hình**) trước khi tiếp tục.
2. **GREEN** — code tối thiểu để pass, không thêm logic chưa có test bao phủ.
3. **REFACTOR** — cải thiện code, chạy lại toàn bộ test, không được break.

```bash
# Toàn repo
npm run test

# Backend unit
npm run test -w backend
npm run test -w backend -- --watch

# Backend integration (cần docker compose up -d mongodb redis trước)
npm run test:integration -w backend

# Frontend
npm run test -w frontend/web

# E2E (4 spec CI-safe — cần .env.e2e local hoặc GH secrets trên CI, xem tech-defaults.md)
npm run e2e
npm run e2e -- --ui
```

Backend **unit** mock repository layer bằng `vi.mock()` — không dùng Mongo thật. Mock `bullmq` và chạy processor đồng bộ. **Không bao giờ** gọi API AI/Mapbox/Google Places thật trong unit test — dùng golden fixture ở `backend/src/test/fixtures/` (`valid-trip.json`, `malformed-trip.json`, `empty-results.json`). Backend **integration** thì ngược lại — dùng Mongo/Redis/BullMQ **thật** qua `supertest` + `createApp()` (`backend/src/app.ts`), chỉ mock `@clerk/express` (xem pattern trong `trips.integration.test.ts`) vì không có session Clerk thật.

Frontend mock API bằng MSW (`http`/`HttpResponse` từ `msw`), không mock module trực tiếp nếu MSW đủ dùng. Component gọi API phải render trong `AppProviders` (QueryClient + Clerk + Router) — dùng helper `frontend/web/src/test/renderWithProviders.tsx` (component) hoặc `renderHookWithQuery.tsx` (hook) thay cho `render()`/`renderHook()` trần.

Quy ước bổ sung rút ra khi dựng hạ tầng test:

- Test timer (polling job status, exponential backoff): `vi.useFakeTimers()` + `await vi.advanceTimersByTimeAsync(ms)`; nhớ `vi.useRealTimers()` trong `afterEach`. Khi test cần cả fake timer lẫn `userEvent` (click/type), dùng `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` — trộn `waitFor()` với fake timer dễ deadlock vì `waitFor` cũng poll bằng `setTimeout`.
- Zustand store không có `reset()` riêng thì snapshot state ban đầu (`const INITIAL = useXStore.getState()`) rồi `useXStore.setState(INITIAL, true)` trong `beforeEach` — tránh rò rỉ state giữa test.
- Test đụng Radix Popover/Select/cmdk cần polyfill `ResizeObserver`/`scrollIntoView` — đã có sẵn trong `frontend/web/src/test/setup.ts`, không cần thêm lại.
- Bug tìm thấy khi viết test mà không thuộc phạm vi task hiện tại → viết test khẳng định hành vi **hiện tại** (dù là bug) kèm comment `[BUG]` giải thích, không tự sửa ngoài phạm vi được giao. Ghi lại vào `.claude/rules/tech-defaults.md` mục "Nợ kỹ thuật đã xác minh".

Coverage >= 80% cho file mới. Test độc lập (reset state trong `beforeEach`/`afterEach`), assertion cụ thể theo hành vi. Không skip test bằng `test.skip` mà không giải thích lý do. Không commit code mới thiếu test.

## Debug bug — verify bằng chrome-devtools MCP

Khi xử lý bug quan sát được qua trình duyệt (lỗi UI, lỗi hành vi frontend, hoặc bug backend chỉ lộ ra khi thao tác trên web app), **bắt buộc dùng MCP `chrome-devtools`** (xem bảng MCP Servers trong `CLAUDE.md`) ở cả hai đầu:

1. **Trước khi sửa — tái hiện bug thật:** mở đúng trang bằng `navigate_page`, thực hiện lại thao tác gây lỗi, và xác nhận bug bằng ít nhất một trong `take_screenshot` / `take_snapshot` / `list_console_messages` / `list_network_requests`. Đừng suy đoán nguyên nhân chỉ từ đọc code — quan sát trạng thái thật trước.
2. **Sau khi sửa — verify lại, không tự cho là xong:** lặp lại đúng thao tác đã gây bug ở bước 1 trên trang đã có fix, xác nhận lỗi hết (console sạch, network đúng response, UI đúng như kỳ vọng) trước khi báo hoàn thành hoặc mở PR.
3. Nhóm tool đọc (`screenshot`, `snapshot`, `console`, `network`) auto-allow; `navigate_page` / `click` / gõ phím / `evaluate_script` vẫn cần xác nhận từng lần — cứ gọi bình thường, đợi user duyệt.
4. Bug không thể quan sát qua trình duyệt (thuần backend, không có mặt UI/network quan sát được — ví dụ logic nội bộ của một BullMQ processor) thì verify bằng test (TDD ở trên) thay vì chrome-devtools.

Việc verify này là bắt buộc, không phải tuỳ chọn — không báo "đã fix" nếu chưa tái hiện lại thao tác gây bug bằng chrome-devtools sau khi sửa.
