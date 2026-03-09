/**
 * Agent Lock Banner Component
 *
 * Shows when AI is processing a trip
 * Prevents user edits during agent processing
 */

import { Loader2, XCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { JobStatusIndicator } from "./JobStatusIndicator";
import type { JobStatus } from "@/utils/schemas";
import { useEffect, useState } from "react";

// Progressive loading messages — cycle through as seconds pass
const LOADING_MESSAGES = [
  { after: 0,  text: "Đang phân tích yêu cầu..." },
  { after: 4,  text: "Đang tìm các địa điểm phù hợp..." },
  { after: 10, text: "Đang lên lịch trình theo sở thích..." },
  { after: 18, text: "Đang tối ưu hoá hành trình theo khu vực..." },
  { after: 28, text: "Sắp hoàn tất, chờ thêm chút nữa nhé..." },
];

function useProgressiveMessage(isActive: boolean, overrideStep?: string | null): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (overrideStep) return overrideStep;

  const active = [...LOADING_MESSAGES]
    .reverse()
    .find((m) => elapsed >= m.after);
  return active?.text ?? LOADING_MESSAGES[0]!.text;
}

interface AgentLockBannerProps {
  isLocked: boolean;
  currentStep?: string | null;
  status?: JobStatus;
  progress?: number;
  error?: string | null;
  jobId?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  /** Show a yellow "fallback template" banner for free users when AI is unavailable */
  isFallback?: boolean;
  fallbackCity?: string;
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
  isFallback = false,
  fallbackCity,
}: AgentLockBannerProps) {
  const showError = Boolean(error);
  const isProcessing = isLocked && !showError;
  const progressiveStep = useProgressiveMessage(isProcessing, currentStep);

  // Fallback template banner (free user, AI unavailable)
  if (isFallback) {
    return (
      <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-700 dark:text-yellow-400">
          Chế độ dự phòng
        </AlertTitle>
        <AlertDescription className="text-yellow-700/80 dark:text-yellow-400/80">
          AI đang bảo trì. Đây là lịch trình tiêu chuẩn
          {fallbackCity ? ` cho ${fallbackCity}` : ""}. Một số tính năng bị giới hạn.
        </AlertDescription>
      </Alert>
    );
  }

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
          : progressiveStep}
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
