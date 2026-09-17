import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { getUserById, loginUser, registerUser } from "./auth.service.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 15 * 60 * 1000,
};

function setAuthCookie(res: Response, token: string): void {
  res.cookie("access_token", token, cookieOptions);
}

function clearAuthCookie(res: Response): void {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid registration data",
      details: result.error.flatten(),
    });
    return;
  }

  try {
    const user = await registerUser(result.data);

    res.status(201).json({
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({
        error: "EMAIL_ALREADY_EXISTS",
        message: "An account with this email already exists",
      });
      return;
    }

    throw error;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid login data",
    });
    return;
  }

  try {
    const { user, token } = await loginUser(result.data);

    setAuthCookie(res, token);

    res.status(200).json({
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
      return;
    }

    throw error;
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);

  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication required",
    });
    return;
  }

  const user = await getUserById(req.userId);

  if (!user) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "User not found",
    });
    return;
  }

  res.status(200).json({
    user,
  });
}
