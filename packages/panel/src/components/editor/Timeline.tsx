import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { formatTime } from "../../utils"

/**
 * 根据HTML元素的宽度实时渲染
 * @param ref HTML元素
 * @returns HTML元素的宽度
 */
function useElementWidth(ref: RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return width
}

// 刻度规则
const getTickInterval = (z: number) => {
  if (z >= 8) return 2
  if (z >= 6) return 5
  if (z >= 4) return 10
  if (z >= 2) return 15
  return 30
}

type DragTarget = "start" | "end" | null

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
  onRangeChange,  // 使用这个函数就会自动保存，所以我们是等结束了再用
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)

  // 内部实际使用的开始时间和结束时间，拖动结束后上传
  const [innerStartTime, setInnerStartTime] = useState<number>(startTime)
  const [innerEndTime, setInnerEndTime] = useState<number>(endTime)
  useEffect(() => {
    setInnerStartTime(startTime)
  }, [startTime])
  useEffect(() => {
    setInnerEndTime(endTime)
  }, [endTime])

  // 监听时间轴宽度
  const wrapperWidth = useElementWidth(wrapperRef)
  const timelineWidth = wrapperWidth * zoomLevel - 1   // -1是为了避免小数影响，导致出现滚动条

  // 生成刻度
  const ticks: { time: number; percent: number }[] = []
  const interval = getTickInterval(zoomLevel)
  for (let t = 0; t <= duration; t += interval) {
    ticks.push({ time: t, percent: (t / duration) * 100 })
  }

  // 跟视频播放进度相关的内容
  const playhead = document.getElementById("playhead")
  if (playhead) {
    playhead.style.left = `${(currentTime / duration) * 100}%`
  }
  const currentDisplay = document.getElementById("currentTimeDisplay")
  if (currentDisplay) {
    currentDisplay.textContent = formatTime(currentTime)
  }

  // Ref 不用于 DOM 显示，但是可以长期保存
  const latestRangeRef = useRef({ start: innerStartTime, end: innerEndTime })
  useEffect(() => {
    latestRangeRef.current = {
      start: innerStartTime,
      end: innerEndTime
    }
  }, [innerStartTime, innerEndTime])

  // 计算时间线上位置对应时间的公共函数
  const getTime = useCallback((clientX: number) => {
    if(!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    let pct = (clientX - rect.left) / rect.width  // 时间占比
    pct = Math.max(0, Math.min(1, pct))  // 避免脱离范围
    const time = pct * duration

    return time
  }, [duration])

  // 更新拖动位置时的公共函数，更新内部片段
  const updateDragPosition = useCallback((clientX: number, dragTarget: DragTarget) =>{
    if(!timelineRef.current || !dragTarget) return

    const time = getTime(clientX)

    if (dragTarget === "start") {
      const newStart = Math.max(0, Math.min(time, duration - 15)) // 一般不会把开始时间点设置成太后面
      // 拖头时确保片段长度不变
      const clipDuration = endTime - startTime
      let newEnd = newStart + clipDuration
      if (newEnd > duration) {
        newEnd = duration
      }
      setInnerStartTime(newStart)
      setInnerEndTime(newEnd)
    } else {
      // 时长会变
      const newEnd = Math.max(startTime + 5, Math.min(time, duration))
      setInnerEndTime(newEnd)
    }
  }, [startTime, endTime, getTime, duration])

  // 拖拽手柄
  useEffect(() => {
    if (!dragTarget) return

    const handlePointerMove = (e: PointerEvent) => {
      updateDragPosition(e.clientX, dragTarget)
    }

    const handlePointerUp = () => {
      setDragTarget(null)
      onRangeChange(latestRangeRef.current.start, latestRangeRef.current.end)
    }

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp)
    return () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }
  }, [dragTarget, updateDragPosition, onRangeChange])

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
        // 等待 DOM 更新后再调整滚动位置
        requestAnimationFrame(() => {
          const newScrollWidth = wrapper.scrollWidth
          const newMouseXInTimeline = newScrollWidth * mouseRatio
          wrapper.scrollLeft = Math.max(0, newMouseXInTimeline - mouseXInWrapper)
        })
      }
    }

    wrapper.addEventListener("wheel", handleWheel, { passive: false })
    return () => wrapper.removeEventListener("wheel", handleWheel)
  }, [zoomLevel, onZoomChange])

  // 移动进度
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 捕获当前 pointer
    e.currentTarget.setPointerCapture(e.pointerId)

    // 点击时立即更新
    onSeek(getTime(e.clientX))
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 只有当前元素真正捕获了这个 pointer 时才处理
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return

    onSeek(getTime(e.clientX))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // 主动释放（通常浏览器也会自动释放）
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }


  const startPercent = (innerStartTime / duration) * 100
  const endPercent = (innerEndTime / duration) * 100
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* 选中区域 - 底层 */}
          <div
            className="absolute top-0 bottom-0 bg-blue-500/30 pointer-events-none z-0"
            style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
          />
          {/* 起点手柄 */}
          <div
            className="timeline-handle start absolute top-0 bottom-0 w-4 cursor-ew-resize z-20 flex items-center"
            style={{ left: `${startPercent}%` }}
            onPointerDown={(e) => {
              e.stopPropagation()
              setDragTarget("start")
            }}
          >
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-400 z-20" />
            <div className="relative z-20 text-[10px] text-blue-400 bg-neutral-800 px-1.5 py-1 rounded -translate-y-full -mt-1 font-mono whitespace-nowrap">
              {formatTime(innerStartTime, false)}
            </div>
          </div>
          {/* 终点手柄 */}
          <div
            className="timeline-handle end absolute top-0 bottom-0 w-4 cursor-ew-resize z-20 flex items-center justify-end"
            style={{ left: `calc(${endPercent}% - 16px)` }}
            onPointerDown={(e) => {
              e.stopPropagation()
              setDragTarget("end")
            }}
          >
            <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-blue-400 z-20" />
            <div className="relative z-20 text-[10px] text-blue-400 bg-neutral-800 px-1.5 py-1 rounded -translate-y-full -mt-1 font-mono whitespace-nowrap">
              {formatTime(innerEndTime, false)}
            </div>
          </div>
          {/* 播放头 - 顶层 */}
          <div
            id="playhead"
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-30"
            style={{ left: `${currentPercent}%` }}
          >
            <div className="absolute -top-1.5 -left-[5px] w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500" />
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