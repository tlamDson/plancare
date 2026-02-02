/**
 * AI Assistant API
 *
 * Section 4.1: AI Input/Output Sanitization
 * All AI responses are sanitized before display
 */

import { apiClient } from "@/lib/axios";
import { z } from "zod";
import { validateAPI } from "@/utils/validation";

// ============================================
// TYPES & SCHEMAS
// ============================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  tripId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.coerce.date(),
});

const chatSessionSchema = z.object({
  id: z.string(),
  tripId: z.string().optional(),
  messages: z.array(chatMessageSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Create a new chat session
 */
export async function createChatSession(tripId?: string): Promise<ChatSession> {
  const response = await apiClient.post<ChatSession>("/ai/sessions", {
    tripId,
  });
  return validateAPI(chatSessionSchema, response.data);
}

/**
 * Get chat session by ID
 */
export async function getChatSession(sessionId: string): Promise<ChatSession> {
  const response = await apiClient.get<ChatSession>(
    `/ai/sessions/${sessionId}`,
  );
  return validateAPI(chatSessionSchema, response.data);
}

/**
 * Send a message to the AI assistant
 * Returns the assistant's response
 *
 * Section 4.1: User input is sanitized server-side
 * AI response is sanitized client-side before display
 */
export async function sendMessage(
  sessionId: string,
  content: string,
): Promise<ChatMessage> {
  const response = await apiClient.post<ChatMessage>(
    `/ai/sessions/${sessionId}/messages`,
    { content },
  );
  return validateAPI(chatMessageSchema, response.data);
}

/**
 * Get streaming response for AI message
 * Section 2.2: Streaming AI responses for better UX
 */
export function streamMessage(
  sessionId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: (fullResponse: string) => void,
  onError: (error: Error) => void,
): () => void {
  const controller = new AbortController();

  fetch(`${import.meta.env.VITE_API_URL}/ai/sessions/${sessionId}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ content }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onChunk(chunk);
      }

      onDone(fullText);
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        onError(error);
      }
    });

  // Return abort function for cleanup
  return () => controller.abort();
}

/**
 * Get AI suggestions for a trip
 */
export async function getTripSuggestions(
  tripId: string,
  type: "activities" | "restaurants" | "hotels",
): Promise<{ suggestions: string[] }> {
  const response = await apiClient.get<{ suggestions: string[] }>(
    `/ai/trips/${tripId}/suggestions`,
    { params: { type } },
  );
  return response.data;
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/ai/sessions/${sessionId}`);
}
