export interface FileInfo {
  date: string
  boardType: string
  boardTypeName: string
  hasConfig: boolean
  hasVideo: boolean
}

interface FileItemProps {
  file: FileInfo
  onMerge: (date: string) => void
  onStart: (date: string) => void
}

export function FileItem({ file, onMerge, onStart }: FileItemProps) {
  return (
    <div className="file-item">
      <div className="file-item-header">
        <span className="file-item-date">{file.date}</span>
        <div className="file-item-tags">
          <span className={`file-item-tag ${file.boardType}`}>
            {file.boardTypeName}
          </span>
          <span className={`file-item-tag ${file.hasConfig ? "ok" : "warn"}`}>
            {file.hasConfig ? "已配置" : "未配置"}
          </span>
        </div>
      </div>
      <div className="file-item-actions">
        <button className="btn btn-sm" onClick={() => onMerge(file.date)}>
          仅合并
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => onStart(file.date)}>
          编辑合成
        </button>
      </div>
      {file.hasVideo && (
        <a
          className="file-item-download"
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
