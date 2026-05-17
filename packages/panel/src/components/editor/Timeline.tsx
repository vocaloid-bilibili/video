import { useEffect, useRef, useState } from "react"
import { formatTime } from "../../utils"

// Timeline - 时间线组件
interface TimelineProps {
  duration: number
  startTime: number
  endTime: number
  currentTime: number
  zoomLevel: number
  onZoomChange: (zoom: number) => void
  onSeek: (time: number) => void
  onRangeChange: (start: number, end: number) => void
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export function Timeline({
  duration,
  startTime,
  endTime,
  currentTime,
  zoomLevel,
  onZoomChange,
  onSeek,
  onRangeChange,
  videoRef,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null)
  const [wrapperWidth, setWrapperWidth] = useState(600)

  // 更新 wrapper 宽度
  useEffect(() => {
    const updateWidth = () => {
      if (wrapperRef.current) {
        setWrapperWidth(wrapperRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  const timelineWidth = wrapperWidth * zoomLevel

  // 生成刻度
  const getTickInterval = () => {
    if (zoomLevel >= 8) return 2
    if (zoomLevel >= 6) return 5
    if (zoomLevel >= 4) return 10
    if (zoomLevel >= 2) return 15
    return 30
  }

  const ticks: { time: number; percent: number }[] = []
  const interval = getTickInterval()
  for (let t = 0; t <= duration; t += interval) {
    ticks.push({ time: t, percent: (t / duration) * 100 })
  }

  // 时间更新回调
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (duration > 0) {
        const playhead = document.getElementById("playhead")
        if (playhead) {
          playhead.style.left = `${(video.currentTime / duration) * 100}%`
        }
        const currentDisplay = document.getElementById("currentTimeDisplay")
        if (currentDisplay) {
          currentDisplay.textContent = formatTime(video.currentTime)
        }
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => video.removeEventListener("timeupdate", handleTimeUpdate)
  }, [duration, videoRef])

  // 拖拽手柄
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      let pct = (e.clientX - rect.left) / rect.width
      pct = Math.max(0, Math.min(1, pct))
      const time = pct * duration

      if (isDragging === "start") {
        const newStart = Math.max(0, Math.min(time, duration - 5))
        const clipDuration = endTime - startTime
        let newEnd = newStart + clipDuration
        if (newEnd > duration) {
          newEnd = duration
        }
        onRangeChange(newStart, newEnd)
      } else {
        const newEnd = Math.max(startTime + 5, Math.min(time, duration))
        onRangeChange(startTime, newEnd)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, duration, startTime, endTime, onRangeChange])

  // 滚轮缩放
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (e.shiftKey) {
        wrapper.scrollLeft += e.deltaY
        return
      }

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        wrapper.scrollLeft += e.deltaX
        return
      }

      const rect = wrapper.getBoundingClientRect()
      const mouseXInWrapper = e.clientX - rect.left
      const mouseXInTimeline = mouseXInWrapper + wrapper.scrollLeft
      const mouseRatio = wrapper.scrollWidth > 0 ? mouseXInTimeline / wrapper.scrollWidth : 0

      const delta = e.deltaY < 0 ? 0.5 : -0.5
      let newZoom = zoomLevel + delta
      newZoom = Math.max(1, Math.min(10, newZoom))

      if (newZoom !== zoomLevel) {
        onZoomChange(newZoom)
        requestAnimationFrame(() => {
          const newMouseXInTimeline = wrapper.scrollWidth * mouseRatio
          wrapper.scrollLeft = Math.max(0, newMouseXInTimeline - mouseXInWrapper)
        })
      }
    }

    wrapper.addEventListener("wheel", handleWheel, { passive: false })
    return () => wrapper.removeEventListener("wheel", handleWheel)
  }, [zoomLevel, onZoomChange])

  const handleTimelineClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".timeline-handle")) return
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(pct * duration, duration))
    onSeek(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const startPercent = (startTime / duration) * 100
  const endPercent = (endTime / duration) * 100
  const currentPercent = (currentTime / duration) * 100

  return (
    <div className="px-5 py-4 bg-neutral-800 border-t border-neutral-700 shrink-0 overflow-hidden">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex gap-5 text-xs text-neutral-400">
          <span>
            当前: <b id="currentTimeDisplay" className="font-mono">{formatTime(currentTime)}</b>
          </span>
          <span>
            选区: <b className="font-mono">{formatTime(startTime, false)} - {formatTime(endTime, false)}</b>
          </span>
          <span>
            总长: <b className="font-mono">{duration > 0 ? formatTime(duration, false) : "--:--"}</b>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <span>缩放</span>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={zoomLevel}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-neutral-600 rounded cursor-pointer"
          />
          <span className="font-mono w-6">{zoomLevel.toFixed(1)}x</span>
        </div>
      </div>

      <div ref={wrapperRef} className="overflow-x-auto overflow-y-hidden mb-2 w-full relative">
        <div
          ref={timelineRef}
          className="relative h-[100px] bg-neutral-700 rounded cursor-pointer"
          style={{ width: `${timelineWidth}px` }}
          onClick={handleTimelineClick}
        >
          {/* 选中区域 */}
          <div
            className="absolute top-0 bottom-0 bg-blue-500/30 pointer-events-none"
            style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
          />
          {/* 播放头 */}
          <div
            id="playhead"
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
            style={{ left: `${currentPercent}%` }}
          >
            <div className="absolute -top-1.5 -left-[5px] w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500" />
          </div>
          {/* 起点手柄 */}
          <div
            className="timeline-handle start absolute top-0 bottom-0 w-4 cursor-ew-resize z-10 flex items-center"
            style={{ left: `${startPercent}%` }}
            onMouseDown={(e) => {
              e.stopPropagation()
              setIsDragging("start")
            }}
          >
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-400" />
            <div className="relative z-10 text-[10px] text-blue-400 bg-neutral-800 px-1.5 py-1 rounded -translate-y-full -mt-1 font-mono whitespace-nowrap">
              {formatTime(startTime, false)}
            </div>
          </div>
          {/* 终点手柄 */}
          <div
            className="timeline-handle end absolute top-0 bottom-0 w-4 cursor-ew-resize z-10 flex items-center justify-end"
            style={{ left: `calc(${endPercent}% - 16px)` }}
            onMouseDown={(e) => {
              e.stopPropagation()
              setIsDragging("end")
            }}
          >
            <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-blue-400" />
            <div className="relative z-10 text-[10px] text-blue-400 bg-neutral-800 px-1.5 py-1 rounded -translate-y-full -mt-1 font-mono whitespace-nowrap">
              {formatTime(endTime, false)}
            </div>
          </div>
          {/* 刻度 */}
          <div className="absolute bottom-0 left-0 right-0 h-5 pointer-events-none">
            {ticks.map(({ time, percent }) => (
              <div
                key={time}
                className="absolute text-[10px] text-neutral-500 -translate-x-1/2"
                style={{ left: `${percent}%` }}
              >
                <div className="absolute bottom-4 left-1/2 w-px h-2 bg-neutral-600" />
                {formatTime(time, false)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}