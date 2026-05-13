export type AssistantCard = {
  label: string;
  value: string;
  tone?: "blue" | "teal" | "amber" | "slate";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: AssistantCard[];
};
