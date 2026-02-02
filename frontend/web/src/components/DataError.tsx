/**
 * Data Error Component
 *
 * Section 3.1: Error display for failed data fetches
 */

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DataError({
  title = "Failed to load data",
  message = "Something went wrong while fetching the data",
  onRetry,
  className,
}: DataErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-6">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
