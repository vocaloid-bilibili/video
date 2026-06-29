// packages/controller/src/routes/upload.ts

import { Router } from "express";

import { uploadData } from "../middleware/upload.js";
import { log } from "../state.js";

const router: Router = Router();

router.post("/", uploadData.array("files"), (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const names = files.map((file) => file.filename);

  log(`上传数据文件: ${names.join(", ")}`);
  res.send({ status: "success", files: names });
});

export default router;
