// packages/controller/src/routes/api.ts

import { Router } from "express";

import uploadRouter from "./upload.js";
import filesRouter from "./files.js";
import segmentsRouter from "./segments.js";
import statusRouter from "./status.js";
import songsRouter from "./songs.js";
import synthesisRouter from "./synthesis.js";
import configRouter from "./config.js";
import clipsRouter from "./clips.js";
import fullVideoRouter from "./fullVideo.js";

const router: Router = Router();

router.use("/upload", uploadRouter);
router.use("/files", filesRouter);
router.use("/segments", segmentsRouter);
router.use("/status", statusRouter);
router.use("/songs", songsRouter);
router.use("/synthesis", synthesisRouter);
router.use("/clips", clipsRouter);
router.use("", configRouter);
router.use("", fullVideoRouter);

export default router;
