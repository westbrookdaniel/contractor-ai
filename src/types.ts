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
  action: Action | ManualAction;
};

export type History = (MessageHistory | DataHistory | ActionHistory)[];

export type Action = "prompt" | "edit" | "respond";
// We never want an AI to be able to initiate these actions
export type ManualAction = "clear" | "help" | "addFiles";
