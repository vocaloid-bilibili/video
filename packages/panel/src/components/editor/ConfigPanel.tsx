import { toast } from "sonner"
import type { EditorConfig, Song, SongsData } from "../../types/editor"

// ConfigPanel - 配置面板
interface ConfigPanelProps {
  config: EditorConfig
  songs: SongsData
  onSave: () => void
  onConfigChange: (config: Partial<EditorConfig>) => void
}

export function ConfigPanel({ config, songs, onSave, onConfigChange }: ConfigPanelProps) {
  const allSongs = Object.values(songs).flat()
  const mainSongs =
    songs.MainRankCard || songs.SpecialCard || songs.CoverMainRankCard || allSongs

  const candidates: (Song & { reason: string })[] = []
  mainSongs.slice(0, 20).forEach((s) => {
    candidates.push({ ...s, reason: `#${s.rank}` })
  })

  const firstAppear = mainSongs.find((s) => s.count === 1)
  if (firstAppear && !candidates.find((c) => c.bvid === firstAppear.bvid)) {
    candidates.push({ ...firstAppear, reason: "首上榜" })
  }

  const handleCoverSelect = (song: Song) => {
    onConfigChange({
      cover: { bvid: song.bvid, image_url: song.image_url || "" },
    })
    toast.success("已选择封面")
  }

  return (
    <div className="p-3">
      {/* 旁白文案 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-neutral-400 mb-2 pb-1.5 border-b border-neutral-700">
          旁白文案
        </div>
        <div className="mb-3">
          <label className="block text-[11px] text-neutral-500 mb-1">开场旁白</label>
          <textarea
            value={config.script.opening}
            onChange={(e) => onConfigChange({ script: { ...config.script, opening: e.target.value } })}
            placeholder="显示在信息卡片上..."
            className="w-full p-2 bg-neutral-700 border border-neutral-600 text-neutral-100 text-xs rounded focus:outline-none focus:border-blue-500 resize-y min-h-[60px]"
          />
        </div>
        <div className="mb-3">
          <label className="block text-[11px] text-neutral-500 mb-1">结尾评论</label>
          <textarea
            value={config.script.ending}
            onChange={(e) => onConfigChange({ script: { ...config.script, ending: e.target.value } })}
            placeholder="显示在统计卡片底部..."
            className="w-full p-2 bg-neutral-700 border border-neutral-600 text-neutral-100 text-xs rounded focus:outline-none focus:border-blue-500 resize-y min-h-[60px]"
          />
        </div>
      </div>

      {/* 封面选择 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-neutral-400 mb-2 pb-1.5 border-b border-neutral-700">
          封面选择
        </div>
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
          {allSongs.length === 0 ? (
            <div className="text-[11px] text-neutral-500 p-2">请先选择日期</div>
          ) : (
            candidates.map((s) => (
              <div
                key={s.bvid}
                onClick={() => handleCoverSelect(s)}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                  config.cover?.bvid === s.bvid
                    ? "bg-blue-900/30 border-2 border-blue-400"
                    : "bg-neutral-800 border-2 border-transparent hover:bg-neutral-700"
                }`}
              >
                <img
                  src={s.image_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-12 h-7 object-cover rounded bg-neutral-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] truncate">{s.title || s.name}</div>
                  <div className="text-[9px] text-neutral-500">{s.reason}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ED 配置 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-neutral-400 mb-2 pb-1.5 border-b border-neutral-700">
          ED 配置
        </div>
        <div className="mb-3">
          <label className="block text-[11px] text-neutral-500 mb-1">BV号</label>
          <input
            type="text"
            value={config.ed.bvid}
            onChange={(e) => onConfigChange({ ed: { ...config.ed, bvid: e.target.value } })}
            placeholder="BV1xxxxxxxxx"
            className="w-full p-2 bg-neutral-700 border border-neutral-600 text-neutral-100 text-xs rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-3">
          <label className="block text-[11px] text-neutral-500 mb-1">歌曲名称</label>
          <input
            type="text"
            value={config.ed.name}
            onChange={(e) => onConfigChange({ ed: { ...config.ed, name: e.target.value } })}
            placeholder="ED歌曲名称"
            className="w-full p-2 bg-neutral-700 border border-neutral-600 text-neutral-100 text-xs rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-3">
          <label className="block text-[11px] text-neutral-500 mb-1">作者</label>
          <input
            type="text"
            value={config.ed.author}
            onChange={(e) => onConfigChange({ ed: { ...config.ed, author: e.target.value } })}
            placeholder="ED作者"
            className="w-full p-2 bg-neutral-700 border border-neutral-600 text-neutral-100 text-xs rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onSave}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
        >
          保存配置
        </button>
      </div>
    </div>
  )
}