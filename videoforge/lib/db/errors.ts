/**
 * Stable error codes raised by the SQL functions (RAISE EXCEPTION 'VF_...').
 * The message is all PostgREST gives us, so we extract the code from it.
 */
export const DB_ERROR_CODES = [
  "VF_INSUFFICIENT_CREDITS",
  "VF_CONCURRENCY_LIMIT",
  "VF_ACCOUNT_SUSPENDED",
  "VF_NOT_MEMBER",
  "VF_USER_NOT_FOUND",
  "VF_ORGANIZATION_NOT_FOUND",
  "VF_ORGANIZATION_LIMIT",
  "VF_INVALID_AMOUNT",
  "VF_INVALID_STATE",
  "VF_INVALID_NAME",
  "VF_JOB_NOT_FOUND",
  "VF_VIDEO_NOT_FOUND",
  "VF_VIDEO_IN_PROGRESS",
  "VF_FORBIDDEN",
  "VF_ALREADY_MEMBER",
  "VF_LAST_ADMIN",
  "VF_PERSONAL_ORGANIZATION",
  "VF_REASON_REQUIRED",
  "VF_CANNOT_CHANGE_SELF",
  "VF_LEDGER_IMMUTABLE",
] as const;

export type DbErrorCode = (typeof DB_ERROR_CODES)[number];

export function parseDbErrorCode(error: { message?: string } | null | undefined): DbErrorCode | null {
  const message = error?.message ?? "";
  return DB_ERROR_CODES.find((code) => message.includes(code)) ?? null;
}

export class DbError extends Error {
  readonly code: DbErrorCode | "VF_UNKNOWN";
  constructor(code: DbErrorCode | "VF_UNKNOWN", message?: string) {
    super(message ?? code);
    this.name = "DbError";
    this.code = code;
  }
}

/** Throws DbError for a PostgREST error object; returns silently when there is none. */
export function throwIfDbError(error: { message?: string } | null | undefined, context: string): void {
  if (!error) return;
  const code = parseDbErrorCode(error);
  throw new DbError(code ?? "VF_UNKNOWN", code ? code : `${context}: ${error.message ?? "unknown error"}`);
}
