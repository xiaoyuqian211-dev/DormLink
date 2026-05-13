import { Bot, Lightbulb, Moon, Wind } from "lucide-react";
import type { RefObject } from "react";
import type { ChatMessage } from "../../types/assistant";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: ChatMessage[];
  thinking: boolean;
  onPrompt: (question: string) => void;
  bottomRef: RefObject<HTMLDivElement>;
};

const emptyPrompts = [
  { icon: Wind, question: "为什么建议我开窗？" },
  { icon: Moon, question: "现在适合睡觉吗？" },
  { icon: Lightbulb, question: "最近一小时环境有什么变化？" },
];

export function MessageList({ messages, thinking, onPrompt, bottomRef }: MessageListProps) {
  const isEmpty = messages.length === 0 && !thinking;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_8%,rgba(79,124,255,0.07),transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.74),rgba(255,255,255,0.42))] px-4 py-4 sm:px-5">
      {isEmpty ? (
        <div className="mx-auto mt-4 max-w-xl rounded-[28px] border border-slate-300/20 bg-white/68 p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Bot size={22} />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-slate-950">
            想了解当前宿舍环境吗？
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            我可以基于温度、湿度、CO₂、噪声和事件记录解释系统建议。
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {emptyPrompts.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => onPrompt(item.question)}
                  className="rounded-[18px] border border-slate-300/20 bg-white/72 p-3 text-left text-xs font-medium leading-5 text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
                >
                  <Icon size={16} className="mb-2 text-blue-500" />
                  {item.question}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {thinking ? (
            <div className="flex gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Bot size={15} />
              </span>
              <div className="rounded-[22px] border border-slate-300/20 bg-white/76 px-4 py-3 text-sm text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.045)]">
                <span className="inline-flex items-center gap-1.5">
                  正在基于当前上下文分析
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-200 [animation-delay:240ms]" />
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
