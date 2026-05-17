export interface Song {
  bvid: string
  title?: string
  name?: string
  author?: string
  uploader?: string
  vocal?: string
  rank?: number | string
  count?: number
  image_url?: string
  _clip?: { startTime: number; endTime: number; duration: number }
  _videoExists?: boolean
  _videoUrl?: string
}

export interface EditorConfig {
  cover: { bvid: string; image_url: string } | null
  ed: { bvid: string; name: string; author: string }
  script: { opening: string; ending: string }
}

export interface SongsData {
  [key: string]: Song[]
}

export interface FileInfo {
  date: string
  boardType: string
  boardTypeName: string
  hasConfig: boolean
  hasVideo: boolean
}

export type ActiveTab = "songs" | "config"
