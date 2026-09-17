import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../server.js";

const email = `test-${Date.now()}@example.com`;
const password = "StrongPassword123!";

describe("Authentication API", () => {
  it("rejects registration with an invalid email", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "invalid-email",
      password,
    });

    expect(response.status).toBe(400);
  });

  it("registers a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      email,
      password,
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("logs in the registered user", async () => {
    const response = await request(app).post("/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("rejects invalid login credentials", async () => {
    const response = await request(app).post("/auth/login").send({
      email,
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated requests to /auth/me", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
  });
});
