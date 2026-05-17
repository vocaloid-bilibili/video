
// VideoPlayer - 视频播放器
interface VideoPlayerProps {
  videoUrl: string | null
  isLoading: boolean
  loadingText: string
  onLoadedMetadata?: (duration: number, url: string) => void
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export function VideoPlayer({ videoUrl, isLoading, loadingText, onLoadedMetadata, videoRef }: VideoPlayerProps) {
  return (
    <div className="bg-black flex items-center justify-center h-[380px] min-h-[300px] relative shrink-0">
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full"
          onLoadedMetadata={(e) => onLoadedMetadata?.(e.currentTarget.duration, videoUrl)}
        />
      )}
      {isLoading && (
        <div className="absolute text-neutral-500">{loadingText}</div>
      )}
    </div>
  )
}
