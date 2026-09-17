import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../server.js";

async function createAgent() {
  const agent = request.agent(app);
  const email = `link-${Date.now()}-${Math.random()}@example.com`;
  const password = "StrongPassword123!";

  await agent.post("/auth/register").send({ email, password });
  const login = await agent.post("/auth/login").send({ email, password });

  expect(login.status).toBe(200);
  return agent;
}

describe("Document Source Linking API", () => {
  it("rejects unauthenticated source linking", async () => {
    const response = await request(app).post(
      "/documents/invalid-document/sources/invalid-source",
    );

    expect(response.status).toBe(401);
  });

  it("links a source to a document", async () => {
    const agent = await createAgent();

    const workspaceResponse = await agent
      .post("/workspaces")
      .send({ name: "Linking Workspace" });

    expect(workspaceResponse.status).toBe(201);

    const workspaceId = workspaceResponse.body.workspace.id;

    const documentResponse = await agent
      .post(`/workspaces/${workspaceId}/documents`)
      .send({
        title: "Linked Document",
        content: "<p>Research content</p>",
      });

    expect(documentResponse.status).toBe(201);

    const sourceResponse = await agent
      .post(`/workspaces/${workspaceId}/sources`)
      .send({
        title: "Linked Source",
        url: "https://example.com",
      });

    expect(sourceResponse.status).toBe(201);

    const documentId = documentResponse.body.document.id;
    const sourceId = sourceResponse.body.source.id;

    const linkResponse = await agent.post(
      `/documents/${documentId}/sources/${sourceId}`,
    );

    expect([200, 201]).toContain(linkResponse.status);

    const listResponse = await agent.get(`/documents/${documentId}/sources`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId,
          source: expect.objectContaining({
            id: sourceId,
          }),
        }),
      ]),
    );
  });
});
