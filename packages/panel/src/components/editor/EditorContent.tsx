import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import type { Song } from "../../types/editor"
import { formatTime } from "../../utils"
import { EditorControls } from "./EditorControls"
import { SongDetailBar } from "./SongDetailBar"
import { Timeline } from "./Timeline"
import { VideoPlayer } from "./VideoPlayer"

// HelpText - 帮助文本
function HelpText() {
  return (
    <div className="px-5 py-2 bg-neutral-800/80 border-t border-neutral-700 shrink-0">
      <span className="text-[10px] text-neutral-500">
        快捷键:{" "}
        <kbd className="inline-block px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-[10px] font-mono mx-0.5">I</kbd>
        设起点 |{" "}
        <kbd className="inline-block px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-[10px] font-mono mx-0.5">O</kbd>
        设终点 |{" "}
        <kbd className="inline-block px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-[10px] font-mono mx-0.5">Space</kbd>
        播放 |{" "}
        <kbd className="inline-block px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-[10px] font-mono mx-0.5">P</kbd>
        预览 |{" "}
        <kbd className="inline-block px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-[10px] font-mono mx-0.5">Ctrl+S</kbd>
        保存 | 滚轮缩放 | Shift+滚轮平移 | 左手柄：定长移动 | 右手柄：改变时长
      </span>
    </div>
  )
}

// 视频编辑状态
interface VideoEditState {
  videoUrl: string | null
  isLoading: boolean
  loadingText: string
  videoDuration: number
  currentTime: number
  startTime: number
  endTime: number
  zoomLevel: number
  isPreviewMode: boolean
  previewEndTime: number
  clipDuration: number
}

const defaultVideoState: VideoEditState = {
  videoUrl: null,
  isLoading: false,
  loadingText: "加载中...",
  videoDuration: 0,
  currentTime: 0,
  startTime: 0,
  endTime: 20,
  zoomLevel: 1,
  isPreviewMode: false,
  previewEndTime: 0,
  clipDuration: 20,
}

// EditorContent - 编辑器内容（右侧）
interface EditorContentProps {
  song: Song | null
  onVideoLoad?: (bvid: string, duration: number, url: string) => void
  onSongUpdate?: (bvid: string, clip: { startTime: number; endTime: number; duration: number }) => void
}

