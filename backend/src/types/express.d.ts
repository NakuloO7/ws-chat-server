import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        name: string;
      };
    }
  }
}

export {}; // ✅ THIS LINE IS REQUIRED