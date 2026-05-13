type PromptChipsProps = {
  questions: string[];
  onPrompt: (question: string) => void;
  disabled?: boolean;
};

export function PromptChips({ questions, onPrompt, disabled }: PromptChipsProps) {
  return (
    <div className="shrink-0 border-b border-slate-200/60 bg-white/38 px-4 py-3 sm:px-5">
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onPrompt(question)}
            className="shrink-0 rounded-full border border-slate-300/24 bg-white/68 px-3 py-2 text-xs font-medium text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.035)] transition hover:border-blue-200 hover:bg-white/88 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
