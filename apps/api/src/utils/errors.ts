// apps/api/src/utils/errors.ts

export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNPROCESSABLE_ENTITY"  
  | "INTERNAL";

/** Default HTTP status for each code (used when not provided) */
const DEFAULT_STATUS: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UNPROCESSABLE_ENTITY: 422, // ✅ added
  INTERNAL: 500,
};

/** Default message for each code (used when not provided) */
const DEFAULT_MESSAGE: Record<AppErrorCode, string> = {
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  CONFLICT: "Conflict",
  RATE_LIMITED: "Too Many Requests",
  UNPROCESSABLE_ENTITY: "Unprocessable entity", // ✅ added
  INTERNAL: "Something went wrong",
};

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  /**
   * New style:
   *   new AppError(code, message?, status?, details?)
   *
   * Back-compat (legacy) style used in your existing controllers:
   *   new AppError(code, status, message, details?)
   */
  constructor(
    code: AppErrorCode,
    messageOrStatus?: string | number,
    statusOrMessage?: number | string,
    details?: unknown
  ) {
    // detect legacy signature
    let status: number;
    let message: string | undefined;

    if (typeof messageOrStatus === "number") {
      // legacy: (code, status, message, details?)
      status = messageOrStatus;
      message = typeof statusOrMessage === "string" ? statusOrMessage : undefined;
    } else {
      // new: (code, message?, status?, details?)
      message = messageOrStatus;
      status = typeof statusOrMessage === "number" ? statusOrMessage : DEFAULT_STATUS[code];
    }

    super(message ?? DEFAULT_MESSAGE[code]);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  // ---------- Helper factories (new preferred API) ----------

  static badRequest(message = DEFAULT_MESSAGE.BAD_REQUEST, details?: unknown) {
    return new AppError("BAD_REQUEST", message, DEFAULT_STATUS.BAD_REQUEST, details);
  }

  static unauthorized(message = DEFAULT_MESSAGE.UNAUTHORIZED, details?: unknown) {
    return new AppError("UNAUTHORIZED", message, DEFAULT_STATUS.UNAUTHORIZED, details);
  }

  static forbidden(message = DEFAULT_MESSAGE.FORBIDDEN, details?: unknown) {
    return new AppError("FORBIDDEN", message, DEFAULT_STATUS.FORBIDDEN, details);
  }

  static notFound(message = DEFAULT_MESSAGE.NOT_FOUND, details?: unknown) {
    return new AppError("NOT_FOUND", message, DEFAULT_STATUS.NOT_FOUND, details);
  }

  static conflict(message = DEFAULT_MESSAGE.CONFLICT, details?: unknown) {
    return new AppError("CONFLICT", message, DEFAULT_STATUS.CONFLICT, details);
  }

  static rateLimited(message = DEFAULT_MESSAGE.RATE_LIMITED, details?: unknown) {
    return new AppError("RATE_LIMITED", message, DEFAULT_STATUS.RATE_LIMITED, details);
  }

  static unprocessable(message = DEFAULT_MESSAGE.UNPROCESSABLE_ENTITY, details?: unknown) {
    return new AppError("UNPROCESSABLE_ENTITY", message, DEFAULT_STATUS.UNPROCESSABLE_ENTITY, details);
  }

  static internal(message = DEFAULT_MESSAGE.INTERNAL, details?: unknown) {
    return new AppError("INTERNAL", message, DEFAULT_STATUS.INTERNAL, details);
  }

  /** Convert any thrown value to AppError without losing info */
  static fromUnknown(e: unknown) {
    if (isAppError(e)) return e;
    if (e && typeof e === "object" && "message" in e) {
      return AppError.internal(String((e as any).message), e);
    }
    return AppError.internal(DEFAULT_MESSAGE.INTERNAL, e);
  }
}

/** Type guard for centralized error handler to narrow typing */
export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

/**
 * Backward-compat shim: supports older code that used `Errors.*` factories.
 * (Your existing auth/owner code can keep using this without changes.)
 */
export const Errors = {
  BadRequest: (msg = DEFAULT_MESSAGE.BAD_REQUEST, details?: unknown) =>
    AppError.badRequest(msg, details),
  Unauthorized: (msg = DEFAULT_MESSAGE.UNAUTHORIZED, details?: unknown) =>
    AppError.unauthorized(msg, details),
  Forbidden: (msg = DEFAULT_MESSAGE.FORBIDDEN, details?: unknown) =>
    AppError.forbidden(msg, details),
  NotFound: (msg = DEFAULT_MESSAGE.NOT_FOUND, details?: unknown) =>
    AppError.notFound(msg, details),
  Conflict: (msg = DEFAULT_MESSAGE.CONFLICT, details?: unknown) =>
    AppError.conflict(msg, details),
  RateLimited: (msg = DEFAULT_MESSAGE.RATE_LIMITED, details?: unknown) =>
    AppError.rateLimited(msg, details),
  Unprocessable: (msg = DEFAULT_MESSAGE.UNPROCESSABLE_ENTITY, details?: unknown) =>
    AppError.unprocessable(msg, details),
  Internal: (msg = DEFAULT_MESSAGE.INTERNAL, details?: unknown) =>
    AppError.internal(msg, details),
};

// Default export for legacy `import Errors from "...";`
export default Errors;
