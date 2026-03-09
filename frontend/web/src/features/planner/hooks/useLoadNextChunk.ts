/**
 * useLoadNextChunk
 *
 * Fetches the next 3-day chunk from the backend when the user scrolls near
 * the end of the last rendered chunk. Because the backend pre-generates chunks
 * eagerly, the data is almost always ready immediately (latency ≈ 0).
 *
 * Usage:
 *   const { loadedChunks, loadNextChunk, allChunksLoaded } = useLoadNextChunk(tripId, totalChunks);
 */

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { toast } from "sonner";

export interface UseLoadNextChunkResult {
  /** Index of the next chunk to load (0-based) */
  nextChunkIndex: number;
  /** Whether all chunks have been loaded */
  allChunksLoaded: boolean;
  /** Whether a chunk fetch is in progress */
  isLoadingChunk: boolean;
  /** Trigger loading of the next chunk */
  loadNextChunk: () => Promise<void>;
}

export function useLoadNextChunk(
  tripId: string | undefined,
  totalChunks: number,
  initialLoadedChunks = 1,
): UseLoadNextChunkResult {
  const queryClient = useQueryClient();
  const [nextChunkIndex, setNextChunkIndex] = useState(initialLoadedChunks);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);

  const allChunksLoaded = nextChunkIndex >= totalChunks;

  const loadNextChunk = useCallback(async () => {
    if (!tripId || allChunksLoaded || isLoadingChunk) return;

    setIsLoadingChunk(true);
    try {
      const response = await apiClient.get(
        `/trips/${tripId}/chunks/${nextChunkIndex}`,
      );

      if (response.data.ready) {
        // Merge new days into the cached trip data
        queryClient.setQueryData(
          queryKeys.trips.detail(tripId),
          (old: any) => {
            if (!old?.trip) return old;
            const existingDays: any[] = old.trip.itinerary ?? [];
            const newDays: any[] = response.data.days ?? [];
            // Avoid duplicating days that are already present
            const existingDayNums = new Set(existingDays.map((d: any) => d.day));
            const uniqueNewDays = newDays.filter(
              (d: any) => !existingDayNums.has(d.day),
            );
            return {
              ...old,
              trip: {
                ...old.trip,
                itinerary: [...existingDays, ...uniqueNewDays],
                chunksReady: response.data.chunksReady,
              },
            };
          },
        );
        setNextChunkIndex((prev) => prev + 1);
      } else {
        // Chunk not ready yet — backend is still generating
        toast.info("Đang tải thêm ngày... vui lòng thử lại sau vài giây.");
      }
    } catch {
      toast.error("Không thể tải thêm ngày. Vui lòng thử lại.");
    } finally {
      setIsLoadingChunk(false);
    }
  }, [tripId, nextChunkIndex, allChunksLoaded, isLoadingChunk, queryClient]);

  return { nextChunkIndex, allChunksLoaded, isLoadingChunk, loadNextChunk };
}
