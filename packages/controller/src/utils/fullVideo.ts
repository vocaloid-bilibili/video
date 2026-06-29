// packages/controller/src/utils/fullVideo.ts

import fs from "fs-extra";
import path from "path";

import { DIR_FULL_VIDEO, PORT } from "../config.js";
import { downloadFullVideoFile } from "./download.js";

fs.ensureDirSync(DIR_FULL_VIDEO);

export async function downloadFullVideo(bvid: string) {
  const result = await downloadFullVideoFile(bvid);

  if (!result) {
    return null;
  }

  return {
    path: result.path,
    url: `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`,
    duration: result.duration,
  };
}

export function getFullVideoInfo(bvid: string) {
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const publicUrl = `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`;

  if (fs.existsSync(outputPath)) {
    return {
      path: outputPath,
      url: publicUrl,
      exists: true,
    };
  }

  return {
    exists: false,
  };
}
