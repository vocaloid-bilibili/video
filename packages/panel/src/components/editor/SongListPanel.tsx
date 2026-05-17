import { useState } from "react"
import type { EditorConfig, SongsData } from "../../api"
import type { Song } from "../../types/editor"
import { ConfigPanel } from "./ConfigPanel"
import { SongListContent } from "./SongListContent"

type ActiveTab = "songs" | "config"


// SongListPanel - 歌曲列表面板（左侧）
interface SongListPanelProps {
  clipProgress: string
  issueName: string
  config: EditorConfig
  songs: SongsData
  selectedSong: Song
  onSave: () => void
  onConfigChange: (config: Partial<EditorConfig>) => void
  onSelectSong: (bvid: string) => void
}

export function SongListPanel({ clipProgress, issueName, selectedSong, config, songs, onSave, onSelectSong, onConfigChange }: SongListPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("songs")
  
  return (
    <div className="w-[360px] min-w-[360px] bg-neutral-900 border-r border-neutral-700 flex flex-col overflow-hidden">
      <div className="px-3 py-3 bg-neutral-800 border-b border-neutral-700 flex justify-between items-center shrink-0">
        <span className="text-sm text-neutral-400">{issueName}</span>
        <span className="text-sm text-neutral-400">{clipProgress}</span>
      </div>
      <div className="flex bg-neutral-800 border-b border-neutral-700 shrink-0">
        <button
          onClick={() => setActiveTab("songs")}
          className={`flex-1 py-2.5 text-xs cursor-pointer border-b-2 transition-all ${
            activeTab === "songs"
              ? "text-blue-400 border-blue-400 bg-neutral-900"
              : "text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          歌曲列表
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex-1 py-2.5 text-xs cursor-pointer border-b-2 transition-all ${
            activeTab === "config"
              ? "text-blue-400 border-blue-400 bg-neutral-900"
              : "text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          期刊配置
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "songs" ? (
          <SongListContent
            songs={songs}
            selectedBvid={selectedSong?.bvid || null}
            onSelectSong={onSelectSong}
          />
        ) : (
          <ConfigPanel
            config={config}
            songs={songs}
            onSave={onSave}
            onConfigChange={onConfigChange}
          />
        )}
      </div>
    </div>
  )
}
