import { FileItem, type FileInfo } from "./FileItem"
import { FileDropzone } from "./FileDropzone"
import { RefreshCw } from "lucide-react"

interface FilePanelProps {
  files: FileInfo[]
  loading: boolean
  onRefresh: () => void
  onUpload: (files: File[]) => Promise<void>
  onMerge: (date: string) => void
  onStart: (date: string) => void
}

export function FilePanel({ files, loading, onRefresh, onUpload, onMerge, onStart }: FilePanelProps) {
  return (
    <div className="col-files panel">
      <div className="panel-header">
        <span>数据文件</span>
        <button className="icon-btn" onClick={onRefresh} title="刷新">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="panel-body">
        <FileDropzone onUpload={onUpload} />

        <div id="fileList">
          {loading ? (
            <div className="empty">加载中...</div>
          ) : files.length === 0 ? (
            <div className="empty">暂无数据文件</div>
          ) : (
            files.map((file) => (
              <FileItem key={file.date} file={file} onMerge={onMerge} onStart={onStart} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
