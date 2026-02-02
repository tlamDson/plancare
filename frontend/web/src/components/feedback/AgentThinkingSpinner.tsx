/**
 * Agent Thinking Spinner
 *
 * Section 2.1: Complex state specific to the Agent workflow
 * This belongs in components/feedback (shared) because it's used across features
 */

import { cn } from "@/lib/utils";
import { Bot, Loader2 } from "lucide-react";

interface AgentThinkingSpinnerProps {
  message?: string;
  step?: string;
  className?: string;
}

export function AgentThinkingSpinner({
  message = "AI is thinking...",
  step,
  className,
}: AgentThinkingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6",
        className,
      )}
    >
      <div className="relative">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <Loader2 className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-spin" />
      </div>

      <div className="text-center">
        <p className="font-medium text-foreground">{message}</p>
        {step && (
          <p className="text-sm text-muted-foreground mt-1 animate-pulse">
            {step}
          </p>
        )}
      </div>
    </div>
  );
}
