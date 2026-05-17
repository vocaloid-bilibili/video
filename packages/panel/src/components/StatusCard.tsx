export type StatusType = "idle" | "processing" | "completed" | "error"

interface StatusCardProps {
  status: StatusType
  targetDate?: string
  progress?: {
    current: number
    total: number
  }
  step?: string
}

export function StatusCard({ status, targetDate, progress, step }: StatusCardProps) {
  const badgeClass = status === "idle" ? "" : status === "processing" ? "running" : status === "completed" ? "done" : "error"

  const badgeText = status === "idle" ? "IDLE" : status === "processing" ? "运行中" : status === "completed" ? "完成" : "错误"

  const title = status === "idle" ? "空闲" : status === "processing" ? "处理中" : status === "completed" ? "已完成" : "出错"

  const desc = status === "idle" ? "等待任务" : targetDate ? `目标: ${targetDate}` : ""

  const percentage = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="panel status-card">
      <div className="status-card-header">
        <div>
          <div className="status-title">{title}</div>
          <div className="status-desc">{desc}</div>
        </div>
        <div className={`status-badge ${badgeClass}`}>{badgeText}</div>
      </div>
      <div className="progress-info">
        <span>{step || "无任务"}</span>
        <span>{percentage}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
