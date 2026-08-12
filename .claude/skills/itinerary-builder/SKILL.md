---
name: itinerary-builder
description: Dùng khi sửa pipeline sinh lịch trình của TravelPlan — backend/src/features/planner/jobs/itinerary-builder.ts, trip.processor.ts, ai-agent.service.ts, validation.service.ts, intent-parser.service.ts, clustering theo địa lý, hoặc bất kỳ logic nào liên quan tới việc AI sinh place rồi validate/cluster thành lịch trình theo ngày.
---

# Itinerary Builder Protocol

Pipeline sinh lịch trình của TravelPlan trải qua 3 lớp: **AI sinh search intent (text query, không phải toạ độ) → Mapbox/Google Places validate thành place thật có toạ độ → clustering theo địa lý + slot thời gian thành lịch trình**. Đây là kiến trúc "intent-based" — AI không bao giờ tự bịa toạ độ, chỉ sinh câu truy vấn tìm kiếm.

Tài liệu gốc, chi tiết đầy đủ: `docs/implementation/ai-trip-generation.md` (1234 dòng) và `docs/implementation/caching-optimization.md`. Mục tiêu vận hành: $0.02–0.04/trip, <20s generation, 60–80% cache hit nhờ `PlaceCache`.

## Thứ tự bắt buộc — không được đổi, không được bỏ bước

```
flattenIntents()  →  validateBatch()  →  [deficit check + fill]  →  buildTaggedPlaces()  →  clusterByProximity()  →  buildItinerary()
```

File thật tương ứng (đã đối chiếu code, không phải chỉ tài liệu):

| Bước | File |
|---|---|
| Sinh intent theo slot (`SLOT_ORDER`) | `backend/src/features/planner/services/intent-parser.service.ts` |
| Validate batch qua Mapbox/Google Places | `backend/src/features/planner/services/validation.service.ts` |
| Gắn tag `{place, slotType, slotOrder}` | `buildTaggedPlaces()` trong `backend/src/features/planner/jobs/itinerary-builder.ts` |
| Clustering theo địa lý | `clusterByProximity()` trong cùng file |
| Điều phối toàn bộ job | `backend/src/features/planner/jobs/trip.processor.ts` |

## Quy tắc cứng

- **Cấm global round-robin index** để gán place vào ngày (`globalIdx = (globalIdx + 1) % validated.length`) — sẽ sinh place trùng lặp giữa các ngày. Phải dùng cấu trúc theo ngày: `clusters[dayNum][dayIdx++]`.
- **`buildTaggedPlaces()` tái tạo tương ứng (slot, ValidatedPlace) bằng cách lặp qua intent theo đúng thứ tự `flattenIntents`** — `validated[idx]` phải khớp đúng `(day, slot)` ban đầu. Đừng đổi thứ tự lặp mà không cập nhật đồng bộ cả hai phía.
- **Deficit guard**: nếu `validated.length < intentList.length` (một số intent không tìm ra place thật), gọi `aiAgentService.generateSupplementaryQueries(deficit, destination, existingNames)` để bù, rồi validate lại và nối vào — không được âm thầm bỏ qua slot thiếu.
- **Clustering chạy trên tuple `{place, slotType, slotOrder}`**, không phải `ValidatedPlace[]` trần — sau khi cluster theo proximity, mỗi cluster phải được sort lại theo `slotOrder` (morning=0, ..., theo `SLOT_ORDER` của `intent-parser.service.ts`) để giữ đúng ngữ nghĩa thời gian dù đã bị nhóm lại theo địa lý.
- **`geoValidatorService.validateDistance()` (`backend/src/features/planner/services/geo-validator.service.ts`) chỉ để chẩn đoán/hiển thị** — `requiresTransport`/`distanceFromPrevious` là metadata cho UI, **không bao giờ** dùng kết quả của nó để trigger re-clustering hay re-group.
- Toạ độ `[0, 0]` là fallback passthrough (place không xác định được vị trí thật) — code đã tách riêng `withCoords`/`withoutCoords` trong `clusterByProximity`, đừng gộp chung khi tính khoảng cách.

## AI là untrusted service

AI (Gemini) không được gọi external API trực tiếp — chỉ sinh text intent, mọi place phải đi qua `validateBatch()` để đối chiếu Mapbox/Google Places thật trước khi được coi là hợp lệ. Circuit breaker (`opossum`, `backend/src/features/planner/tools/circuit-breaker.ts`) bọc quanh các lời gọi Mapbox/Google Places geocoding/text-search. Retry AI tối đa 3 lần rồi fail gracefully thay vì crash job.

## Khi viết test cho module này

Domain cần test kỹ nhất (xem thêm `.claude/agents/qa-testing.md`): không có global index gây trùng place; deficit guard thực sự gọi supplementary queries khi thiếu; `buildTaggedPlaces` map đúng slot ngay cả khi một số slot bị bỏ trống (query rỗng); cluster sort đúng theo `slotOrder` sau khi nhóm địa lý. Dùng golden fixture ở `backend/src/test/fixtures/` (`valid-trip.json`, `malformed-trip.json`, `empty-results.json`) thay vì gọi Gemini/Mapbox thật.
