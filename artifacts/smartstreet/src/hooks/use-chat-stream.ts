import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiMessagesQueryKey, getGetOpenaiConversationQueryKey } from "@workspace/api-client-react";

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
      // Optimistically add user message
      const prevMessages = queryClient.getQueryData<any>(getGetOpenaiConversationQueryKey(conversationId));
      if (prevMessages) {
        queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), {
          ...prevMessages,
          messages: [
            ...prevMessages.messages,
            { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() },
            { id: Date.now() + 1, role: "assistant", content: "", createdAt: new Date().toISOString(), isStreaming: true }
          ]
        });
      }

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
                
                // Update the streaming message in cache
                queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
                  if (!old) return old;
                  const msgs = [...old.messages];
                  const last = msgs[msgs.length - 1];
                  if (last && last.isStreaming) {
                    last.content = fullText;
                  }
                  return { ...old, messages: msgs };
                });
              }
              if (data.done) {
                break;
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
      
      // Refresh proper messages list when done
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream aborted");
      } else {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, queryClient]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    sendMessage,
    isStreaming,
    streamedContent,
    error,
    stopStream
  };
}
