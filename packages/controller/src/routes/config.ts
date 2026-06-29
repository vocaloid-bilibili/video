// packages/controller/src/routes/config.ts

import { Router } from "express";

import {
  getEditorConfig,
  getIssueResolvedConfig,
  saveEditorConfig,
} from "../services/config.service.js";
import { asyncRoute, requireString } from "../utils/http.js";

const router: Router = Router();

router.get(
  "/issue-config/:date",
  asyncRoute(async (req, res) => {
    const date = requireString(req.params.date, "缺少日期");
    const config = await getIssueResolvedConfig(date);

    res.send(config);
  }),
);

router.get(
  "/editor-config/:date",
  asyncRoute(async (req, res) => {
    const date = requireString(req.params.date, "缺少日期");
    const config = await getEditorConfig(date);

    res.send(config);
  }),
);

router.post(
  "/editor-config/:date",
  asyncRoute(async (req, res) => {
    const date = requireString(req.params.date, "缺少日期");

    await saveEditorConfig(date, req.body);
    res.send({ success: true });
  }),
);

export default router;
