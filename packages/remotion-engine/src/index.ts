// src/index.ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// 注册Remotion根组件（用于Remotion Studio开发）
registerRoot(RemotionRoot);

// 导出渲染器接口
export * from './renderer.js';

// 导出组件（可选）
export { RemotionRoot } from "./Root";
