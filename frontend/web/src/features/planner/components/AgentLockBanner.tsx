/**
 * Agent Lock Banner Component
 *
 * Shows when AI is processing a trip
 * Prevents user edits during agent processing
 */

import { Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { JobStatusIndicator } from "./JobStatusIndicator";
import type { JobStatus } from "@/utils/schemas";

interface AgentLockBannerProps {
  isLocked: boolean;
  currentStep?: string | null;
  status?: JobStatus;
  progress?: number;
  error?: string | null;
  jobId?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function AgentLockBanner({
  isLocked,
  currentStep,
  status,
  progress,
  error,
  jobId,
  onRetry,
  isRetrying = false,
}: AgentLockBannerProps) {
  const showError = Boolean(error);
  if (!isLocked && !showError) return null;

  const resolvedStatus: JobStatus = status || (showError ? "FAILED" : "PROCESSING");
  const canRetry = Boolean(onRetry) && (showError || resolvedStatus === "FAILED");

  return (
    <Alert
      className={
        showError
          ? "border-destructive/50 bg-destructive/5"
          : "border-primary/50 bg-primary/5"
      }
    >
      {showError ? (
        <XCircle className="h-4 w-4 text-destructive" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
      <AlertTitle className={showError ? "text-destructive" : "text-primary"}>
        {showError ? "AI failed to generate your trip" : "AI is working on your trip"}
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {showError
          ? error
          : currentStep ||
            "Please wait while the AI processes your request. Editing is temporarily disabled."}
      </AlertDescription>

      <div className="mt-3 space-y-2">
        <JobStatusIndicator
          status={resolvedStatus}
          progress={progress}
          currentStep={currentStep}
          showProgress
        />
        {jobId && (
          <div className="text-xs text-muted-foreground">Job ID: {jobId}</div>
        )}
        {canRetry && (
          <div>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
}
