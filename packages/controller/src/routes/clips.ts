// packages/controller/src/routes/clips.ts

import { Router } from "express";

import {
  deleteSongClip,
  getAllSongClips,
  getSongClip,
  saveSongClip,
} from "../services/clips.service.js";
import { asyncRoute, requireString } from "../utils/http.js";

const router: Router = Router();

router.get(
  "/",
  asyncRoute(async (_req, res) => {
    res.send(getAllSongClips());
  }),
);

router.get(
  "/:bvid",
  asyncRoute(async (req, res) => {
    const bvid = requireString(req.params.bvid, "缺少 bvid");
    res.send(getSongClip(bvid));
  }),
);

router.post(
  "/:bvid",
  asyncRoute(async (req, res) => {
    const bvid = requireString(req.params.bvid, "缺少 bvid");
    const clip = saveSongClip(bvid, req.body);

    res.send({ success: true, clip });
  }),
);

router.delete(
  "/:bvid",
  asyncRoute(async (req, res) => {
    const bvid = requireString(req.params.bvid, "缺少 bvid");
    const deleted = deleteSongClip(bvid);

    res.send({ success: deleted });
  }),
);

export default router;
