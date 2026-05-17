import axios from "axios"
import { toast } from "sonner"
import type { EditorConfig, FileInfo, SongsData } from "../types/editor"

// Re-export types for convenience
export type { EditorConfig, FileInfo, SongsData }

const BASE_URL = "http://localhost:3002/api"

const http = axios.create({ baseURL: BASE_URL })

// 统一错误拦截：用 toast.error 显示错误信息
http.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error.response?.data?.error ||
      error.response?.statusText ||
      error.message ||
      "请求失败"
    toast.error(msg)
    return Promise.reject(error)
  }
)

export interface StatusInfo {
  status: "idle" | "processing" | "completed" | "error"
  targetDate?: string
  progress?: {
    current: number
    total: number
  }
  step?: string
  logs?: string[]
}

// ========== 首页相关 ==========

export const api = {
  async uploadFiles(files: File[]): Promise<{ files: string[] }> {
    const formData = new FormData()
    for (const file of files) {
      formData.append("files", file)
    }
    const res = await http.post<{ files: string[] }>("/upload", formData)
    return res.data
  },

  async getFiles(): Promise<{ files: FileInfo[] }> {
    const res = await http.get<{ files: FileInfo[] }>("/files")
    return res.data
  },

  async getSegments(date: string): Promise<{ segments: string[] }> {
    const res = await http.get<{ segments: string[] }>("/segments", {
      params: { date },
    })
    return res.data
  },

  async getStatus(): Promise<StatusInfo> {
    const res = await http.get<StatusInfo>("/status")
    return res.data
  },

  async triggerMerge(date: string): Promise<void> {
    await http.post("/synthesis/merge", { date })
  },

  async repairSegment(payload: {
    date?: string
    segmentName?: string
    type?: string
    rank?: number
  }): Promise<void> {
    await http.post("/synthesis/segment", payload)
  },

  navigateToEditor(date: string): void {
    location.href = `/editor?date=${date}`
  },

  // ========== 编辑器相关 ==========

  async getSongs(date: string): Promise<{ songs: SongsData; boardType: string }> {
    const res = await http.get<{ songs: SongsData; boardType: string }>(
      `/songs/${date}`
    )
    return res.data
  },

  async getEditorConfig(date: string): Promise<Partial<EditorConfig> | null> {
    try {
      const res = await http.get<Partial<EditorConfig>>(`/editor-config/${date}`)
      return res.data
    } catch {
      return null
    }
  },

  async saveEditorConfig(date: string, config: EditorConfig): Promise<void> {
    await http.post(`/editor-config/${date}`, config)
  },

  async getFullVideo(bvid: string): Promise<{ url: string; duration: number }> {
    const res = await http.post<{ url: string; duration: number }>(
      `/full-video/${bvid}`
    )
    return res.data
  },

  async batchDownload(bvids: string[]): Promise<void> {
    await http.post("/full-video/batch", { bvids })
  },

  async saveClip(
    bvid: string,
    data: { startTime: number; endTime: number }
  ): Promise<void> {
    await http.post(`/clips/${bvid}`, data)
  },

  async startSynthesis(date: string): Promise<void> {
    await http.post("/synthesis/start", { date })
  },
}
