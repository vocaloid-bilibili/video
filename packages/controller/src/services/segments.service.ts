// packages/controller/src/services/segments.service.ts

import fs from "fs-extra";

import { getPaths } from "../utils/helpers.js";

export async function listSegments(date: string): Promise<string[]> {
  const { segments } = getPaths(date);

  if (!(await fs.pathExists(segments))) {
    return [];
  }

  const files = await fs.readdir(segments);

  return files
    .filter((file) => file.endsWith(".mp4") && !file.endsWith("_raw.mp4"))
    .sort();
}
