import { RefreshCw } from "lucide-react"

interface HeaderProps {
  onRefresh: () => void
}

export function Header({ onRefresh }: HeaderProps) {
  return (
    <header>
      <h1>排行榜合成控制台</h1>
      <div className="status-indicator">
        <div className="status-dot" />
        <span>在线</span>
      </div>
      <button className="icon-btn" onClick={onRefresh} title="刷新">
        <RefreshCw size={14} />
      </button>
    </header>
  )
}
