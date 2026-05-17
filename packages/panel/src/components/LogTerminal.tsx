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

export function LogTerminal({ logs, onClear }: LogTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const getLogClass = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return "log-error"
      case "success":
        return "log-success"
      case "skip":
        return "log-skip"
      case "info":
        return "log-info"
      default:
        return ""
    }
  }

  return (
    <div className="panel terminal">
      <div className="terminal-header">
        <span>LOG</span>
        <button onClick={onClear}>清空</button>
      </div>
      <div className="terminal-body" ref={containerRef}>
        {logs.length === 0 ? (
          <div style={{ color: "#666" }}>等待输出...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-line">
              <span className="log-time">{log.time}</span>
              <span className={getLogClass(log.type)}>{log.message}</span>
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
