import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-slate-300/20 bg-white/58 p-6 text-center text-slate-500">
      <Inbox className="mx-auto text-slate-300" size={30} />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm leading-6">{description}</p>
    </div>
  );
}
