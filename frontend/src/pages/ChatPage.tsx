import { Bot, Plus, RefreshCw, Send, Sparkles, User, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHero, PageIntro } from "../components/ui/PageHero";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import { Markdown } from "../components/ui/Markdown";
import { Spinner } from "../components/ui/States";
import { api } from "../services/api";
import type { ChatMessage, ChatStatus } from "../services/types";
import { cn } from "../lib/format";

const SUGGESTIONS = [
  "Explain uncertainty estimation in multilingual LLMs.",
  "Why does confidence calibration degrade in Indic languages?",
  "How does Model 2 Language-Shift Platt scaling work?",
  "What is the difference between verbalized and statistical confidence?",
];

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortCtrl = useRef<AbortController | null>(null);

  // Check Ollama and Gemma 3 4B model status
  const checkStatus = useCallback(() => {
    setLoadingStatus(true);
    api
      .chatStatus()
      .then((s) => {
        setStatus(s);
        setError(null);
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  useEffect(() => {
    checkStatus();
    return () => {
      abortCtrl.current?.abort();
    };
  }, [checkStatus]);

  // Auto-scroll to latest response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || streaming) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    // Prepare assistant placeholder message for streaming
    const assistantMsgIndex = updatedMessages.length;
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setStreaming(true);

    abortCtrl.current?.abort();
    const ctrl = new AbortController();
    abortCtrl.current = ctrl;

    let accumulated = "";
    try {
      await api.streamChat(
        updatedMessages,
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantMsgIndex]) {
              next[assistantMsgIndex] = { role: "assistant", content: accumulated };
            }
            return next;
          });
        },
        ctrl.signal,
        "gemma3:4b",
      );
    } catch (err: any) {
      if (!ctrl.signal.aborted) {
        const errorMsg = err?.message || "Failed to get response from Gemma 3 4B.";
        setError(errorMsg);
        // If nothing was accumulated, remove the empty assistant bubble
        if (!accumulated) {
          setMessages((prev) => prev.slice(0, -1));
        }
      }
    } finally {
      if (!ctrl.signal.aborted) {
        setStreaming(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    abortCtrl.current?.abort();
    setStreaming(false);
    setMessages([]);
    setError(null);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 sm:px-6">
      <PageHero word="Chat" eyebrow="Direct conversation with Gemma 3 4B">
        <GlassCard className="flex h-[75vh] min-h-[580px] max-h-[820px] flex-col p-0 overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full border border-white/[0.12] bg-white/[0.05] text-white">
                <Bot className="size-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-fg">Gemma 3 4B</span>
                  {status?.is_available ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-up/30 bg-up/10 px-2 py-0.5 text-[11px] font-medium text-up">
                      <span className="size-1.5 rounded-full bg-up animate-pulse" />
                      Live Ollama
                    </span>
                  ) : loadingStatus ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] text-fg-3">
                      <Spinner className="size-2.5" />
                      Checking...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-down/30 bg-down/10 px-2 py-0.5 text-[11px] font-medium text-down">
                      <span className="size-1.5 rounded-full bg-down" />
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-fg-3">Local endpoint: http://localhost:11434 · Model: gemma3:4b</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={checkStatus}
                title="Refresh Ollama status"
                disabled={loadingStatus}
                className="grid size-8 place-items-center rounded-full border border-white/[0.1] bg-white/[0.03] text-fg-3 transition hover:bg-white/[0.08] hover:text-fg disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", loadingStatus && "animate-spin")} />
              </button>
              <Button
                variant="ghost"
                className="h-8 gap-1.5 rounded-full px-3 text-xs"
                onClick={handleNewChat}
                icon={<Plus className="size-3.5" />}
              >
                New Chat
              </Button>
            </div>
          </div>

          {/* Connection Error Banner */}
          {status && !status.connected && (
            <div className="flex items-center gap-2 border-b border-down/20 bg-down/[0.08] px-5 py-2.5 text-xs text-down">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>Ollama is not running. Please start Ollama (`ollama serve` or app) to chat with Gemma 3 4B.</span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="grid size-12 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.03] shadow-lg mb-4">
                  <Sparkles className="size-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-fg">Direct Chat with Gemma 3 4B</h3>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-3">
                  This conversation runs entirely on your local machine using the Gemma 3 4B Instruct model via Ollama. No data is sent to external servers.
                </p>

                <div className="mt-6 grid w-full max-w-lg gap-2 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs text-fg-2 transition duration-200 hover:border-white/25 hover:bg-white/[0.06] hover:text-fg"
                    >
                      <span>{s}</span>
                      <Send className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-white/[0.05] text-fg-2">
                      <Bot className="size-3.5" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "max-w-[85%] sm:max-w-[75%] rounded-tr-sm bg-white/[0.08] border border-white/[0.12] text-fg shadow-sm"
                        : "max-w-[90%] sm:max-w-[82%] rounded-tl-sm bg-white/[0.03] border border-white/[0.07] text-fg"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div>
                        {m.content ? (
                          <Markdown>{m.content}</Markdown>
                        ) : (
                          <div className="flex items-center gap-1.5 py-1 text-xs text-fg-3">
                            <span className="size-1.5 rounded-full bg-fg-3 animate-ping" />
                            <span>Thinking...</span>
                          </div>
                        )}
                        {streaming && i === messages.length - 1 && m.content && (
                          <span className="inline-block size-2 rounded-full bg-white animate-pulse ml-1 align-baseline" />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-white/[0.1] text-white">
                      <User className="size-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error notice if message failed */}
          {error && (
            <div className="border-t border-down/20 bg-down/[0.08] px-5 py-2 text-xs text-down flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="underline ml-2">Dismiss</button>
            </div>
          )}

          {/* Input Box */}
          <div className="border-t border-white/[0.08] p-3.5 sm:p-4 bg-black/30 backdrop-blur-md">
            <div className="flex items-end gap-2.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  status?.is_available
                    ? "Ask Gemma 3 4B anything in any language... (Press Enter to send)"
                    : "Connecting to local Ollama..."
                }
                rows={1}
                disabled={streaming || (status !== null && !status.connected)}
                className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-3/60 focus:border-white/40 focus:outline-none transition-colors disabled:opacity-50"
              />
              <Button
                variant="primary"
                className="h-11 w-11 rounded-xl p-0 shrink-0"
                onClick={() => handleSend()}
                disabled={!input.trim() || streaming || (status !== null && !status.connected)}
                icon={streaming ? <Spinner className="size-4 text-black" /> : <Send className="size-4 text-black" />}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-fg-3 px-1">
              <span>Shift + Enter for new line · Enter to send</span>
              <span>Running locally with zero data leakage</span>
            </div>
          </div>
        </GlassCard>
      </PageHero>

      <PageIntro
        title="Direct Conversational AI with Local Gemma 3 4B"
        subtitle="Experience pure local inference with contextual conversation memory, progressive streaming, and zero external network calls."
      />
    </div>
  );
}
