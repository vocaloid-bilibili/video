import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import type { Song } from "../../types/editor"
import { formatTime } from "../../utils"
import { EditorControls } from "./EditorControls"
import { SongDetailBar } from "./SongDetailBar"
import { Timeline } from "./Timeline"
import { VideoPlayer } from "./VideoPlayer"
import './EditorContent.css'

// HelpText - 帮助文本
function HelpText() {
  return (
    <div className="px-5 py-2 bg-neutral-800/80 border-t border-neutral-700 shrink-0">
      <span className="text-[10px] text-neutral-500">
        快捷键:{" "}
        <kbd>I</kbd>
        设起点 |{" "}
        <kbd>O</kbd>
        设终点 |{" "}
        <kbd>Shift+I</kbd>
        跳转起点 |{" "}
        <kbd>Shift+O</kbd>
        跳转终点 |{" "}
        <kbd>Space</kbd>
        播放 |{" "}
        <kbd>P</kbd>
        预览 |{" "}
        <kbd>Ctrl+S</kbd>
        保存 | 滚轮缩放 | Shift+滚轮平移 | 左手柄：定长移动 | 右手柄：改变时长
      </span>
    </div>
  )
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

  // 视频源状态
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("加载中...")
  const [videoDuration, setVideoDuration] = useState(0)

  // 时间范围状态
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(20)
  const [clipDuration, setClipDuration] = useState(20)

  // 播放状态
  const [currentTime, setCurrentTime] = useState(0)

  // UI 状态
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewEndTime, setPreviewEndTime] = useState(0)

  // 初始化视频状态
  const initVideoState = useCallback((newSong: Song | null) => {
    if (!newSong) return
    

    const initStart = newSong._clip?.startTime || 0
    const initDuration = newSong._clip?.duration || 20

    setVideoUrl(newSong._videoUrl || null)
    setIsLoading(!newSong._videoUrl)
    setLoadingText(newSong._videoUrl ? "加载中..." : "点击加载视频")
    setVideoDuration(0)
    setCurrentTime(initStart)
    setStartTime(initStart)
    setEndTime(initStart + initDuration)
    setClipDuration(initDuration)
    setZoomLevel(1)
    setIsPreviewMode(false)
    setPreviewEndTime(0)
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
    setVideoDuration(duration)
    setVideoUrl(url)
    setIsLoading(false)

    // 视频加载完成后，跳转到 currentTime 位置
    if (videoRef.current) {
      videoRef.current.currentTime = startTime
      setCurrentTime(startTime)
    }

    if (song && onVideoLoad) {
      onVideoLoad(song.bvid, duration, url)
    }
  }, [song, onVideoLoad, startTime])

  // 处理开始时间变更
  const handleStartTimeChange = useCallback((time: number) => {
    const validTime = Math.max(0, Math.min(time, videoDuration - 5))
    const newEnd = Math.max(validTime + 5, Math.min(endTime, videoDuration))
    setStartTime(validTime)
    setEndTime(newEnd)
    setClipDuration(newEnd - validTime)
  }, [videoDuration, endTime])

  // 处理结束时间变更
  const handleEndTimeChange = useCallback((time: number) => {
    const newEnd = Math.max(startTime + 5, Math.min(time, videoDuration))
    setEndTime(newEnd)
    setClipDuration(newEnd - startTime)
  }, [videoDuration, startTime])

  // 设置时长
  const handleSetDuration = useCallback((dur: number) => {
    let newEnd = startTime + dur
    let newStart = startTime
    if (newEnd > videoDuration) {
      newEnd = videoDuration
      newStart = Math.max(0, newEnd - dur)
    }
    setStartTime(newStart)
    setEndTime(newEnd)
    setClipDuration(dur)
  }, [videoDuration, startTime])

  // 设置起点（从当前播放位置）
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

  // 设置终点
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

  // 跳转播放
  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  // 预览
  const handlePreview = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setIsPreviewMode(true)
    setPreviewEndTime(endTime)
    video.currentTime = startTime
    video.play()
    toast(`预览 ${formatTime(startTime, false)} - ${formatTime(endTime, false)}`)
  }, [startTime, endTime])

  // 停止预览
  const handleStopPreview = useCallback(() => {
    const video = videoRef.current
    if (video) video.pause()
    setIsPreviewMode(false)
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
    return true
  }, [song, startTime, endTime, onSongUpdate])

  // 视频时间更新 - 播放时实时同步 currentTime
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => video.removeEventListener("timeupdate", handleTimeUpdate)
  }, [videoUrl])

  // 预览模式控制 - 播放到终点时自动停止
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    // 使用 ref 跟踪当前预览终点，避免闭包问题
    const previewEndRef = { current: previewEndTime }

    const handleEnded = () => {
      if (previewEndRef.current > 0) {
        video.currentTime = previewEndRef.current
      }
      setCurrentTime(previewEndRef.current)
      setIsPreviewMode(false)
    }

    const handleTimeUpdate = () => {
      // 检查是否到达预览终点
      if (isPreviewMode && video.currentTime >= previewEndTime) {
        video.pause()
        video.currentTime = previewEndTime
        setCurrentTime(previewEndTime)
        setIsPreviewMode(false)
      }
    }

    video.addEventListener("ended", handleEnded)
    video.addEventListener("timeupdate", handleTimeUpdate)

    return () => {
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [videoUrl, isPreviewMode, previewEndTime])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const video = videoRef.current

      // Shift+I: 跳转到起点
      if (e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault()
        if (video && videoDuration > 0) {
          video.currentTime = startTime
          setCurrentTime(startTime)
        }
        return
      }

      // Shift+O: 跳转到终点
      if (e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault()
        if (video && videoDuration > 0) {
          video.currentTime = endTime
          setCurrentTime(endTime)
        }
        return
      }

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
  }, [isPreviewMode, handleSetStart, handleSetEnd, handlePreview, handleStopPreview, handleSave, startTime, endTime, videoDuration])

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
        onZoomChange={setZoomLevel}
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
