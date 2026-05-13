import { Send } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  disabled?: boolean;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  textareaRef,
  disabled,
}: ChatComposerProps) {
  const canSubmit = value.trim().length > 0 && !disabled;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (canSubmit) onSubmit();
  }

  return (
    <div className="shrink-0 border-t border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.38),rgba(255,255,255,0.88)_24%)] px-4 py-3.5 sm:px-5">
      <div className="flex items-end gap-2 rounded-[22px] border border-slate-300/24 bg-white/78 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.9)] transition focus-within:border-blue-200 focus-within:shadow-[0_14px_34px_rgba(79,124,255,0.12),inset_0_1px_0_rgba(255,255,255,0.92)]">
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="询问当前宿舍环境，例如：为什么建议开窗？"
          className="max-h-28 min-h-[40px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          aria-label="发送问题"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5B6DFF,#4F7CFF_55%,#3B82F6)] text-white shadow-[0_12px_24px_rgba(79,124,255,0.20)] transition hover:brightness-[1.04] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Enter 发送，Shift + Enter 换行。当前回答使用演示数据上下文。
      </p>
    </div>
  );
}
