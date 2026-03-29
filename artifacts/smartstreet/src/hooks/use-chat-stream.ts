import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetOpenaiConversationQueryKey } from "@workspace/api-client-react";

interface UseChatStreamProps {
  conversationId: number;
}

export function useChatStream({ conversationId }: UseChatStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return;

    setIsStreaming(true);
    setStreamedContent("");
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      // Optimistically add user message + streaming assistant placeholder
      queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            { id: `opt-user-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() },
            { id: `opt-assistant-${Date.now()}`, role: "assistant", content: "", createdAt: new Date().toISOString(), isStreaming: true },
          ],
        };
      });

      const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to send message");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullText += data.content;
                setStreamedContent(fullText);

                // Immutably update the streaming assistant message
                queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
                  if (!old) return old;
                  const msgs = old.messages.map((m: any, i: number) =>
                    i === old.messages.length - 1 && m.isStreaming
                      ? { ...m, content: fullText }
                      : m
                  );
                  return { ...old, messages: msgs };
                });
              }
              if (data.done) break;
            } catch {
              // Ignore parse errors for incomplete SSE chunks
            }
          }
        }
      }

      // Refresh from server to get canonical persisted messages
      await queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
    } catch (err: any) {
      if (err.name === "AbortError") {
        // intentional stop
      } else {
        setError(err.message);
        // Remove the failed optimistic messages
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, queryClient]);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { sendMessage, isStreaming, streamedContent, error, stopStream };
}
