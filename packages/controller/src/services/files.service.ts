// packages/controller/src/services/files.service.ts

import fs from "fs-extra";
import path from "path";

import { DIR_DATA } from "../config.js";
import {
  getBoardTypeName,
  getPaths,
  isIssueDataFile,
} from "../utils/helpers.js";
import { detectBoardType } from "shared-config";

export interface IssueFileInfo {
  date: string;
  dataFile: string;
  hasConfig: boolean;
  hasVideo: boolean;
  boardType: string;
  boardTypeName: string;
}

export async function listIssueFiles(): Promise<IssueFileInfo[]> {
  const files = await fs.readdir(DIR_DATA);
  const dataFiles = files.filter(isIssueDataFile);

  const result = await Promise.all(
    dataFiles.map(async (dataFile) => {
      const date = dataFile.replace(/\.json$/, "");
      const { final } = getPaths(date);
      const boardType = detectBoardType(date);

      return {
        date,
        dataFile,
        hasConfig: await fs.pathExists(
          path.join(DIR_DATA, `${date}_config.json`),
        ),
        hasVideo: await fs.pathExists(final),
        boardType,
        boardTypeName: getBoardTypeName(boardType),
      };
    }),
  );

  return result.sort((a, b) => b.date.localeCompare(a.date));
}
