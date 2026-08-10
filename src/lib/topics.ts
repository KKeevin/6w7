import type { Prisma } from "@prisma/client";

/** AskLink.topics 以 JSON 存放；統一轉成 string[] */
export function asTopicList(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function toTopicsJson(topics: string[]): Prisma.InputJsonValue {
  return topics;
}
