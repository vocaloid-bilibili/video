import type { Song } from "../../types/editor"

// SongDetailBar - 歌曲详情栏
interface SongDetailBarProps {
  song: Song | null
}

export function SongDetailBar({ song }: SongDetailBarProps) {
  if (!song) return null

  const title = song.title || song.name || "-"
  const bvid = song.bvid || "-"
  const author = song.author || song.uploader || "-"
  const vocal = song.vocal || "-"

  return (
    <div className="px-5 py-2.5 bg-neutral-800 border-b border-neutral-700 flex items-center gap-4 shrink-0">
      <span className="text-sm font-semibold text-neutral-100 max-w-[400px] truncate">
        {title}
      </span>
      <div className="flex gap-3 text-xs text-neutral-400">
        <span>{bvid}</span>
        <span>{author}</span>
        <span>{vocal}</span>
      </div>
      <a
        href={`https://www.bilibili.com/video/${song.bvid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto text-blue-400 hover:underline text-xs"
      >
        在B站打开
      </a>
    </div>
  )
}