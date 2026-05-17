import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import type { ActiveTab, EditorConfig, FileInfo, Song, SongsData } from "../types/editor"
import { fetchAPI, formatTime, getGroupLabel } from "../utils"
import { SongListPanel } from "../components/editor/SongListPanel"
import { EditorHeader } from "../components/editor/EditorHeader"
import { SongListContent } from "../components/editor/SongListContent"
import { ConfigPanel } from "../components/editor/ConfigPanel"
import { EditorContent } from "../components/editor/EditorContent"

// ========== 常量 ==========
const API = "/api"


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
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("加载中...")
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(20)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewEndTime, setPreviewEndTime] = useState(0)
  const [clipDuration, setClipDuration] = useState(20)
  const [activeTab, setActiveTab] = useState<ActiveTab>("songs")
  const [headerTitle, setHeaderTitle] = useState("片段编辑器")
  const [config, setConfig] = useState<EditorConfig>({
    cover: null,
    ed: { bvid: "", name: "", author: "" },
    script: { opening: "", ending: "" },
  })

  const videoRef = useRef<HTMLVideoElement>(null)

  // 处理日期变更
  const handleDateChange = useCallback(async (date: string) => {
    if (!date) return

    try {
      const data = await fetchAPI<{ songs: SongsData; boardType: string }>(`${API}/songs/${date}`)
      setSongs(data.songs)

      const typeInfo = BOARD_NAME_MAP[data.boardType] || data.boardType
      const groupCounts = Object.entries(data.songs)
        .map(([key, list]) => `${getGroupLabel(key)} ${list.length}首`)
        .join(", ")
      setHeaderTitle(
        `片段编辑器 <span style="font-size: 14px; color: #888; margin-left: 12px;">${typeInfo} - ${date} (${groupCounts})</span>`
      )

      // 加载编辑器配置
      try {
        const savedConfig = await fetchAPI<Partial<EditorConfig>>(`${API}/editor-config/${date}`)
        if (savedConfig && !("error" in savedConfig)) {
          setConfig({
            cover: savedConfig.cover || null,
            ed: savedConfig.ed || { bvid: "", name: "", author: "" },
            script: savedConfig.script || { opening: "", ending: "" },
          })
        }
      } catch {
        // 配置不存在
      }
    } catch (e) {
      toast.error("加载失败: " + (e as Error).message)
    }
  }, [])

  // 选择歌曲
  const handleSelectSong = useCallback(async (bvid: string) => {
    const allSongs = Object.values(songs).flat()
    const song = allSongs.find((s) => s.bvid === bvid)
    if (!song) return

    setSelectedSong(song)
    setIsLoading(true)
    setLoadingText("加载中...")

    if (!song._videoExists) {
      setLoadingText("下载视频中...")
      try {
        const result = await fetchAPI<{ url: string; duration: number }>(
          `${API}/full-video/${bvid}`,
          { method: "POST" }
        )

        setVideoDuration(result.duration)
        setVideoUrl(result.url)
        setIsLoading(false)

        // 更新列表项状态
        setSongs((prev) => {
          const updated = { ...prev }
          Object.keys(updated).forEach((key) => {
            updated[key] = updated[key].map((s) =>
              s.bvid === bvid ? { ...s, _videoExists: true, _videoUrl: result.url } : s
            )
          })
          return updated
        })

        // 更新当前选中歌曲的状态
        setSelectedSong((prev) => prev ? { ...prev, _videoExists: true, _videoUrl: result.url } : null)
      } catch (e) {
        setLoadingText("下载失败: " + (e as Error).message)
        return
      }
    } else {
      setVideoDuration(0)
      setVideoUrl(song._videoUrl || null)
      setIsLoading(false)
    }

    // 加载片段设置
    const clipStart = song._clip?.startTime || 0
    const dur = song._clip?.duration || 20
    setStartTime(clipStart)
    setClipDuration(dur)
    setEndTime(clipStart + dur)
    setZoomLevel(1)
  }, [songs])

  // 时间变更处理
  const handleStartTimeChange = useCallback((time: number) => {
    const validTime = Math.max(0, Math.min(time, videoDuration - 5))
    setStartTime(validTime)
    const newEnd = Math.max(validTime + 5, Math.min(endTime, videoDuration))
    setEndTime(newEnd)
    setClipDuration(newEnd - validTime)
  }, [videoDuration, endTime])

  const handleEndTimeChange = useCallback((time: number) => {
    const newEnd = Math.max(startTime + 5, Math.min(time, videoDuration))
    setEndTime(newEnd)
    setClipDuration(newEnd - startTime)
  }, [videoDuration, startTime])

  const handleSetDuration = useCallback((dur: number) => {
    let newEnd = startTime + dur
    if (newEnd > videoDuration) {
      newEnd = videoDuration
      setStartTime(Math.max(0, newEnd - dur))
    }
    setEndTime(newEnd)
    setClipDuration(dur)
  }, [videoDuration, startTime])

  const handleSetStart = useCallback(() => {
    const video = videoRef.current
    if (!video || videoDuration <= 0) return

    let newStart = video.currentTime
    let newEnd = newStart + clipDuration

    if (newEnd > videoDuration) {
      newEnd = videoDuration
      newStart = Math.max(0, newEnd - clipDuration)
    }

    setStartTime(newStart)
    setEndTime(newEnd)
    toast.success(`起点: ${formatTime(newStart)} (定长 ${clipDuration.toFixed(1)}s)`)
  }, [videoDuration, clipDuration])

  const handleSetEnd = useCallback(() => {
    const video = videoRef.current
    if (!video || videoDuration <= 0) return

    const newEnd = video.currentTime
    let newStart = startTime

    if (newEnd <= newStart) {
      newStart = Math.max(0, newEnd - clipDuration)
      setStartTime(newStart)
    }

    setEndTime(newEnd)
    toast.success(`终点: ${formatTime(newEnd)}`)
  }, [videoDuration, startTime, clipDuration])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }, [])

  const handlePreview = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setIsPreviewMode(true)
    setPreviewEndTime(endTime)
    video.currentTime = startTime
    video.play()
    toast(`预览 ${formatTime(startTime, false)} - ${formatTime(endTime, false)}`)
  }, [startTime, endTime])

  const handleStopPreview = useCallback(() => {
    const video = videoRef.current
    if (video) video.pause()
    setIsPreviewMode(false)
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedSong) return

    const duration = endTime - startTime
    if (duration < 15 || duration > 35) {
      toast.error("时长必须在 15-35 秒之间")
      return
    }

    try {
      await fetchAPI(`${API}/clips/${selectedSong.bvid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime, endTime }),
      })

      const newClip = { startTime, endTime, duration }
      setClipDuration(duration)

      // 更新列表中的状态
      setSongs((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((key) => {
          updated[key] = updated[key].map((s) =>
            s.bvid === selectedSong.bvid ? { ...s, _clip: newClip } : s
          )
        })
        return updated
      })

      // 更新当前选中歌曲
      setSelectedSong((prev) => prev ? { ...prev, _clip: newClip } : null)

      toast.success("保存成功")
    } catch (e) {
      toast.error("保存失败: " + (e as Error).message)
    }
  }, [selectedSong, startTime, endTime])

  const handleDownloadAll = useCallback(async () => {
    const all = Object.values(songs).flat()
    const toDownload = all.filter((s) => !s._videoExists).map((s) => s.bvid)

    if (toDownload.length === 0) {
      toast("所有视频已下载")
      return
    }

    toast(`开始下载 ${toDownload.length} 个视频...`)

    try {
      await fetchAPI(`${API}/full-video/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bvids: toDownload }),
      })
      toast.success("下载任务已启动")

      // 轮询检查下载状态
      const checkInterval = setInterval(async () => {
        try {
          const data = await fetchAPI<{ songs: SongsData }>(`${API}/songs/${selectedDate}`)
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
    } catch (e) {
      toast.error("下载失败: " + (e as Error).message)
    }
  }, [songs, selectedDate])

  const handleSaveConfig = useCallback(async () => {
    try {
      await fetchAPI(`${API}/editor-config/${selectedDate}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      toast.success("配置已保存")
    } catch (e) {
      toast.error("保存失败: " + (e as Error).message)
    }
  }, [selectedDate, config])

  const handleStartSynthesis = useCallback(async () => {
    if (!selectedDate) return

    // 先保存配置
    await handleSaveConfig()

    try {
      await fetchAPI(`${API}/synthesis/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      })
      toast.success("合成任务已启动")
      setTimeout(() => (location.href = "/"), 1000)
    } catch (e) {
      toast.error("启动失败: " + (e as Error).message)
    }
  }, [selectedDate, handleSaveConfig])

  // 加载日期列表
  useEffect(() => {
    fetchAPI<{ files: FileInfo[] }>(`${API}/files`)
      .then(({ files }) => setDates(files))
      .catch(console.error)
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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const video = videoRef.current

      switch (e.key.toLowerCase()) {
        case "i":
          e.preventDefault()
          handleSetStart()
          break
        case "o":
          e.preventDefault()
          handleSetEnd()
          break
        case " ":
          e.preventDefault()
          if (video) {
            if (video.paused) video.play()
            else video.pause()
          }
          break
        case "p":
          e.preventDefault()
          if (isPreviewMode) handleStopPreview()
          else handlePreview()
          break
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleSave()
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isPreviewMode, handleSetStart, handleSetEnd, handlePreview, handleStopPreview, handleSave])

  // 视频时间更新
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      if (isPreviewMode && video.currentTime >= previewEndTime) {
        video.pause()
        video.currentTime = previewEndTime
        handleStopPreview()
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => video.removeEventListener("timeupdate", handleTimeUpdate)
  }, [isPreviewMode, previewEndTime, handleStopPreview])

  // 自动保存 - 使用 useRef 跟踪上一次保存的时间点
  const lastSaveRef = useRef<{ start: number; end: number } | null>(null)
  useEffect(() => {
    if (!selectedSong || startTime === undefined || endTime === undefined) return
    const duration = endTime - startTime
    if (duration < 15 || duration > 35) return

    // 检查是否已经保存过这个时间点
    if (lastSaveRef.current &&
        lastSaveRef.current.start === startTime &&
        lastSaveRef.current.end === endTime) {
      return
    }

    lastSaveRef.current = { start: startTime, end: endTime }
    handleSave()
  }, [startTime, endTime, selectedSong, handleSave])

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
        headerTitle={headerTitle}
      />

      <main className="flex-1 flex overflow-hidden min-h-0">
        <SongListPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          clipProgress={clipProgress}
        >
          {activeTab === "songs" ? (
            <SongListContent
              songs={songs}
              selectedBvid={selectedSong?.bvid || null}
              onSelectSong={handleSelectSong}
            />
          ) : (
            <ConfigPanel
              config={config}
              songs={songs}
              onSave={handleSaveConfig}
              onConfigChange={(newConfig) => setConfig((prev) => ({ ...prev, ...newConfig }))}
            />
          )}
        </SongListPanel>

        <EditorContent
          song={selectedSong}
          videoUrl={videoUrl}
          isLoading={isLoading}
          loadingText={loadingText}
          videoDuration={videoDuration}
          currentTime={currentTime}
          startTime={startTime}
          endTime={endTime}
          zoomLevel={zoomLevel}
          isPreviewMode={isPreviewMode}
          videoRef={videoRef}
          onZoomChange={setZoomLevel}
          onSeek={handleSeek}
          onStartTimeChange={handleStartTimeChange}
          onEndTimeChange={handleEndTimeChange}
          onSetDuration={handleSetDuration}
          onSave={handleSave}
          onPreview={handlePreview}
          onStopPreview={handleStopPreview}
        />
      </main>
    </div>
  )
}
