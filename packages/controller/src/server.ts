// packages/controller/src/server.ts

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import {
  DIR_AVATAR,
  DIR_DOWNLOADS,
  DIR_FULL_VIDEO,
  DIR_STAFF,
  DIR_VIDEO_ROOT,
  ensureStorageDirs,
  PORT,
} from "./config.js";
import apiRoutes from "./routes/api.js";
import { errorHandler } from "./utils/http.js";

process.on("uncaughtException", (error) => {
  console.error("❌ 未捕获异常:", error.message);
  console.error(error.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ 未处理的 Promise 拒绝:", reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ensureStorageDirs();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/downloads", express.static(DIR_DOWNLOADS));
app.use("/downloads/full_videos", express.static(DIR_FULL_VIDEO));
app.use("/video", express.static(DIR_VIDEO_ROOT));
app.use("/config/avatar", express.static(DIR_AVATAR));
app.use("/config/staff", express.static(DIR_STAFF));

app.use("/api", apiRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
