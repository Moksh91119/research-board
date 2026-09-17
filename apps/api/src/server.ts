import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma.js";
import { ZodError } from "zod";
import authRoutes from "./modules/auth/auth.routes.js";
import workspaceRoutes from "./modules/workspaces/workspace.routes.js";
import documentRoutes from "./modules/documents/document.routes.js";
import researchSourceRoutes from "./modules/research-sources/research-source.routes.js";
import documentSourceRoutes from "./modules/document-sources/document-source.routes.js";
import canvasRoutes from "./modules/canvas/canvas.routes.js";
import researchNoteRoutes from "./routes/research-note.routes.js";

const app = express();

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

app.use(helmet());

app.use(
  cors({
    origin: WEB_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "research-board-api",
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/auth", authRoutes);
app.use("/workspaces", workspaceRoutes);
app.use(documentRoutes);
app.use(researchSourceRoutes);
app.use(documentSourceRoutes);
app.use("/sources", researchSourceRoutes);
app.use(canvasRoutes);
app.use(researchNoteRoutes);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.flatten(),
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  },
);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

export { app };
