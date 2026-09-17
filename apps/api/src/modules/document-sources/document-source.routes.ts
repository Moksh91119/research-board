import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  linkSource,
  listDocumentSources,
  unlinkSource,
} from "./document-source.service.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/documents/:documentId/sources/:sourceId",
  async (req, res, next) => {
    try {
      const result = await linkSource(
        req.userId!,
        req.params.documentId as string,
        req.params.sourceId as string,
      );

      res.status(201).json({ link: result });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/documents/:documentId/sources", async (req, res, next) => {
  try {
    const sources = await listDocumentSources(
      req.userId!,
      req.params.documentId as string,
    );

    res.json({ sources });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/documents/:documentId/sources/:sourceId",
  async (req, res, next) => {
    try {
      await unlinkSource(
        req.userId!,
        req.params.documentId as string,
        req.params.sourceId as string,
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
