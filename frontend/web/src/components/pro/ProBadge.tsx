import { cn } from "@/lib/utils";

interface ProBadgeProps {
  className?: string;
  children?: React.ReactNode;
}

export function ProBadge({ className, children = "PRO" }: ProBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-purple-300/70 bg-gradient-to-r from-purple-500 to-orange-500 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

