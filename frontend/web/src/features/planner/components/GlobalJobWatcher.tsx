import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveJobStore } from "@/stores/useActiveJobStore";
import { useJobPoller } from "@/features/planner/hooks";
import { queryKeys } from "@/lib/query-client";

export function GlobalJobWatcher() {
  const { activeJobId, tripId, clearActiveJob } = useActiveJobStore();
  const queryClient = useQueryClient();

  useJobPoller({
    jobId: activeJobId,
    onComplete: () => {
      toast.success("Chuyến đi của bạn đã sẵn sàng!");
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      if (tripId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(tripId),
        });
      }
      clearActiveJob();
    },
    onError: (err) => {
      toast.error(err || "Tạo lịch trình thất bại");
      clearActiveJob();
    },
  });

  return null;
}
