// packages/controller/src/services/config.service.ts

import fs from "fs-extra";
import path from "path";

import { DIR_DATA } from "../config.js";
import { log } from "../state.js";
import { getIssueConfig } from "shared-config";

function getEditorConfigPath(date: string): string {
  return path.join(DIR_DATA, `${date}_config.json`);
}

export async function getIssueResolvedConfig(date: string) {
  const configFile = getEditorConfigPath(date);
  const editorConfig = (await fs.pathExists(configFile))
    ? await fs.readJson(configFile)
    : {};

  return getIssueConfig(date, editorConfig);
}

export async function getEditorConfig(date: string) {
  const configFile = getEditorConfigPath(date);

  if (!(await fs.pathExists(configFile))) {
    return { error: "not_found" };
  }

  return await fs.readJson(configFile);
}

export async function saveEditorConfig(date: string, config: unknown) {
  const configFile = getEditorConfigPath(date);

  await fs.writeJson(configFile, config, { spaces: 2 });
  log(`保存编辑器配置: ${date}`);
}
