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

const statusConfig = {
  idle: {
    badgeClass: "bg-muted text-muted-foreground",
    badgeText: "IDLE",
    title: "空闲",
  },
  processing: {
    badgeClass: "bg-blue-100 text-blue-700",
    badgeText: "运行中",
    title: "处理中",
  },
  completed: {
    badgeClass: "bg-green-100 text-green-700",
    badgeText: "完成",
    title: "已完成",
  },
  error: {
    badgeClass: "bg-red-100 text-red-700",
    badgeText: "错误",
    title: "出错",
  },
}

export function StatusCard({ status, targetDate, progress, step }: StatusCardProps) {
  const config = statusConfig[status]
  const desc = status === "idle" ? "等待任务" : targetDate ? `目标: ${targetDate}` : ""
  const percentage = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="bg-card border border-border rounded-lg p-5 shrink-0">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-semibold text-foreground">{config.title}</div>
          <div className="text-[12px] text-muted-foreground mt-1">{desc}</div>
        </div>
        <div className={`text-[10px] px-2.5 py-1 font-semibold rounded ${config.badgeClass}`}>
          {config.badgeText}
        </div>
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
        <span>{step || "无任务"}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-green-600 transition-all duration-300 rounded"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
