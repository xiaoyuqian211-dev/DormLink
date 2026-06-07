import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/client";
import type { ChatMessage } from "../../types/assistant";
import type { AssistantContext } from "../../utils/assistantTelemetry";
import { buildAssistantReply } from "../../utils/assistantTelemetry";
import { GlassCard } from "../ui/GlassCard";
import { ChatComposer } from "./ChatComposer";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { PromptChips } from "./PromptChips";

export function ChatPanel({ context }: { context: AssistantContext }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const promptQuestions = useMemo(() => context.quickQuestions, [context.quickQuestions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 112)}px`;
  }, [input]);

  async function submitQuestion(question = input) {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setThinking(true);
    textareaRef.current?.focus();

    try {
      const response = await api.askAssistant({
        room_id: context.roomId,
        question: trimmed,
        window: context.window,
      });
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        cards: [
          {
            label: "数据状态",
            value: response.data_status === "real" ? "真实数据" : "演示数据",
            tone: response.data_status === "real" ? "teal" : "amber",
          },
          {
            label: "置信度",
            value: `${Math.round(response.confidence * 100)}%`,
            tone: "blue",
          },
          {
            label: "样本数",
            value: `${response.context.recent_summary.sample_count} 条`,
            tone: "slate",
          },
        ],
      };
      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      const fallback = buildAssistantReply(trimmed, context);
      fallback.content = `${fallback.content}\n\n（后端 AI 问答请求失败，已使用页面本地 fallback：${err instanceof Error ? err.message : "unknown error"}）`;
      setMessages((previous) => [...previous, fallback]);
    } finally {
      setThinking(false);
    }
  }

  function handlePrompt(question: string) {
    submitQuestion(question);
  }

  return (
    <GlassCard
      intensity="strong"
      className="flex h-[680px] min-h-0 flex-col overflow-hidden p-0 xl:h-[calc(100vh-232px)] xl:min-h-[540px] xl:max-h-[720px]"
    >
      <ChatHeader />
      <PromptChips questions={promptQuestions} onPrompt={handlePrompt} disabled={thinking} />
      <MessageList
        messages={messages}
        thinking={thinking}
        onPrompt={handlePrompt}
        bottomRef={bottomRef}
      />
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => submitQuestion()}
        textareaRef={textareaRef}
        disabled={thinking}
        dataMode={context.dataMode}
      />
    </GlassCard>
  );
}
