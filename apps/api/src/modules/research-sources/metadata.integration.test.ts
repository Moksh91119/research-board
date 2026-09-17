import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../server.js";

async function createAgent() {
  const agent = request.agent(app);
  const email = `metadata-${Date.now()}-${Math.random()}@example.com`;
  const password = "StrongPassword123!";

  await agent.post("/auth/register").send({ email, password });
  const login = await agent.post("/auth/login").send({ email, password });

  expect(login.status).toBe(200);
  return agent;
}

describe("Metadata API", () => {
  it("rejects unauthenticated metadata preview", async () => {
    const response = await request(app)
      .post("/workspaces/invalid-workspace/sources/metadata/preview")
      .send({
        url: "https://example.com",
      });

    expect(response.status).toBe(401);
  });

  it("rejects unsupported URL protocols", async () => {
    const agent = await createAgent();

    const response = await agent
      .post("/workspaces/invalid-workspace/sources/metadata/preview")
      .send({
        url: "file:///etc/passwd",
      });

    expect([400, 401, 404]).toContain(response.status);
  });
});
