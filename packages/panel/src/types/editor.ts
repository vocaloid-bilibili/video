export interface Song {
  bvid: string
  title?: string
  name?: string
  producer?: string
  uploader?: string
  vocalist?: string
  rank?: number | string
  count?: number
  thumbnail?: string
  _clip?: { startTime: number; endTime: number; duration: number }
  _videoExists?: boolean
  _videoUrl?: string
}

export interface EditorConfig {
  cover: { bvid: string; thumbnail: string } | null
  ed: { bvid: string; name: string; producer: string }
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
