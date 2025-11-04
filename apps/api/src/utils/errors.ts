// apps/api/src/utils/errors.ts
export class AppError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  BadRequest: (msg = "Bad request") => new AppError("BAD_REQUEST", 400, msg),
  Unauthorized: (msg = "Unauthorized") => new AppError("UNAUTHORIZED", 401, msg),
  Forbidden: (msg = "Forbidden") => new AppError("FORBIDDEN", 403, msg),
  NotFound: (msg = "Not found") => new AppError("NOT_FOUND", 404, msg),
  Conflict: (msg = "Conflict") => new AppError("CONFLICT", 409, msg),
};
