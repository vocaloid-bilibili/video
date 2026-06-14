import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { EditorConfig, FileInfo, Song, SongsData } from "../types/editor"
import { getGroupLabel } from "../utils"
import { api } from "../api"
import { SongListPanel } from "../components/editor/SongListPanel"
import { EditorHeader } from "../components/editor/EditorHeader"
import { EditorContent } from "../components/editor/EditorContent"

// ========== 常量 ==========
const BOARD_NAME_MAP: Record<string, string> = {
  weekly: "周刊",
  monthly: "月刊",
  coverWeekly: "翻唱周刊",
  special: "特刊",
}

// ========== 主组件 ==========
export default function EditorPage() {
  const [dates, setDates] = useState<FileInfo[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [songs, setSongs] = useState<SongsData>({})
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [issueName, setIssueName] = useState("排行榜")
  const [config, setConfig] = useState<EditorConfig>({
    cover: null,
    ed: { bvid: "", name: "", producer: "" },
    script: { opening: "", ending: "" },
  })

  // 处理日期变更
  const handleDateChange = useCallback(async (date: string) => {
    if (!date) return

    try {
      const data = await api.getSongs(date)
      setSongs(data.songs)

      const typeInfo = BOARD_NAME_MAP[data.boardType] || data.boardType
      const groupCounts = Object.entries(data.songs)
        .map(([key, list]) => `${getGroupLabel(key)} ${list.length}首`)
        .join(", ")
      setIssueName(`${typeInfo} - ${date} (${groupCounts})`)

      // 加载编辑器配置
      const savedConfig = await api.getEditorConfig(date)
      if (savedConfig) {
        setConfig({
          cover: savedConfig.cover || null,
          ed: savedConfig.ed || { bvid: "", name: "", producer: "" },
          script: savedConfig.script || { opening: "", ending: "" },
        })
      }
    } catch {
      // 错误已由 axios 拦截器统一 toast.error 处理
    }
  }, [])

  // 选择歌曲
  const handleSelectSong = useCallback(async (bvid: string) => {
    const allSongs = Object.values(songs).flat()
    const song = allSongs.find((s) => s.bvid === bvid)
    if (!song) return

    setSelectedSong(song)
  }, [songs])

  // 获取所有歌曲列表（用于切换上一首/下一首）
  const allSongsList = Object.values(songs).flat()

  // 选择上一首
  const handleSelectPrev = useCallback(() => {
    if (allSongsList.length === 0) return
    const currentIndex = allSongsList.findIndex((s) => s.bvid === selectedSong?.bvid)
    if (currentIndex <= 0) {
      toast.info("已经是第一首")
      return
    }
    const prevSong = allSongsList[currentIndex - 1]
    setSelectedSong(prevSong)
  }, [allSongsList, selectedSong])

  // 选择下一首
  const handleSelectNext = useCallback(() => {
    if (allSongsList.length === 0) return
    const currentIndex = allSongsList.findIndex((s) => s.bvid === selectedSong?.bvid)
    if (currentIndex === -1 || currentIndex >= allSongsList.length - 1) {
      toast.info("已经是最后一首")
      return
    }
    const nextSong = allSongsList[currentIndex + 1]
    setSelectedSong(nextSong)
  }, [allSongsList, selectedSong])

  // 视频加载完成回调
  const handleVideoLoad = useCallback(async (bvid: string, _duration: number, url: string) => {
    // 更新列表项状态
    setSongs((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((key) => {
        updated[key] = updated[key].map((s) =>
          s.bvid === bvid ? { ...s, _videoExists: true, _videoUrl: url } : s
        )
      })
      return updated
    })

    // 更新当前选中歌曲的状态
    setSelectedSong((prev) => prev ? { ...prev, _videoExists: true, _videoUrl: url } : null)
  }, [])

  // 歌曲更新回调（保存片段）
  const handleSongUpdate = useCallback(async (bvid: string, clip: { startTime: number; endTime: number; duration: number }) => {
    try {
      await api.saveClip(bvid, { startTime: clip.startTime, endTime: clip.endTime })

      const newClip = { startTime: clip.startTime, endTime: clip.endTime, duration: clip.duration }

      // 更新列表中的状态
      setSongs((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((key) => {
          updated[key] = updated[key].map((s) =>
            s.bvid === bvid ? { ...s, _clip: newClip } : s
          )
        })
        return updated
      })

      // 更新当前选中歌曲
      setSelectedSong((prev) => prev ? { ...prev, _clip: newClip } : null)
    } catch {
      // 错误已由拦截器处理
    }
  }, [])

  const handleDownloadAll = useCallback(async () => {
    const all = Object.values(songs).flat()
    const toDownload = all.filter((s) => !s._videoExists).map((s) => s.bvid)

    if (toDownload.length === 0) {
      toast("所有视频已下载")
      return
    }

    toast(`开始下载 ${toDownload.length} 个视频...`)

    try {
      await api.batchDownload(toDownload)
      toast.success("下载任务已启动")

      // 轮询检查下载状态
      const checkInterval = setInterval(async () => {
        try {
          const data = await api.getSongs(selectedDate)
          const allSongsData = Object.values(data.songs).flat()
          let allDownloaded = true

          allSongsData.forEach((s) => {
            if (s._videoExists) {
              // 更新本地状态
              const localSong = all.find((ls) => ls.bvid === s.bvid)
              if (localSong) {
                localSong._videoExists = true
                localSong._videoUrl = s._videoUrl
              }
            } else {
              allDownloaded = false
            }
          })

          if (allDownloaded) {
            clearInterval(checkInterval)
            toast.success("所有视频下载完成")
          }
        } catch {
          // 忽略轮询错误
        }
      }, 3000)

      setTimeout(() => clearInterval(checkInterval), 120000)
    } catch {
      // 错误已由拦截器处理
    }
  }, [songs, selectedDate])

  const handleSaveConfig = useCallback(async () => {
    try {
      await api.saveEditorConfig(selectedDate, config)
      toast.success("配置已保存")
    } catch {
      // 错误已由拦截器处理
    }
  }, [selectedDate, config])

  const handleStartSynthesis = useCallback(async () => {
    if (!selectedDate) return

    // 先保存配置
    await handleSaveConfig()

    try {
      await api.startSynthesis(selectedDate)
      toast.success("合成任务已启动")
      setTimeout(() => (location.href = "/"), 1000)
    } catch {
      // 错误已由拦截器处理
    }
  }, [selectedDate, handleSaveConfig])

  // 加载日期列表
  useEffect(() => {
    api.getFiles()
      .then(({ files }) => setDates(files))
      .catch(() => {})
  }, [])

  // 从 URL 参数获取日期
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dateParam = params.get("date")
    if (dateParam) {
      // 使用 requestAnimationFrame 来延迟调用，避免同步 setState
      requestAnimationFrame(() => {
        setSelectedDate(dateParam)
        handleDateChange(dateParam)
      })
    }
  }, [handleDateChange])

  // 键盘快捷键 - 切换上一首/下一首
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Enter: 切换下一首
      if (e.key === "Enter") {
        if (e.shiftKey) {
          e.preventDefault()
          handleSelectPrev()
        } else {
          e.preventDefault()
          handleSelectNext()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleSelectPrev, handleSelectNext])

  // 计算进度
  const allSongs = Object.values(songs).flat()
  const clippedCount = allSongs.filter((s) => s._clip).length
  const clipProgress = `${clippedCount}/${allSongs.length}`

  return (
    <div className="h-screen flex flex-col bg-neutral-900 text-white overflow-hidden">
      <EditorHeader
        dates={dates}
        selectedDate={selectedDate}
        onDateChange={(date) => {
          setSelectedDate(date)
          handleDateChange(date)
        }}
        onDownloadAll={handleDownloadAll}
        onStartSynthesis={handleStartSynthesis}
      />

      <main className="flex-1 flex overflow-hidden min-h-0">
        <SongListPanel
          clipProgress={clipProgress}
          issueName={issueName}
          config={config}
          onConfigChange={(newConfig) => setConfig((prev) => ({ ...prev, ...newConfig }))}
          onSave={handleSaveConfig}
          songs={songs}
          selectedSong={selectedSong}
          onSelectSong={handleSelectSong}
        />

        <EditorContent
          song={selectedSong}
          onVideoLoad={handleVideoLoad}
          onSongUpdate={handleSongUpdate}
        />
      </main>
    </div>
  )
}
