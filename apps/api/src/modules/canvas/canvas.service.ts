import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { SaveCanvasInput } from "./canvas.schemas.js";

async function requireWorkspaceEditor(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
    },
  });

  if (!membership) {
    throw new Error("Workspace not found");
  }

  if (membership.role === "VIEWER") {
    throw new Error("Insufficient permissions");
  }

  return membership;
}

export async function getCanvas(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
    },
  });

  if (!membership) {
    throw new Error("Workspace not found");
  }

  const [nodes, edges] = await Promise.all([
    prisma.canvasNode.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.canvasEdge.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: {
        x: node.positionX,
        y: node.positionY,
      },
      width: node.width ?? undefined,
      height: node.height ?? undefined,
      data: node.data ?? {},
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      label: edge.label ?? undefined,
    })),
  };
}

export async function saveCanvas(
  userId: string,
  workspaceId: string,
  input: SaveCanvasInput,
) {
  await requireWorkspaceEditor(userId, workspaceId);

  const nodeIds = new Set(input.nodes.map((node) => node.id));

  for (const edge of input.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error("Edges must reference existing nodes");
    }
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.canvasEdge.deleteMany({
      where: { workspaceId },
    });

    await transaction.canvasNode.deleteMany({
      where: { workspaceId },
    });

    if (input.nodes.length > 0) {
      await transaction.canvasNode.createMany({
        data: input.nodes.map((node) => ({
          id: node.id,
          workspaceId,
          type: node.type,
          title: String(node.data.title ?? "Untitled"),
          positionX: node.position.x,
          positionY: node.position.y,
          width: node.width,
          height: node.height,
          data: node.data as Prisma.InputJsonValue,
        })),
      });
    }

    if (input.edges.length > 0) {
      await transaction.canvasEdge.createMany({
        data: input.edges.map((edge) => ({
          id: edge.id,
          workspaceId,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          label: edge.label,
        })),
      });
    }

    return {
      nodes: input.nodes.length,
      edges: input.edges.length,
    };
  });
}
