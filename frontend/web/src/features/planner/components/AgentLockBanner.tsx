/**
 * Agent Lock Banner Component
 *
 * Shows when AI is processing a trip
 * Prevents user edits during agent processing
 */

import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AgentLockBannerProps {
  isLocked: boolean;
  currentStep?: string | null;
}

export function AgentLockBanner({
  isLocked,
  currentStep,
}: AgentLockBannerProps) {
  if (!isLocked) return null;

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <AlertTitle className="text-primary">
        AI is working on your trip
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {currentStep ||
          "Please wait while the AI processes your request. Editing is temporarily disabled."}
      </AlertDescription>
    </Alert>
  );
}
