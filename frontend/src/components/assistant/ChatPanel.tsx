import { useEffect, useMemo, useRef, useState } from "react";
import {
  aiInsight,
  assistantQuickQuestions,
  dormRoom,
} from "../../data/mockDormData";
import type { ChatMessage } from "../../types/assistant";
import { GlassCard } from "../ui/GlassCard";
import { ChatComposer } from "./ChatComposer";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { PromptChips } from "./PromptChips";

function buildAssistantReply(question: string): ChatMessage {
  const normalized = question.toLowerCase();
  const includesCo2 = question.includes("CO₂") || question.includes("CO2") || normalized.includes("co");

  if (question.includes("睡") || question.includes("休息")) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "当前温湿度和噪声都适合休息，但 CO₂ 已轻度偏高。睡前建议先开窗通风 10 分钟，再关闭窗户保持安静。",
      cards: [
        { label: "噪声", value: "42 dB，安静", tone: "teal" },
        { label: "湿度", value: "58%，舒适", tone: "teal" },
        { label: "CO₂", value: "920 ppm，需关注", tone: "amber" },
      ],
    };
  }

  if (question.includes("开窗") || question.includes("多久") || question.includes("通风")) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "建议先打开窗户约 10 分钟。如果 15 分钟后 CO₂ 仍高于 900 ppm，再进行二次提醒或延长通风。",
      cards: [
        { label: "推荐动作", value: "开窗 10 分钟", tone: "blue" },
        { label: "复查条件", value: "15 分钟后仍高于 900 ppm", tone: "amber" },
        { label: "入口选择", value: "优先窗户/阳台", tone: "teal" },
      ],
    };
  }

  if (question.includes("最近") || question.includes("变化") || question.includes("一小时")) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "最近一小时最明显的变化是 CO₂ 从 760 ppm 上升至 920 ppm，噪声从 48 dB 回落到 42 dB。系统判断环境整体仍可用，但通风效率需要关注。",
      cards: [
        { label: "CO₂ 趋势", value: "+160 ppm", tone: "amber" },
        { label: "噪声趋势", value: "-4 dB", tone: "teal" },
        { label: "数据质量", value: `${dormRoom.dataQuality}%`, tone: "blue" },
      ],
    };
  }

  if (question.includes("区域") || question.includes("处理")) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "当前最需要处理的是门口区域的空气流动弱点，但最优动作入口在窗户/阳台区域。建议通过开窗形成短时对流，而不是只在门口处理。",
      cards: [
        { label: "关注区域", value: "门口区域", tone: "amber" },
        { label: "处理入口", value: "窗户/阳台", tone: "teal" },
        { label: "原因", value: "CO₂ 上升", tone: "amber" },
      ],
    };
  }

  if (includesCo2) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "CO₂ 偏高通常来自室内人员活动和通风不足。当前门口区域空气流动较弱，窗户/阳台区域是更优通风入口。",
      cards: [
        { label: "当前值", value: "920 ppm", tone: "amber" },
        { label: "阈值", value: "900 ppm", tone: "slate" },
        { label: "置信度", value: `${Math.round(aiInsight.confidence * 100)}%`, tone: "blue" },
      ],
    };
  }

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content:
      "从当前上下文看，宿舍整体舒适度良好。唯一关注项是 CO₂ 轻度偏高，推荐短时开窗并在 15 分钟后复查。",
    cards: [
      { label: "综合判断", value: "良好，需关注通风", tone: "blue" },
      { label: "当前建议", value: "开窗 10 分钟", tone: "teal" },
      { label: "置信度", value: `${Math.round(aiInsight.confidence * 100)}%`, tone: "blue" },
    ],
  };
}

const additionalQuestions = ["哪个区域最需要处理？"];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const promptQuestions = useMemo(
    () => Array.from(new Set([...assistantQuickQuestions, ...additionalQuestions])),
    [],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 112)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function submitQuestion(question = input) {
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

    timeoutRef.current = window.setTimeout(() => {
      setMessages((previous) => [...previous, buildAssistantReply(trimmed)]);
      setThinking(false);
    }, 560);
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
      />
    </GlassCard>
  );
}
