export type MessageHistory = {
  type: "message";
  role: "user" | "assistant" | "data";
  content: string;
};

export type DataHistory = {
  type: "data";
  role: "user" | "assistant" | "data";
  content: string;
};

export type ActionHistory = {
  type: "action";
  action: Action | Action;
};

export type History = (MessageHistory | DataHistory | ActionHistory)[];

export type Action =
  | "prompt"
  | "discuss"
  | "clear"
  | "help"
  | "addFiles"
  | "memory";
