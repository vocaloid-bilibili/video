// packages/controller/src/routes/files.ts

import { Router } from "express";

import { listIssueFiles } from "../services/files.service.js";
import { asyncRoute } from "../utils/http.js";

const router: Router = Router();

router.get(
  "/",
  asyncRoute(async (_req, res) => {
    const files = await listIssueFiles();
    res.send({ files });
  }),
);

export default router;
