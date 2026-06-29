// packages/controller/src/routes/status.ts

import { Router } from "express";

import { getTask } from "../state.js";

const router: Router = Router();

router.get("/", (_req, res) => {
  res.send(getTask());
});

export default router;
