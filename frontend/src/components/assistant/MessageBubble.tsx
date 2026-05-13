import { Sparkles, UserRound } from "lucide-react";
import type { ChatMessage } from "../../types/assistant";

const cardTone = {
  blue: "border-blue-100 bg-blue-50/70 text-blue-800",
  teal: "border-teal-100 bg-teal-50/70 text-teal-800",
  amber: "border-amber-100 bg-amber-50/80 text-amber-800",
  slate: "border-slate-200 bg-white/64 text-slate-700",
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <Sparkles size={15} />
        </span>
      ) : null}

      <div
        className={`max-w-[min(78%,680px)] rounded-[22px] border p-4 shadow-[0_12px_30px_rgba(15,23,42,0.045)] ${
          isUser
            ? "border-blue-100 bg-blue-50/86 text-blue-950"
            : "border-slate-300/20 bg-white/76 text-slate-700"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
        {message.cards ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {message.cards.map((card) => (
              <div
                key={`${card.label}-${card.value}`}
                className={`rounded-2xl border px-3 py-2 ${
                  cardTone[card.tone ?? "slate"]
                }`}
              >
                <p className="text-[11px] opacity-75">{card.label}</p>
                <p className="mt-1 text-xs font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {isUser ? (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
          <UserRound size={15} />
        </span>
      ) : null}
    </div>
  );
}
