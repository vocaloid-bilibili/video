import { useEffect, useRef } from "react"

interface RepairDialogProps {
  isOpen: boolean
  target: string
  onClose: () => void
  onConfirm: () => void
}

export function RepairDialog({ isOpen, target, onClose, onConfirm }: RepairDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="border-none p-0 rounded-xl shadow-2xl max-w-md backdrop:bg-black/50"
    >
      <div className="p-6">
        <h3 className="text-base font-semibold mb-3 text-foreground">重新渲染分片</h3>
        <p className="text-[13px] text-muted-foreground mb-5">目标: {target}</p>
        <div className="flex justify-end gap-2.5">
          <button
            className="px-3 py-2 border border-border bg-background text-[12px] text-foreground rounded-md transition-colors hover:bg-accent hover:border-accent"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-3 py-2 bg-primary text-primary-foreground border-primary rounded-md transition-colors hover:bg-primary/90 text-[12px]"
            onClick={handleConfirm}
          >
            确认
          </button>
        </div>
      </div>
    </dialog>
  )
}
