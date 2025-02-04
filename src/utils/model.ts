import { anthropic } from "@ai-sdk/anthropic";

export const heavyModel = anthropic("claude-3-5-sonnet-20241022");
export const lightModel = anthropic("claude-3-5-haiku-20241022");
