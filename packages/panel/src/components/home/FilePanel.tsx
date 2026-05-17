import { FileItem } from "./FileItem"
import type { FileInfo } from "../../types/editor"
import { FileDropzone } from "./FileDropzone"
import { RefreshCw } from "lucide-react"
import { cn } from "../../utils"

interface FilePanelProps {
  files: FileInfo[]
  loading: boolean
  onRefresh: () => void
  onUpload: (files: File[]) => Promise<void>
  onMerge: (date: string) => void
  onStart: (date: string) => void
  className: string
}

export function FilePanel({ files, loading, onRefresh, onUpload, onMerge, onStart, className }: FilePanelProps) {
  return (
    <div className={cn("bg-card border border-border flex flex-col overflow-hidden rounded-lg", className)}>
      <div className="px-4 py-3 border-b border-border text-[13px] font-semibold text-card-foreground bg-muted/50 flex justify-between items-center shrink-0">
        <span>数据文件</span>
        <button className="bg-none border-none p-1.5 cursor-pointer text-muted-foreground rounded hover:text-foreground hover:bg-accent transition-colors text-sm" onClick={onRefresh} title="刷新">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <FileDropzone onUpload={onUpload} />

        <div id="fileList">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-xs">加载中...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">暂无数据文件</div>
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
