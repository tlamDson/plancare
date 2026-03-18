/**
 * SortableActivityRow
 *
 * Wraps an activity card with @dnd-kit/sortable.
 *
 * DnD fix: drag handle is an INLINE flex item to the LEFT of the card,
 * never absolutely-positioned, never clipped by the card's overflow-hidden.
 *
 * Regen: always-visible "Regenerate" button, rendered as an absolute overlay
 * relative to SortableActivityRow's own `relative` container (which has NO
 * overflow-hidden), so it is never clipped by the inner card.
 * Clicking opens a Popover with an optional requirements textarea.
 */

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Activity } from "@/utils/schemas";

interface SortableActivityRowProps {
  activity: Activity;
  isDragDisabled: boolean;
  isRegenning: boolean;
  onRegen: (activityId: string, hint?: string) => void;
  children: React.ReactNode;
}

export function SortableActivityRow({
  activity,
  isDragDisabled,
  isRegenning,
  onRegen,
  children,
}: SortableActivityRowProps) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: activity._id!,
    disabled: isDragDisabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleSubmit = () => {
    if (!activity._id) return;
    onRegen(activity._id, hint.trim() || undefined);
    setHint("");
    setOpen(false);
  };

  return (
    /* ── Outer: position:relative so the regen button can be absolutely placed
         but NO overflow:hidden here — card's overflow-hidden won't clip it.  ── */
    <div ref={setNodeRef} style={style} className="relative">
      {/* ── Row: drag listeners on the entire card area ─────────────────── */}
      <div 
        className={[
          "flex items-start gap-1",
          isDragDisabled ? "" : "cursor-grab active:cursor-grabbing touch-none"
        ].join(" ")}
        {...attributes}
        {...listeners}
      >
        {/* Card area — flex-1, children is ActivityRow */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      {/* ── Regen button — absolute overlay at top-right of this row.
           Positioned relative to THIS div (no overflow-hidden),
           so it floats ON TOP of the card corner without being clipped.   ── */}
      <div className="absolute top-2 right-0 z-30">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isRegenning || isDragDisabled}
              className={[
                "h-7 gap-1.5 text-xs font-medium pr-2.5 pl-2",
                "bg-background/90 backdrop-blur-sm shadow-sm",
                "border-primary/20 text-primary/80",
                "hover:bg-primary/5 hover:border-primary/40 hover:text-primary",
                "transition-all duration-200",
              ].join(" ")}
              aria-label={`Regenerate ${activity.name}`}
            >
              {isRegenning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {isRegenning ? "Generating…" : "Regenerate"}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="bottom"
            align="end"
            sideOffset={6}
            className="w-80 p-0 shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold leading-none">Regenerate Activity</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  Replacing: {activity.name}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Requirements{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="E.g. something outdoor near the lake, family-friendly, no shopping malls…"
                  className="min-h-[80px] text-sm resize-none leading-relaxed"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
                  }}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Ctrl+Enter to submit
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setOpen(false); setHint(""); }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isRegenning}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  Find new activity
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
