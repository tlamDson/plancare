# Workflow — Git Flow, Commit, PR, TDD

## Quy tắc bất di bất dịch

1. **Mọi thay đổi đều phải qua PR.** Không bao giờ commit thẳng vào `develop` hay `main`. Có gì cần commit → tạo nhánh mới → commit → push → mở PR vào `develop`.
2. **`main` do chủ repo quản lý.** Claude/dev **không được** merge vào `main` dưới bất kỳ hình thức nào (kể cả khi CI xanh). PR `develop → main` chỉ chủ repo tự thực hiện khi release.
3. **Chỉ merge PR vào `develop` khi CI + toàn bộ test pass.** Bắt buộc xác nhận **cả 3 job** đã xanh: `Lint + Unit Tests`, `Typecheck + Build`, `Backend Docker Build`. CI đỏ hoặc đang chạy → không merge, đợi hoặc fix.
4. **Cập nhật `CLAUDE.md` và `.claude/rules/*` khi task làm thay đổi convention/tooling**, để lần sau còn áp dụng đúng.
5. **Sửa bug quan sát được qua trình duyệt (UI/frontend, hoặc backend bug lộ ra qua UI) phải verify bằng `chrome-devtools` MCP cả trước lẫn sau khi fix** — xem mục [Debug bug](#debug-bug--verify-bằng-chrome-devtools-mcp).
6. **Claude không tự merge PR nào**, kể cả vào `develop`, kể cả khi CI xanh — chỉ báo cáo trạng thái và để người dùng quyết định merge.

## Git Flow

`develop ← feature/* (PR + CI pass)`, `main ← develop (PR + CI pass, production-ready — chỉ chủ repo merge)`. Không bao giờ push thẳng lên `main`. Luôn tạo nhánh mới từ `develop` mới nhất:

```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<short-kebab-case-description>
```

**Branch types:** `feature/`, `fix/`, `test/`, `docs/`, `chore/`. Chữ thường, phân tách bằng `-`, mô tả cụ thể phạm vi (không dùng `feature/update`, `fix/bug`, `feature/wip`). Ghi rõ module/trang liên quan khi có thể: `feature/destination-picker-search`, `fix/trip-detail-drag-drop`.

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

| Target    | Ai merge                                                          | Điều kiện                                                                            |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `develop` | Claude/dev được phép (nhưng không tự merge, chỉ báo cáo sẵn sàng) | **Cả 3 CI job pass** + toàn bộ test local pass. CI đỏ/đang chạy → đợi, không merge.  |
| `main`    | **Chỉ chủ repo**                                                  | Claude không merge, không push, không tự mở PR release trừ khi được yêu cầu rõ ràng. |

Kiểm tra CI trước khi merge:

```bash
gh pr checks <PR-number>          # xem trạng thái từng check
gh pr merge <PR-number> --squash  # chỉ chủ repo chạy, sau khi tất cả check xanh
```

### Theo dõi CI sau khi mở PR

Mặc định: ngay sau khi mở PR, dùng `ScheduleWakeup` để tự đánh thức lại sau **120 giây** rồi check `gh pr checks <PR-number>` — không giữ turn chờ đồng bộ và không để user tự check tay. Pipeline `ci-pr.yml` hiện tại mất khoảng 2-3 phút để chạy xong cả 3 job bắt buộc; mốc 120s là ước lượng ban đầu, nếu CI chưa xong thì `ScheduleWakeup` lại một vòng nữa thay vì báo sai. Điều chỉnh lại con số này khi có dữ liệu thời gian chạy thực tế.

### Sửa `ci-pr.yml` — đừng làm mất required check

Tên ba job trong `.github/workflows/ci-pr.yml` **chính là** định danh required status check phía GitHub. Vì vậy:

- **Không đổi tên** `Lint + Unit Tests` / `Typecheck + Build` / `Backend Docker Build`. Cần tách việc thì thêm job mới tên khác.
- **Không thêm `paths:` vào `on: pull_request`** — workflow sẽ không chạy, check treo ở _Expected_ vĩnh viễn và PR **không merge được**.
- **Không đặt `if:` ở cấp job** cho ba job này. Muốn bỏ qua việc nặng thì gate ở cấp **step**, để job vẫn chạy và vẫn kết thúc Success.

Mẫu đang dùng: job `changes` (`dorny/paths-filter`) xuất `outputs.backend`; job `docker` đặt `env.SHOULD_BUILD` rồi gắn `if: env.SHOULD_BUILD == 'true'` lên từng step build, kèm một step `echo` cho nhánh còn lại. PR target `main` (release) luôn build thật, không tin vào filter.

> `gh` có thể chưa được auth trên máy khác. Khi đó dùng GitHub MCP server, hoặc gọi thẳng REST API bằng token.

## TDD (Red → Green → Refactor) — bắt buộc cho mọi feature/fix

1. **RED** — viết test fail trước, chưa viết implementation. Backend: `backend/src/features/<domain>/**/<name>.test.ts` (theo đúng vị trí 3 test hiện có trong `features/destinations/services/`). Frontend: `frontend/web/src/features/<domain>/__tests__/<Component>.test.tsx`. Xác nhận thấy đỏ thật (assertion fail hoặc import error đúng nghĩa, **không phải lỗi cấu hình**) trước khi tiếp tục.
2. **GREEN** — code tối thiểu để pass, không thêm logic chưa có test bao phủ.
3. **REFACTOR** — cải thiện code, chạy lại toàn bộ test, không được break.

```bash
# Toàn repo
npm run test

# Backend
npm run test -w backend
npm run test -w backend -- --watch

# Frontend
npm run test -w frontend/web
```

Backend mock **repository layer** bằng `vi.mock()` — không dùng Mongo thật trong unit test. Mock `bullmq` và chạy processor đồng bộ. **Không bao giờ** gọi API AI/Mapbox/Google Places thật trong unit test — dùng golden fixture ở `backend/src/test/fixtures/` (`valid-trip.json`, `malformed-trip.json`, `empty-results.json`).

Frontend mock API bằng MSW (`http`/`HttpResponse` từ `msw`), không mock module trực tiếp nếu MSW đủ dùng. Component gọi API phải render trong `AppProviders` (QueryClient + Clerk + Router) — dùng helper `frontend/web/src/test/renderWithProviders.tsx` thay cho `render()` trần.

Quy ước bổ sung rút ra khi dựng hạ tầng test:

- Test timer (polling job status, exponential backoff): `vi.useFakeTimers()` + `await vi.advanceTimersByTimeAsync(ms)`; nhớ `vi.useRealTimers()` trong `afterEach`.
- Backend integration test dùng `mongo:7.0` + `redis:7-alpine` mà CI đã dựng sẵn trong `ci-pr.yml` services — không cần mock ở tầng này.

Coverage >= 80% cho file mới. Test độc lập (reset state trong `beforeEach`/`afterEach`), assertion cụ thể theo hành vi. Không skip test bằng `test.skip` mà không giải thích lý do. Không commit code mới thiếu test.

## Debug bug — verify bằng chrome-devtools MCP

Khi xử lý bug quan sát được qua trình duyệt (lỗi UI, lỗi hành vi frontend, hoặc bug backend chỉ lộ ra khi thao tác trên web app), **bắt buộc dùng MCP `chrome-devtools`** (xem bảng MCP Servers trong `CLAUDE.md`) ở cả hai đầu:

1. **Trước khi sửa — tái hiện bug thật:** mở đúng trang bằng `navigate_page`, thực hiện lại thao tác gây lỗi, và xác nhận bug bằng ít nhất một trong `take_screenshot` / `take_snapshot` / `list_console_messages` / `list_network_requests`. Đừng suy đoán nguyên nhân chỉ từ đọc code — quan sát trạng thái thật trước.
2. **Sau khi sửa — verify lại, không tự cho là xong:** lặp lại đúng thao tác đã gây bug ở bước 1 trên trang đã có fix, xác nhận lỗi hết (console sạch, network đúng response, UI đúng như kỳ vọng) trước khi báo hoàn thành hoặc mở PR.
3. Nhóm tool đọc (`screenshot`, `snapshot`, `console`, `network`) auto-allow; `navigate_page` / `click` / gõ phím / `evaluate_script` vẫn cần xác nhận từng lần — cứ gọi bình thường, đợi user duyệt.
4. Bug không thể quan sát qua trình duyệt (thuần backend, không có mặt UI/network quan sát được — ví dụ logic nội bộ của một BullMQ processor) thì verify bằng test (TDD ở trên) thay vì chrome-devtools.

Việc verify này là bắt buộc, không phải tuỳ chọn — không báo "đã fix" nếu chưa tái hiện lại thao tác gây bug bằng chrome-devtools sau khi sửa.
