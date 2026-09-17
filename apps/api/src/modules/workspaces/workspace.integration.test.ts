import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../server.js";

describe("Workspace API", () => {
  it("rejects unauthenticated workspace listing", async () => {
    const response = await request(app).get("/workspaces");

    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated workspace creation", async () => {
    const response = await request(app).post("/workspaces").send({
      name: "Test Workspace",
      description: "Test description",
    });

    expect(response.status).toBe(401);
  });

  it("creates and lists a workspace for an authenticated user", async () => {
    const agent = request.agent(app);

    const email = `workspace-${Date.now()}@example.com`;
    const password = "StrongPassword123!";

    const registerResponse = await agent
      .post("/auth/register")
      .send({ email, password });

    expect(registerResponse.status).toBe(201);

    const loginResponse = await agent
      .post("/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    const createResponse = await agent.post("/workspaces").send({
      name: "Research Workspace",
      description: "Workspace integration test",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.workspace.name).toBe("Research Workspace");

    const listResponse = await agent.get("/workspaces");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.workspaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Research Workspace",
        }),
      ]),
    );
  });
});
