import { toast } from "sonner"
import type { Song, SongsData } from "../../types/editor"
import { getGroupLabel } from "../../utils"


// SongListContent - 歌曲列表内容
interface SongListContentProps {
  songs: SongsData
  selectedBvid: string | null
  onSelectSong: (bvid: string) => void
}

export function SongListContent({ songs, selectedBvid, onSelectSong }: SongListContentProps) {
  const renderGroup = (list: Song[], title: string) => {
    if (!list || !list.length) return null
    return (
      <div key={title}>
        <div className="px-3 py-2 bg-neutral-900 text-[11px] text-neutral-500 uppercase tracking-wide sticky top-0">
          {title}
        </div>
        {list.map((s) => (
          <div
            key={s.bvid}
            onClick={() => onSelectSong(s.bvid)}
            className={`px-3 py-2.5 border-b border-neutral-800 cursor-pointer flex items-center gap-2.5 transition-colors ${
              selectedBvid === s.bvid
                ? "bg-neutral-700 border-l-[3px] border-l-blue-400"
                : s._clip
                  ? "border-l-[3px] border-l-green-500 hover:bg-neutral-800"
                  : "hover:bg-neutral-800 border-l-[3px] border-l-transparent"
            }`}
          >
            <div className="bg-neutral-700 rounded flex items-center justify-center text-xs font-semibold shrink-0 w-6 h-6">
              {s.rank}
            </div>
            <div className="text-indent-4 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[13px] text-neutral-100 truncate flex-1 min-w-0"
                  title={s.title || s.name}
                >
                  {s.title || s.name}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
                <span
                  className="font-mono text-[10px] hover:text-blue-400 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(s.bvid)
                    toast.success(`已复制 ${s.bvid}`)
                  }}
                  title="点击复制"
                >
                  {s.bvid}
                </span>
                {" · "}
                {s.author || s.vocal || s.uploader || "Unknown"}
              </div>
            </div>
            <div
              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                s._videoExists ? "bg-green-900 text-green-400" : "bg-neutral-700 text-neutral-500"
              }`}
            >
              {s._videoExists ? "OK" : "--"}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const isEmpty = Object.values(songs).every((list) => !list || list.length === 0)

  if (isEmpty) {
    return (
      <div className="p-10 text-center text-neutral-500">请先选择日期</div>
    )
  }

  return (
    <>
      {Object.entries(songs).map(([cardComponent, songList]) => {
        const label = getGroupLabel(cardComponent)
        const title = songList.length > 0 ? `${label} Top ${songList.length}` : label
        return renderGroup(songList, title)
      })}
    </>
  )
}