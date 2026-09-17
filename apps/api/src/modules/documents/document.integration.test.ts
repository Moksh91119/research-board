import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../server.js";

describe("Document API", () => {
  async function createAuthenticatedAgent() {
    const agent = request.agent(app);

    const email = `document-${Date.now()}-${Math.random()}@example.com`;
    const password = "StrongPassword123!";

    await agent.post("/auth/register").send({ email, password });

    const loginResponse = await agent
      .post("/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return agent;
  }

  async function createWorkspace(agent: ReturnType<typeof request.agent>) {
    const response = await agent.post("/workspaces").send({
      name: "Document Test Workspace",
      description: "Integration test",
    });

    expect(response.status).toBe(201);

    return response.body.workspace.id as string;
  }

  it("rejects unauthenticated document listing", async () => {
    const response = await request(app).get(
      "/workspaces/invalid-workspace/documents",
    );

    expect(response.status).toBe(401);
  });

  it("creates and lists documents", async () => {
    const agent = await createAuthenticatedAgent();
    const workspaceId = await createWorkspace(agent);

    const createResponse = await agent
      .post(`/workspaces/${workspaceId}/documents`)
      .send({
        title: "Research Notes",
        content: "<p>Initial research content</p>",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.document.title).toBe("Research Notes");

    const documentId = createResponse.body.document.id;

    const listResponse = await agent.get(
      `/workspaces/${workspaceId}/documents`,
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: documentId,
          title: "Research Notes",
        }),
      ]),
    );
  });

  it("rejects an empty document title", async () => {
    const agent = await createAuthenticatedAgent();

    const workspaceResponse = await agent
      .post("/workspaces")
      .send({ name: "Validation Workspace" });

    const workspaceId = workspaceResponse.body.workspace.id;

    const response = await agent
      .post(`/workspaces/${workspaceId}/documents`)
      .send({
        title: "",
        content: "<p>Content</p>",
      });

    expect(response.status).toBe(400);
  });
});
