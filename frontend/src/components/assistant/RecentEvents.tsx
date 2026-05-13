import { Clock3, MessageSquareText } from "lucide-react";
import { timelineEvents } from "../../data/mockDormData";

export function RecentEvents() {
  return (
    <div className="rounded-[22px] border border-slate-300/18 bg-white/58 p-4">
      <div className="flex items-center gap-2 text-slate-800">
        <MessageSquareText size={17} className="text-teal-500" />
        <p className="text-sm font-semibold">最近事件</p>
      </div>
      <div className="mt-4 space-y-3">
        {timelineEvents.slice(0, 2).map((event) => (
          <div key={event.id} className="flex gap-3 text-sm">
            <Clock3 size={15} className="mt-1 shrink-0 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800">
                {event.time} · {event.title}
              </p>
              <p className="mt-1 leading-6 text-slate-500">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
