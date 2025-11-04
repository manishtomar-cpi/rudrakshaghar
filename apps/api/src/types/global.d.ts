// apps/api/src/types/global.d.ts
export {};

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
