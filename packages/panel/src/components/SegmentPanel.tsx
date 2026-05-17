import { type FileInfo } from "./FileItem"

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
  onDownload,
  onRepair,
}: SegmentPanelProps) {
  return (
    <div className="col-segments panel">
      <div className="panel-header">
        <span>分片管理</span>
      </div>
      <div className="panel-body">
        <div className="segment-controls">
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
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
            <div className="empty">请选择日期</div>
          ) : loading ? (
            <div className="empty">加载中...</div>
          ) : segments.length === 0 ? (
            <div className="empty">暂无分片</div>
          ) : (
            segments.map((segment) => (
              <div key={segment} className="segment-item">
                <span className="segment-name" title={segment}>
                  {segment}
                </span>
                <div className="segment-actions">
                  <a
                    href={`/video/${selectedDate}/segments/${segment}`}
                    download
                    title="下载"
                  >
                    ↓
                  </a>
                  <button onClick={() => onRepair(segment)} title="重绘">
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
