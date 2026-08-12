# Design — UI/UX, i18n, state boundaries

## UI/UX Pro Max Pre-flight — BẮT BUỘC

Trước khi áp dụng **BẤT KỲ** thay đổi UI nào ở `frontend/web` — layout, component, interaction, màu, spacing, hay animation — phải chạy skill `ui-ux-pro-max` trước:

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "<mô tả>" --design-system
```

Luôn bắt đầu bằng `--design-system`, rồi bổ sung `--domain ux "<pattern>"` cho interaction cụ thể, `--stack shadcn` vì TravelPlan dùng shadcn/ui.

⚠️ Có nhiều đường dẫn cũ mâu thuẫn còn sót trong repo (`docs/agents/frontend.md` ghi `.agent/skills/...`, `.github/prompts/` ghi `.shared/...`) — đường dẫn đúng duy nhất kể từ giờ là `.claude/skills/ui-ux-pro-max/`.

## Quy ước không thương lượng

- Không bao giờ để action chỉ hiện khi hover (`group-hover:opacity-100`) — luôn có affordance ở trạng thái nghỉ.
- Action phá huỷ (xoá, huỷ trip, huỷ subscription) phải có confirm dialog.
- Luôn `cursor-pointer` trên phần tử click được.
- Feedback hover/focus 150–300ms (`transition-colors duration-200`) — không tức thì, không >500ms.
- Icon là SVG (Lucide) — **không dùng emoji làm icon**.
- Contrast tối thiểu 4.5:1 ở cả light lẫn dark theme.
- Test responsive ở 375 / 768 / 1024 / 1440.
- Không magic value kiểu `w-[342px]` — dùng token/scale có sẵn của Tailwind.
- Tôn trọng `prefers-reduced-motion`.

## State boundaries

| Loại state | Dùng gì | Ghi chú |
|---|---|---|
| Server state | TanStack Query | **Không bao giờ** nhét data API vào Zustand store |
| Client/UI state | Zustand | Store nhỏ, atomic, theo từng feature |
| URL state | React Router | Nếu nó định nghĩa "tôi đang ở đâu" → thuộc về URL |
| Form state | React Hook Form | Không đẩy lên global store trước khi submit |

## Polling & optimistic UI

Polling trạng thái job dùng exponential backoff: bắt đầu 1s, gấp đôi tới tối đa 10s. Hiển thị tiến độ dạng bước (`Thinking → Fetching Maps → Verifying Prices`), không chỉ progress bar trần. Optimistic update phải có rollback + toast khi request thật fail.

## Bảo mật render

Cấm `dangerouslySetInnerHTML` trực tiếp. Pipeline bắt buộc cho output AI: raw text → `DOMPurify.sanitize()` → render (hoặc `react-markdown`). Mọi response từ API phải parse qua Zod schema trước khi dùng trong component.

## Mapbox

`React.lazy` cho component bản đồ. Không quá 50 raw marker cùng lúc — dùng `supercluster`. Gọi `map.remove()` trong cleanup của `useEffect` để tránh leak.

## i18n

Không viết chuỗi text thẳng trong component. Luôn lấy qua `const { t } = useTranslationStore()` (`frontend/web/src/stores/useTranslationStore.ts`). Mỗi chuỗi mới phải thêm đủ **cả 3 ngôn ngữ** đang hỗ trợ: English (US), French, Vietnamese.

## Component vs feature

Component có business logic (vd: tự kiểm tra job status) → đặt trong `features/<domain>/components/`. Component chỉ nhận props, không tự biết gì về domain → đặt trong `components/` dùng chung.

## Checklist pre-delivery cho mọi UI

- [ ] Contrast 4.5:1 cả light/dark
- [ ] Responsive ở 375/768/1024/1440, không tràn ngang
- [ ] Alt text cho ảnh, label cho form field
- [ ] Không chỉ dùng màu để phân biệt trạng thái (kèm icon/text)
- [ ] `prefers-reduced-motion` được tôn trọng
- [ ] Focus state hiện rõ khi tab bằng bàn phím
- [ ] Chuỗi text mới đã có ở cả 3 ngôn ngữ

## Skills có sẵn (`.claude/skills/`)

| Skill | Dùng khi |
|---|---|
| `ui-ux-pro-max` | Bất kỳ thay đổi UI nào — bắt buộc chạy trước |
| `ui-styling` | Cần tra cứu pattern shadcn/Tailwind cụ thể (theming, accessibility, responsive utilities) |
| `itinerary-builder` | Đụng vào pipeline sinh lịch trình (backend, nhưng ảnh hưởng UI hiển thị) |
| `rag-destinations` | Đụng vào module destinations/world list |
| `voyager-devops` | Dockerfile, GitHub Actions, railway/render/vercel config |
