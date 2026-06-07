import { ShieldCheck } from "lucide-react";

export function ReasoningCard({ basis }: { basis: string[] }) {
  return (
    <div className="rounded-[22px] border border-indigo-100/80 bg-[linear-gradient(135deg,rgba(238,242,255,0.78),rgba(255,255,255,0.62))] p-4">
      <div className="flex items-center gap-2 text-indigo-700">
        <ShieldCheck size={17} />
        <p className="text-sm font-semibold">判断依据</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        透明展示 AI 建议使用的 telemetry 上下文。
      </p>
      <div className="mt-3 grid gap-2">
        {basis.map((item) => (
          <p key={item} className="rounded-2xl bg-white/58 px-3 py-2 text-xs leading-5 text-slate-600">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