export function EditorContent({
  song,
  onVideoLoad,
  onSongUpdate,
}: EditorContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSongRef = useRef<Song | null>(null)

  // 视频相关状态 - 使用单一状态对象
  const [videoState, setVideoState] = useState<VideoEditState>(defaultVideoState)

  // 派生状态
  const {
    videoUrl, isLoading, loadingText, videoDuration, currentTime,
    startTime, endTime, zoomLevel, isPreviewMode,
  } = videoState

  // 初始化视频状态
  const initVideoState = useCallback((newSong: Song | null) => {
    if (!newSong) {
      setVideoState(defaultVideoState)
      return
    }

    setVideoState((prev) => ({
      ...prev,
      isLoading: !newSong._videoUrl,
      loadingText: newSong._videoUrl ? "加载中..." : "点击加载视频",
      videoUrl: newSong._videoUrl || null,
      startTime: newSong._clip?.startTime || 0,
      endTime: (newSong._clip?.startTime || 0) + (newSong._clip?.duration || 20),
      clipDuration: newSong._clip?.duration || 20,
      zoomLevel: 1,
      isPreviewMode: false,
      previewEndTime: 0,
      currentTime: 0,
      videoDuration: 0,
    }))
  }, [])

  // 歌曲变更时，重置视频状态
  useEffect(() => {
    if (song?.bvid !== lastSongRef.current?.bvid) {
      initVideoState(song)
      lastSongRef.current = song
    }
  }, [song, initVideoState])

  // 处理视频加载完成
  const handleVideoLoaded = useCallback((duration: number, url: string) => {
    setVideoState((prev) => ({
      ...prev,
      videoDuration: duration,
      videoUrl: url,
      isLoading: false,
    }))
    if (song && onVideoLoad) {
      onVideoLoad(song.bvid, duration, url)
    }
  }, [song, onVideoLoad])

  // 处理开始时间变更
  const handleStartTimeChange = useCallback((time: number) => {
    setVideoState((prev) => {
      const validTime = Math.max(0, Math.min(time, prev.videoDuration - 5))
      const newEnd = Math.max(validTime + 5, Math.min(prev.endTime, prev.videoDuration))
      return {
        ...prev,
        startTime: validTime,
        endTime: newEnd,
        clipDuration: newEnd - validTime,
      }
    })
  }, [])

  // 处理结束时间变更
  const handleEndTimeChange = useCallback((time: number) => {
    setVideoState((prev) => {
      const newEnd = Math.max(prev.startTime + 5, Math.min(time, prev.videoDuration))
      return {
        ...prev,
        endTime: newEnd,
        clipDuration: newEnd - prev.startTime,
      }
    })
  }, [])

  // 设置时长
  const handleSetDuration = useCallback((dur: number) => {
    setVideoState((prev) => {
      let newEnd = prev.startTime + dur
      let newStart = prev.startTime
      if (newEnd > prev.videoDuration) {
        newEnd = prev.videoDuration
        newStart = Math.max(0, newEnd - dur)
      }
      return {
        ...prev,
        startTime: newStart,
        endTime: newEnd,
        clipDuration: dur,
      }
    })
  }, [])

  // 设置起点（从当前播放位置）
  const handleSetStart = useCallback(() => {
    const video = videoRef.current
    if (!video || videoState.videoDuration <= 0) return

    let newStart = video.currentTime
    let newEnd = newStart + videoState.clipDuration

    if (newEnd > videoState.videoDuration) {
      newEnd = videoState.videoDuration
      newStart = Math.max(0, newEnd - videoState.clipDuration)
    }

    setVideoState((prev) => ({
      ...prev,
      startTime: newStart,
      endTime: newEnd,
    }))
    toast.success(`起点: ${formatTime(newStart)} (定长 ${videoState.clipDuration.toFixed(1)}s)`)
  }, [videoState.videoDuration, videoState.clipDuration])

  // 设置终点
  const handleSetEnd = useCallback(() => {
    const video = videoRef.current
    if (!video || videoState.videoDuration <= 0) return

    const newEnd = video.currentTime
    let newStart = videoState.startTime

    if (newEnd <= newStart) {
      newStart = Math.max(0, newEnd - videoState.clipDuration)
      setVideoState((prev) => ({ ...prev, startTime: newStart }))
    }

    setVideoState((prev) => ({ ...prev, endTime: newEnd }))
    toast.success(`终点: ${formatTime(newEnd)}`)
  }, [videoState.videoDuration, videoState.startTime, videoState.clipDuration])

  // 跳转播放
  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }, [])

  // 预览
  const handlePreview = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setVideoState((prev) => ({
      ...prev,
      isPreviewMode: true,
      previewEndTime: prev.endTime,
    }))
    video.currentTime = startTime
    video.play()
    toast(`预览 ${formatTime(startTime, false)} - ${formatTime(endTime, false)}`)
  }, [startTime, endTime])

  // 停止预览
  const handleStopPreview = useCallback(() => {
    const video = videoRef.current
    if (video) video.pause()
    setVideoState((prev) => ({ ...prev, isPreviewMode: false }))
  }, [])

  // 保存
  const handleSave = useCallback(() => {
    const duration = endTime - startTime
    if (duration < 15 || duration > 35) {
      toast.error("时长必须在 15-35 秒之间")
      return false
    }

    if (song && onSongUpdate) {
      onSongUpdate(song.bvid, { startTime, endTime, duration })
    }
    toast.success("保存成功")
    return true
  }, [song, startTime, endTime, onSongUpdate])

  // 视频时间更新
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setVideoState((prev) => {
        const newCurrentTime = video.currentTime
        if (prev.isPreviewMode && newCurrentTime >= prev.previewEndTime) {
          video.pause()
          video.currentTime = prev.previewEndTime
          return { ...prev, currentTime: prev.previewEndTime, isPreviewMode: false }
        }
        return { ...prev, currentTime: newCurrentTime }
      })
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => video.removeEventListener("timeupdate", handleTimeUpdate)
  }, [])

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
          if (videoState.isPreviewMode) handleStopPreview()
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
  }, [videoState.isPreviewMode, handleSetStart, handleSetEnd, handlePreview, handleStopPreview, handleSave])

  // 自动保存
  const lastSaveRef = useRef<{ start: number; end: number } | null>(null)
  useEffect(() => {
    if (!song || startTime === undefined || endTime === undefined) return
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
  }, [song, startTime, endTime, handleSave])

  if (!song) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        <span>选择一首歌曲开始编辑</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <SongDetailBar song={song} />
      <VideoPlayer
        videoUrl={videoUrl}
        isLoading={isLoading}
        loadingText={loadingText}
        onLoadedMetadata={handleVideoLoaded}
        videoRef={videoRef}
      />
      <Timeline
        duration={videoDuration}
        startTime={startTime}
        endTime={endTime}
        currentTime={currentTime}
        zoomLevel={zoomLevel}
        onZoomChange={(zoom) => setVideoState((prev) => ({ ...prev, zoomLevel: zoom }))}
        onSeek={handleSeek}
        onRangeChange={(start, end) => {
          handleStartTimeChange(start)
          handleEndTimeChange(end)
        }}
        videoRef={videoRef}
      />
      <EditorControls
        startTime={startTime}
        endTime={endTime}
        duration={videoDuration > 0 ? endTime - startTime : 0}
        onStartTimeChange={handleStartTimeChange}
        onEndTimeChange={handleEndTimeChange}
        onSetDuration={handleSetDuration}
        onSave={handleSave}
        onPreview={handlePreview}
        onStopPreview={handleStopPreview}
        isPreviewMode={isPreviewMode}
        videoRef={videoRef}
      />
      <HelpText />
    </div>
  )
}
