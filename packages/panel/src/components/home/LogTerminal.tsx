import { useEffect, useRef } from "react"

export interface LogEntry {
  time: string
  message: string
  type: "info" | "success" | "error" | "skip" | "default"
}

interface LogTerminalProps {
  logs: LogEntry[]
  onClear: () => void
}

const logColors = {
  error: "text-red-400",
  success: "text-green-400",
  skip: "text-yellow-400",
  info: "text-blue-300",
  default: "text-foreground",
}

export function LogTerminal({ logs, onClear }: LogTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="flex-1 bg-zinc-900 flex flex-col overflow-hidden rounded-lg">
      <div className="px-3.5 py-2.5 bg-neutral-800 border-b border-zinc-700 flex justify-between items-center shrink-0">
        <span className="text-[11px] text-muted-foreground font-mono">LOG</span>
        <button
          onClick={onClear}
          className="bg-none border-none text-muted-foreground text-[10px] cursor-pointer uppercase px-2 py-1 rounded hover:text-foreground hover:bg-zinc-700 transition-colors"
        >
          清空
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-zinc-300"
        ref={containerRef}
        style={{ scrollbarWidth: "thin", scrollbarColor: "#555 transparent" }}
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground">等待输出...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-0.5">
              <span className="text-zinc-500 mr-2">{log.time}</span>
              <span className={logColors[log.type]}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function parseLog(log: string): LogEntry {
  const parts = log.split("] ")
  let time = ""
  let message = log
  let type: LogEntry["type"] = "default"

  if (parts.length > 1) {
    const t = parts[0].replace("[", "")
    if (t.includes("T")) {
      time = t.split("T")[1].split(".")[0]
    }
    message = parts.slice(1).join("] ")
  }

  if (message.includes("失败") || message.includes("error") || message.includes("Error")) {
    type = "error"
  } else if (message.includes("完成") || message.includes("成功")) {
    type = "success"
  } else if (message.includes("跳过")) {
    type = "skip"
  } else if (message.includes("渲染") || message.includes("下载")) {
    type = "info"
  }

  return { time, message, type }
}
