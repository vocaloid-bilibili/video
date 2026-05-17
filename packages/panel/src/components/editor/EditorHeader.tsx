import type { FileInfo } from "../../api"

// EditorHeader - 头部
interface EditorHeaderProps {
  dates: FileInfo[]
  selectedDate: string
  onDateChange: (date: string) => void
  onDownloadAll: () => void
  onStartSynthesis: () => void
}

export function EditorHeader({
  dates,
  selectedDate,
  onDateChange,
  onDownloadAll,
  onStartSynthesis,
}: EditorHeaderProps) {
  return (
    <header className="bg-neutral-800 px-5 py-3 flex justify-between items-center border-b border-neutral-700 shrink-0">
      <h1
        className="text-base font-medium text-neutral-100"
      >
        片段编辑器
      </h1>
      <div className="flex gap-3 items-center">
        <select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-neutral-700 text-neutral-100 border border-neutral-600 px-3 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
        >
          <option value="">选择日期...</option>
          {dates.map((f) => (
            <option key={f.date} value={f.date}>
              {f.date}
            </option>
          ))}
        </select>
        <button
          onClick={onDownloadAll}
          disabled={!selectedDate}
          className="px-4 py-1.5 bg-neutral-600 hover:bg-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
        >
          下载全部视频
        </button>
        <button
          onClick={onStartSynthesis}
          disabled={!selectedDate}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
        >
          开始合成
        </button>
      </div>
    </header>
  )
}
