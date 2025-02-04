import type { History } from "../../types";
import { requestInput } from "../io";

export async function prompt(history: History) {
  const response = await requestInput("Prompt");

  history.push({
    type: "message",
    role: "user",
    content: response,
  });
}
