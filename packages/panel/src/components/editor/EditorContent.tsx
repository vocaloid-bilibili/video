import type { Song } from "../../types/editor"
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

// EditorContent - 编辑器内容（右侧）
interface EditorContentProps {
  song: Song | null
  videoUrl: string | null
  isLoading: boolean
  loadingText: string
  videoDuration: number
  currentTime: number
  startTime: number
  endTime: number
  zoomLevel: number
  isPreviewMode: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  onZoomChange: (zoom: number) => void
  onSeek: (time: number) => void
  onStartTimeChange: (time: number) => void
  onEndTimeChange: (time: number) => void
  onSetDuration: (dur: number) => void
  onSave: () => void
  onPreview: () => void
  onStopPreview: () => void
}

export function EditorContent({
  song,
  videoUrl,
  isLoading,
  loadingText,
  videoDuration,
  currentTime,
  startTime,
  endTime,
  zoomLevel,
  isPreviewMode,
  videoRef,
  onZoomChange,
  onSeek,
  onStartTimeChange,
  onEndTimeChange,
  onSetDuration,
  onSave,
  onPreview,
  onStopPreview,
}: EditorContentProps) {
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
        onLoadedMetadata={() => {}}
        videoRef={videoRef}
      />
      <Timeline
        duration={videoDuration}
        startTime={startTime}
        endTime={endTime}
        currentTime={currentTime}
        zoomLevel={zoomLevel}
        onZoomChange={onZoomChange}
        onSeek={onSeek}
        onRangeChange={(start, end) => {
          onStartTimeChange(start)
          onEndTimeChange(end)
        }}
        videoRef={videoRef}
      />
      <EditorControls
        startTime={startTime}
        endTime={endTime}
        duration={videoDuration > 0 ? endTime - startTime : 0}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onSetDuration={onSetDuration}
        onSave={onSave}
        onPreview={onPreview}
        onStopPreview={onStopPreview}
        isPreviewMode={isPreviewMode}
        videoRef={videoRef}
      />
      <HelpText />
    </div>
  )
}