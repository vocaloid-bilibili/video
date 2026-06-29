// packages/controller/src/services/fullVideo.service.ts

import { downloadFullVideo } from "../utils/fullVideo.js";
import { log } from "../state.js";
import { httpError } from "../utils/http.js";

interface BatchDownloadInput {
  bvids?: unknown;
}

export function startBatchFullVideoDownload(input: BatchDownloadInput) {
  const { bvids } = input;

  if (!Array.isArray(bvids)) {
    throw httpError(400, "bvids 必须是数组");
  }

  void runBatchDownload(bvids.map(String));

  return {
    success: true,
    message: `开始下载 ${bvids.length} 个视频`,
  };
}

async function runBatchDownload(bvids: string[]) {
  for (const bvid of bvids) {
    try {
      await downloadFullVideo(bvid);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`批量下载失败 ${bvid}: ${message}`);
    }
  }
}

export async function downloadOneFullVideo(bvid: string) {
  const result = await downloadFullVideo(bvid);

  if (!result) {
    throw httpError(500, "下载失败");
  }

  return {
    success: true,
    ...result,
  };
}
