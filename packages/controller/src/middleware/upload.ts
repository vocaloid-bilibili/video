// packages/controller/src/middleware/upload.ts

import multer from "multer";
import path from "path";
import fs from "fs-extra";

import { DIR_DATA, DIR_VIDEO_ROOT } from "../config.js";

function decodeUploadedFilename(originalName: string): string {
  return Buffer.from(originalName, "latin1").toString("utf8");
}

export const uploadData = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, DIR_DATA);
    },
    filename: (_req, file, cb) => {
      cb(null, decodeUploadedFilename(file.originalname));
    },
  }),
});

export const uploadSegment = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const date = req.body.date;

      if (!date) {
        cb(new Error("缺少日期参数"), "");
        return;
      }

      const dir = path.join(DIR_VIDEO_ROOT, date, "segments");
      fs.ensureDirSync(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      cb(null, decodeUploadedFilename(file.originalname));
    },
  }),
});
