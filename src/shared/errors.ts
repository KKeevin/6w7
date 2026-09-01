import {
  translate,
  isMessageKey,
  DEFAULT_LOCALE,
  type Locale,
  type MessageKey,
} from "@/shared/i18n";
import { ASK_LIMITS } from "./tools";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "LINK_CLOSED"
  | "BAD_REQUEST"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly vars?: Record<string, string | number>;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    vars?: Record<string, string | number>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.vars = vars;
  }
}

export function errorBody(error: AppError | Error, locale: Locale = DEFAULT_LOCALE) {
  if (error instanceof AppError) {
    const message = isMessageKey(error.message)
      ? translate(locale, error.message, error.vars)
      : error.message;
    return {
      error: {
        code: error.code,
        message,
      },
    };
  }
  return {
    error: {
      code: "INTERNAL" as const,
      message: translate(locale, "api.internal"),
    },
  };
}

export function zodAppError(
  error: { issues: { message: string }[] },
  fallback: MessageKey = "api.invalidInput",
) {
  const message = error.issues[0]?.message;
  const vars =
    message === "api.bodyMax" ? { max: ASK_LIMITS.bodyMax } : undefined;
  return new AppError(
    "VALIDATION_ERROR",
    message && isMessageKey(message) ? message : fallback,
    400,
    vars,
  );
}
