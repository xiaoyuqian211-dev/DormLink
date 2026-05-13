import { TriangleAlert } from "lucide-react";

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-red-100/80 bg-red-50/70 p-5 text-red-700">
      <div className="flex items-start gap-3">
        <TriangleAlert size={20} />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-red-700/78">{description}</p>
        </div>
      </div>
    </div>
  );
}
