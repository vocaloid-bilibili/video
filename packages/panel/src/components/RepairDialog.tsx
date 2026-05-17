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
    <dialog ref={dialogRef} onClick={(e) => e.target === dialogRef.current && onClose()}>
      <div className="dialog-content">
        <h3>重新渲染分片</h3>
        <p>目标: {target}</p>
        <div className="dialog-actions">
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            确认
          </button>
        </div>
      </div>
    </dialog>
  )
}
