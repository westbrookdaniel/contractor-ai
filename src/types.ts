export type MessageHistory = {
  type: "message";
  role: "system" | "user" | "assistant" | "data";
  content: string;
};

export type ActionHistory = {
  type: "action";
  action: Action;
};

export type History = (MessageHistory | ActionHistory)[];

export type Action = "prompt" | "edit" | "respond" | "addFiles";
