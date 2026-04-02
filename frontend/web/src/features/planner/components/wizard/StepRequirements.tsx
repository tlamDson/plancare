import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTripWizardStore } from "@/stores/trip-wizard.store";

const EXAMPLES = [
  "Tôi ăn chay, không ăn hải sản",
  "Bạn đồng hành dùng xe lăn",
  "Dị ứng với gluten",
  "Có em bé 2 tuổi đi cùng",
];

export function StepRequirements() {
  const { data, setData } = useTripWizardStore();
  const [exampleIx] = useState(
    () => Math.floor(Date.now() / 10_000) % EXAMPLES.length,
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-semibold">
          ✏️ Yêu cầu đặc biệt (tuỳ chọn)
        </Label>
        <p className="text-sm text-muted-foreground">
          Bạn có yêu cầu gì đặc biệt về sức khoẻ, chế độ ăn, hoặc điều kiện di
          chuyển không? AI sẽ ưu tiên thoả mãn yêu cầu này trong từng gợi ý.
        </p>
      </div>

      <Textarea
        id="special-requirements"
        placeholder={`Ví dụ: "${EXAMPLES[exampleIx]}"`}
        value={data.specialRequirements}
        onChange={(e) =>
          setData({ specialRequirements: e.target.value.slice(0, 200) })
        }
        rows={3}
        className="resize-none"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Bỏ trống nếu không có yêu cầu gì đặc biệt</span>
        <span>{data.specialRequirements.length}/200</span>
      </div>

      {/* Quick-fill examples */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Gợi ý nhanh:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setData({ specialRequirements: ex })}
              className="rounded-full border px-3 py-1 text-xs hover:bg-muted/60 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
