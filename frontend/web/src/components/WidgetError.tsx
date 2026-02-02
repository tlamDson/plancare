/**
 * Widget Error Component
 *
 * Section 3.1: Graceful degradation for widget failures
 * Shows a placeholder when a widget fails to load
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function WidgetError({
  title = "Widget Unavailable",
  message = "This content couldn't be loaded",
  onRetry,
  className,
}: WidgetErrorProps) {
  return (
    <Card className={cn("border-dashed bg-muted/50", className)}>
      <CardContent className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
