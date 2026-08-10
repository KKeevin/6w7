const BLOCKED_PATTERNS: RegExp[] = [
  /自殺指引/i,
  /\b(kill yourself|kys)\b/i,
];

export function containsBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((re) => re.test(text));
}

export function sanitizePlainText(text: string): string {
  return text.replace(/\0/g, "").trim();
}
