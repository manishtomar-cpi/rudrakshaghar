import type { Request, Response, NextFunction } from "express";

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const id = (req as any).id ?? "-";   
  const { method, originalUrl } = req;

  console.log(`[req] id=${id} ${method} ${originalUrl}`);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    console.log(
      `[res] id=${id} ${method} ${originalUrl} status=${res.statusCode} time=${durationMs.toFixed(1)}ms`
    );
  });

  next();
}
