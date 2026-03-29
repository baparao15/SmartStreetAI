import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { 
  useListOpenaiConversations, 
  useCreateOpenaiConversation, 
  useGetOpenaiConversation,
  useDeleteOpenaiConversation 
} from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Send, Plus, MessageSquare, Trash2, Bot, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { data: conversations, refetch: refetchConvos } = useListOpenaiConversations();
  const createMutation = useCreateOpenaiConversation();
  const deleteMutation = useDeleteOpenaiConversation();
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set active ID to first convo on load if none selected
  useEffect(() => {
    if (conversations?.length && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const { data: activeConvo } = useGetOpenaiConversation(activeId as number, {
    query: { enabled: !!activeId }
  });

  const { sendMessage, isStreaming } = useChatStream({ conversationId: activeId as number });

  const handleCreate = async () => {
    const res = await createMutation.mutateAsync({ data: { title: "New Market Analysis" } });
    refetchConvos();
    setActiveId(res.id);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteMutation.mutateAsync({ id });
    refetchConvos();
    if (activeId === id) setActiveId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !activeId) return;
    sendMessage(input);
    setInput("");
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo?.messages, isStreaming]);

  return (
    <Layout>
      <div className="flex h-full animate-in">
        
        {/* Chat Sidebar */}
        <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-white/5">
            <button 
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> New Analysis
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {conversations?.map(c => (
              <div 
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors",
                  activeId === c.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium truncate">{c.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          
          <div className="absolute top-0 inset-x-0 p-3 bg-warning/10 border-b border-warning/20 text-warning flex items-center justify-center gap-2 text-xs font-medium z-10">
            <AlertTriangle className="w-4 h-4" />
            AI Insights are for educational purposes. Not financial advice. Always consult a SEBI registered advisor.
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-16 scroll-smooth">
            {!activeId ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Bot className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a conversation or start a new analysis</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {activeConvo?.messages.map((msg: any, i: number) => (
                  <div key={msg.id || i} className={cn(
                    "flex gap-4",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30 shadow-[0_0_15px_rgba(0,122,255,0.2)]">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "px-5 py-3.5 rounded-2xl max-w-[85%] text-[15px] leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 rounded-tr-sm" 
                        : "glass-panel rounded-tl-sm text-white/90 whitespace-pre-wrap"
                    )}>
                      {msg.content || (msg.isStreaming && <span className="animate-pulse">Thinking...</span>)}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 text-white font-bold text-xs">
                        JS
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {activeId && (
            <div className="p-4 sm:p-6 bg-background/80 backdrop-blur-md border-t border-white/5">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about a stock, pattern, or portfolio risk..."
                    disabled={isStreaming}
                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-2xl py-4 pl-5 pr-14 text-white placeholder:text-muted-foreground outline-none transition-all shadow-inner disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
                  {["What is RSI divergence?", "Analyze HDFC Bank", "Is my portfolio too concentrated?"].map(q => (
                    <button 
                      key={q}
                      type="button"
                      onClick={() => setInput(q)}
                      className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-muted-foreground hover:text-white whitespace-nowrap transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
