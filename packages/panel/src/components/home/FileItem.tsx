import type { FileInfo } from "../../types/editor"

interface FileItemProps {
  file: FileInfo
  onMerge: (date: string) => void
  onStart: (date: string) => void
}

const tagColors: Record<string, string> = {
  weekly: "bg-blue-100 text-blue-700",
  monthly: "bg-pink-100 text-pink-700",
  special: "bg-orange-100 text-orange-700",
}

const statusColors = {
  ok: "bg-green-100 text-green-700",
  warn: "bg-yellow-100 text-yellow-700",
}

export function FileItem({ file, onMerge, onStart }: FileItemProps) {
  return (
    <div className="border border-border p-3.5 mb-2.5 rounded-lg transition-all hover:border-accent hover:shadow-sm bg-card">
      <div className="flex justify-between items-center mb-2.5">
        <span className="font-semibold text-[15px] text-foreground">{file.date}</span>
        <div className="flex gap-1">
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${tagColors[file.boardType] || "bg-muted text-muted-foreground"}`}>
            {file.boardTypeName}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusColors[file.hasConfig ? "ok" : "warn"]}`}>
            {file.hasConfig ? "已配置" : "未配置"}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 px-2.5 py-1 border border-border bg-background text-[11px] text-foreground rounded-md transition-colors hover:bg-accent hover:border-accent" onClick={() => onMerge(file.date)}>
          仅合并
        </button>
        <button className="flex-1 px-2.5 py-1 bg-primary text-primary-foreground border-primary rounded-md transition-colors hover:bg-primary/90 text-[11px]" onClick={() => onStart(file.date)}>
          编辑合成
        </button>
      </div>
      {file.hasVideo && (
        <a
          className="block text-center text-[11px] text-green-600 mt-2.5 pt-2.5 border-t border-border font-medium no-underline hover:text-green-700"
          href={`/video/${file.date}/${file.date}.mp4`}
          target="_blank"
          rel="noopener noreferrer"
        >
          下载视频
        </a>
      )}
    </div>
  )
}
