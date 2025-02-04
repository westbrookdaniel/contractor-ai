export type MessageHistory = {
  type: "message";
  role: "user" | "assistant" | "data";
  content: string;
};

export type ActionHistory = {
  type: "action";
  action: Action | ManualAction;
};

export type History = (MessageHistory | ActionHistory)[];

export type Action = "prompt" | "edit" | "respond" | "addFiles";
// We never want an AI to be able to initiate these actions
export type ManualAction = "clear" | "help" | "auto";
