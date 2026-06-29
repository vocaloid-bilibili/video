// packages/controller/src/routes/songs.ts

import { Router } from "express";

import { getIssueSongs } from "../services/songs.service.js";
import { asyncRoute } from "../utils/http.js";

const router: Router = Router();

router.get(
  "/:date",
  asyncRoute(async (req, res) => {
    const result = await getIssueSongs(req.params.date);
    res.send(result);
  }),
);

export default router;
