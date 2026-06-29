// packages/controller/src/routes/segments.ts

import { Router } from "express";

import { listSegments } from "../services/segments.service.js";
import { asyncRoute, requireString } from "../utils/http.js";

const router: Router = Router();

router.get(
  "/",
  asyncRoute(async (req, res) => {
    const date = requireString(req.query.date, "缺少日期参数");
    const segments = await listSegments(date);

    res.send({ segments });
  }),
);

export default router;
