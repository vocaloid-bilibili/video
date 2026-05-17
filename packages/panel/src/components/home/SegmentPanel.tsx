import type { FileInfo } from "../../api"

interface SegmentPanelProps {
  files: FileInfo[]
  selectedDate: string
  segments: string[]
  loading: boolean
  onDateChange: (date: string) => void
  onDownload: (filename: string) => void
  onRepair: (filename: string) => void
}

export function SegmentPanel({
  files,
  selectedDate,
  segments,
  loading,
  onDateChange,
  onRepair,
}: SegmentPanelProps) {
  return (
    <div className="w-[340px] shrink-0 bg-card border border-border flex flex-col overflow-hidden rounded-lg">
      <div className="px-4 py-3 border-b border-border text-[13px] font-semibold text-card-foreground bg-muted/50 flex justify-between items-center shrink-0">
        <span>分片管理</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-3">
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full p-2.5 border border-border text-[13px] mb-2 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">选择日期查看分片...</option>
            {files.map((f) => (
              <option key={f.date} value={f.date}>
                {f.date} ({f.boardTypeName})
              </option>
            ))}
          </select>
        </div>

        <div id="segmentList">
          {!selectedDate ? (
            <div className="text-center py-10 text-muted-foreground text-xs">请选择日期</div>
          ) : loading ? (
            <div className="text-center py-10 text-muted-foreground text-xs">加载中...</div>
          ) : segments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">暂无分片</div>
          ) : (
            segments.map((segment) => (
              <div key={segment} className="flex justify-between items-center px-2 py-2.5 border-b border-accent text-[12px] rounded hover:bg-accent transition-colors">
                <span className="font-mono text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-2" title={segment}>
                  {segment}
                </span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={`/video/${selectedDate}/segments/${segment}`}
                    download
                    title="下载"
                    className="px-2 py-1 bg-accent border border-border rounded text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors no-underline"
                  >
                    ↓
                  </a>
                  <button onClick={() => onRepair(segment)} title="重绘" className="px-2 py-1 bg-accent border border-border rounded text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    ↻
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
