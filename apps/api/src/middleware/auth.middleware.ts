import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../modules/auth/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.access_token;

  if (!token) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication required",
    });
    return;
  }

  try {
    const user = await verifyAccessToken(token);

    req.userId = user.id;

    next();
  } catch {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid or expired authentication token",
    });
  }
}
