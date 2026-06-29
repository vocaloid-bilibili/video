// packages/controller/src/routes/synthesis.ts

import { Router } from "express";

import {
  deleteSynthesisSegment,
  mergeSynthesis,
  startSynthesis,
} from "../services/synthesis.service.js";
import { asyncRoute } from "../utils/http.js";

const router: Router = Router();

router.post(
  "/start",
  asyncRoute(async (req, res) => {
    const result = startSynthesis(req.body);
    res.send(result);
  }),
);

router.post(
  "/merge",
  asyncRoute(async (req, res) => {
    const result = mergeSynthesis(req.body);
    res.send(result);
  }),
);

router.post(
  "/segment",
  asyncRoute(async (req, res) => {
    const result = await deleteSynthesisSegment(req.body);
    res.send(result);
  }),
);

export default router;
