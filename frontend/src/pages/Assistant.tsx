import { AssistantHero } from "../components/assistant/AssistantHero";
import { ChatPanel } from "../components/assistant/ChatPanel";
import { ContextPanel } from "../components/assistant/ContextPanel";

export default function Assistant() {
  return (
    <div className="space-y-4">
      <AssistantHero />
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
        <ChatPanel />
        <ContextPanel />
      </section>
    </div>
  );
}
