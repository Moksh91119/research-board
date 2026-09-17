import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../server.js";

async function createAgent() {
  const agent = request.agent(app);
  const email = `source-${Date.now()}-${Math.random()}@example.com`;
  const password = "StrongPassword123!";

  await agent.post("/auth/register").send({ email, password });
  const login = await agent.post("/auth/login").send({ email, password });

  expect(login.status).toBe(200);
  return agent;
}

async function createWorkspace(agent: ReturnType<typeof request.agent>) {
  const response = await agent.post("/workspaces").send({
    name: "Sources Workspace",
  });

  expect(response.status).toBe(201);
  return response.body.workspace.id as string;
}

describe("Research Sources API", () => {
  it("rejects unauthenticated source listing", async () => {
    const response = await request(app).get(
      "/workspaces/invalid-workspace/sources",
    );

    expect(response.status).toBe(401);
  });

  it("creates and lists a research source", async () => {
    const agent = await createAgent();
    const workspaceId = await createWorkspace(agent);

    const createResponse = await agent
      .post(`/workspaces/${workspaceId}/sources`)
      .send({
        title: "Example Research",
        url: "https://example.com",
        description: "Research description",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.source.title).toBe("Example Research");

    const listResponse = await agent.get(`/workspaces/${workspaceId}/sources`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Example Research",
          url: "https://example.com",
        }),
      ]),
    );
  });

  it("rejects invalid source URLs", async () => {
    const agent = await createAgent();
    const workspaceId = await createWorkspace(agent);

    const response = await agent
      .post(`/workspaces/${workspaceId}/sources`)
      .send({
        title: "Invalid Source",
        url: "not-a-url",
      });

    expect(response.status).toBe(400);
  });

  it("rejects missing source title", async () => {
    const agent = await createAgent();
    const workspaceId = await createWorkspace(agent);

    const response = await agent
      .post(`/workspaces/${workspaceId}/sources`)
      .send({
        url: "https://example.com",
      });

    expect(response.status).toBe(400);
  });
});
