const BASE_URL = "http://localhost:3002/api"

export interface FileInfo {
  date: string
  boardType: string
  boardTypeName: string
  hasConfig: boolean
  hasVideo: boolean
}

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

export const api = {
  async uploadFiles(files: File[]): Promise<{ files: string[] }> {
    const formData = new FormData()
    for (const file of files) {
      formData.append("files", file)
    }
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error("上传失败")
    return res.json()
  },

  async getFiles(): Promise<{ files: FileInfo[] }> {
    const res = await fetch(`${BASE_URL}/files`)
    if (res.status === 401) {
      location.reload()
      throw new Error("Unauthorized")
    }
    return res.json()
  },

  async getSegments(date: string): Promise<{ segments: string[] }> {
    const res = await fetch(`${BASE_URL}/segments?date=${date}`)
    return res.json()
  },

  async getStatus(): Promise<StatusInfo> {
    const res = await fetch(`${BASE_URL}/status`)
    if (res.status === 401) {
      throw new Error("Unauthorized")
    }
    return res.json()
  },

  async triggerMerge(date: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/synthesis/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
  },

  async repairSegment(payload: {
    date?: string
    segmentName?: string
    type?: string
    rank?: number
  }): Promise<void> {
    const res = await fetch(`${BASE_URL}/synthesis/segment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
  },

  navigateToEditor(date: string): void {
    location.href = `/editor.html?date=${date}`
  },
}
