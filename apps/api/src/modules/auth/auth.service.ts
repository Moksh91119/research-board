import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

const secret = new TextEncoder().encode(jwtSecret);

const JWT_ISSUER = "research-board-api";
const JWT_AUDIENCE = "research-board-web";

const ACCESS_TOKEN_TTL = "1d";

export type SafeUser = {
  id: string;
  email: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
};

function toSafeUser(user: { id: string; email: string }): SafeUser {
  return {
    id: user.id,
    email: user.email,
  };
}

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return toSafeUser(user);
}

export async function loginUser(
  input: LoginInput,
): Promise<{ user: SafeUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const validPassword = await argon2.verify(user.passwordHash, input.password);

  if (!validPassword) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = await new SignJWT({
    sub: user.id,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secret);

  return {
    user: toSafeUser(user),
    token,
  };
}

export async function verifyAccessToken(
  token: string,
): Promise<AuthenticatedUser> {
  const { payload } = await jwtVerify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ["HS256"],
  });

  if (typeof payload.sub !== "string") {
    throw new Error("INVALID_TOKEN");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

export async function getUserById(userId: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return user ? toSafeUser(user) : null;
}
