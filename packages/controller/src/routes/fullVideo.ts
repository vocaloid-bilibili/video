// packages/controller/src/routes/fullVideo.ts

import { Router } from "express";

import {
  downloadOneFullVideo,
  startBatchFullVideoDownload,
} from "../services/fullVideo.service.js";
import { asyncRoute, requireString } from "../utils/http.js";

const router: Router = Router();

router.post(
  "/full-video/batch",
  asyncRoute(async (req, res) => {
    const result = startBatchFullVideoDownload(req.body);
    res.send(result);
  }),
);

router.post(
  "/full-video/:bvid",
  asyncRoute(async (req, res) => {
    const bvid = requireString(req.params.bvid, "缺少 bvid");
    const result = await downloadOneFullVideo(bvid);

    res.send(result);
  }),
);

export default router;
