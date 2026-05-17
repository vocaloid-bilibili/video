import { toast } from "sonner"
import { formatTime } from "../../utils"

// EditorControls - 编辑控制
interface EditorControlsProps {
  startTime: number
  endTime: number
  duration: number
  onStartTimeChange: (time: number) => void
  onEndTimeChange: (time: number) => void
  onSetDuration: (dur: number) => void
  onSave: () => void
  onPreview: () => void
  onStopPreview: () => void
  isPreviewMode: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export function EditorControls({
  startTime,
  endTime,
  duration,
  onStartTimeChange,
  onEndTimeChange,
  onSetDuration,
  onSave,
  onPreview,
  onStopPreview,
  isPreviewMode,
  videoRef,
}: EditorControlsProps) {
  const handleSetStart = () => {
    if (!videoRef.current) return
    let newStart = videoRef.current.currentTime
    let newEnd = newStart + duration
    if (newEnd > videoRef.current.duration) {
      newEnd = videoRef.current.duration
      newStart = Math.max(0, newEnd - duration)
    }
    onStartTimeChange(newStart)
    onEndTimeChange(newEnd)
    toast.success(`起点: ${formatTime(newStart)} (定长 ${duration.toFixed(1)}s)`)
  }

  const handleSetEnd = () => {
    if (!videoRef.current) return
    const newEnd = videoRef.current.currentTime
    let newStart = startTime
    if (newEnd <= newStart) {
      newStart = Math.max(0, newEnd - duration)
      onStartTimeChange(newStart)
    }
    onEndTimeChange(newEnd)
    toast.success(`终点: ${formatTime(newEnd)}`)
  }

  const durationClass = duration < 15 || duration > 35
    ? "text-red-400"
    : duration >= 19 && duration <= 21
      ? "text-green-500"
      : duration < 18 || duration > 25
        ? "text-orange-400"
        : ""

  return (
    <div className="px-5 py-3.5 bg-neutral-800 flex gap-3 items-center flex-wrap shrink-0">
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-neutral-400">开始</label>
        <input
          type="number"
          step={0.1}
          min={0}
          value={startTime.toFixed(2)}
          onChange={(e) => onStartTimeChange(parseFloat(e.target.value) || 0)}
          className="w-20 p-1.5 bg-neutral-700 border border-neutral-600 text-neutral-100 text-sm rounded font-mono focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSetStart}
          title="I"
          className="px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-neutral-100 text-[11px] rounded"
        >
          设起点
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-neutral-400">结束</label>
        <input
          type="number"
          step={0.1}
          min={0}
          value={endTime.toFixed(2)}
          onChange={(e) => onEndTimeChange(parseFloat(e.target.value) || 0)}
          className="w-20 p-1.5 bg-neutral-700 border border-neutral-600 text-neutral-100 text-sm rounded font-mono focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSetEnd}
          title="O"
          className="px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-neutral-100 text-[11px] rounded"
        >
          设终点
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-neutral-400">时长</label>
        <div className={`px-3 py-1.5 bg-neutral-700 rounded text-sm font-mono min-w-[70px] text-center ${durationClass}`}>
          {duration.toFixed(1)}s
        </div>
      </div>

      <div className="flex-1" />

      <button
        onClick={onSave}
        className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
      >
        保存
      </button>

      <div className="w-full flex gap-3 items-center pt-2.5 border-t border-neutral-700 mt-1">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-neutral-400">快速时长</label>
          {[15, 20, 25, 30].map((dur) => (
            <button
              key={dur}
              onClick={() => onSetDuration(dur)}
              className="px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-neutral-100 text-[11px] rounded"
            >
              {dur}s
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {isPreviewMode ? (
          <button
            onClick={onStopPreview}
            className="px-4 py-1.5 bg-neutral-600 hover:bg-neutral-500 text-white text-sm rounded transition-colors"
          >
            停止
          </button>
        ) : (
          <button
            onClick={onPreview}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
          >
            预览片段
          </button>
        )}
      </div>
    </div>
  )
}
