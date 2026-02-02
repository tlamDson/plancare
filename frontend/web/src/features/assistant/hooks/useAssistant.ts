/**
 * AI Assistant Hooks
 *
 * Section 4.1: All AI outputs sanitized via sanitizeAIText
 * Section 2.2: Streaming support for AI responses
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { sanitizeAIText } from "@/utils/sanitize";
import {
  createChatSession,
  getChatSession,
  sendMessage,
  streamMessage,
  deleteChatSession,
  type ChatSession,
} from "../api/assistant.api";

// ============================================
// CHAT SESSION HOOK
// ============================================

export function useChatSession(sessionId?: string) {
  const query = useQuery({
    queryKey: queryKeys.ai.session(sessionId || ""),
    queryFn: () => getChatSession(sessionId!),
    enabled: !!sessionId,
  });

  // Section 4.1: Sanitize all messages before returning
  const sanitizedMessages = query.data?.messages.map((msg) => ({
    ...msg,
    content:
      msg.role === "assistant" ? sanitizeAIText(msg.content) : msg.content,
  }));

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          messages: sanitizedMessages || [],
        }
      : undefined,
  };
}

// ============================================
// CREATE SESSION HOOK
// ============================================

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripId?: string) => createChatSession(tripId),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.ai.session(session.id), session);
    },
  });
}

// ============================================
// SEND MESSAGE HOOK (Non-streaming)
// ============================================

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendMessage(sessionId, content),
    onSuccess: (response) => {
      // Update the session with the new message
      queryClient.setQueryData<ChatSession>(
        queryKeys.ai.session(sessionId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                ...response,
                // Section 4.1: Sanitize AI response
                content: sanitizeAIText(response.content),
              },
            ],
          };
        },
      );
    },
  });
}

// ============================================
// STREAMING CHAT HOOK
// Section 2.2: Streaming AI responses
// ============================================

interface UseStreamingChatOptions {
  sessionId: string;
  onError?: (error: Error) => void;
}

export function useStreamingChat({
  sessionId,
  onError,
}: UseStreamingChatOptions) {
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);
  const queryClient = useQueryClient();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
      }
    };
  }, []);

  const sendStreamingMessage = useCallback(
    (content: string) => {
      // Cancel any existing stream
      if (abortRef.current) {
        abortRef.current();
      }

      // Add user message immediately
      queryClient.setQueryData<ChatSession>(
        queryKeys.ai.session(sessionId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                id: `temp-${Date.now()}`,
                role: "user" as const,
                content,
                createdAt: new Date(),
              },
            ],
          };
        },
      );

      setIsStreaming(true);
      setStreamingContent("");

      abortRef.current = streamMessage(
        sessionId,
        content,
        // On chunk
        (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        },
        // On done
        (fullResponse) => {
          setIsStreaming(false);
          setStreamingContent("");
          abortRef.current = null;

          // Add final assistant message with sanitization
          queryClient.setQueryData<ChatSession>(
            queryKeys.ai.session(sessionId),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                messages: [
                  ...old.messages,
                  {
                    id: `assistant-${Date.now()}`,
                    role: "assistant" as const,
                    // Section 4.1: Sanitize final response
                    content: sanitizeAIText(fullResponse),
                    createdAt: new Date(),
                  },
                ],
              };
            },
          );
        },
        // On error
        (error) => {
          setIsStreaming(false);
          setStreamingContent("");
          abortRef.current = null;
          onError?.(error);
        },
      );
    },
    [sessionId, queryClient, onError],
  );

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, []);

  return {
    sendStreamingMessage,
    cancelStream,
    streamingContent: sanitizeAIText(streamingContent), // Sanitize streaming content too
    isStreaming,
  };
}

// ============================================
// DELETE SESSION HOOK
// ============================================

export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChatSession,
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.ai.session(sessionId),
      });
    },
  });
}
