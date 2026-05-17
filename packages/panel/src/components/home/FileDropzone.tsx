"use client"

import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { useState } from "react"

interface FileDropzoneProps {
  onUpload: (files: File[]) => Promise<void>
}

export function FileDropzone({ onUpload }: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/json": [".json"],
    },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return
      setUploading(true)
      setUploadProgress(`上传中... (${acceptedFiles.length} 个文件)`)
      try {
        await onUpload(acceptedFiles)
      } finally {
        setUploading(false)
        setUploadProgress("")
      }
    },
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-6 text-center cursor-pointer mb-3 relative rounded-lg transition-all ${
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.02]"
          : uploading
          ? "pointer-events-none opacity-70 border-border bg-muted"
          : "border-muted-foreground/30 bg-muted/50 hover:border-primary hover:bg-primary/5"
      }`}
    >
      <input {...getInputProps()} />
      <div className="mb-2">
        <Upload size={32} className="mx-auto text-muted-foreground" />
      </div>
      <p className="text-[13px] text-muted-foreground m-0">
        {isDragActive ? "松开以上传文件" : "点击或拖拽 JSON 文件"}
      </p>
      {uploadProgress && (
        <div className="mt-2 text-[12px] text-primary hidden">{uploadProgress}</div>
      )}
      <div className="upload-progress mt-2 text-[12px] text-primary hidden">{uploadProgress}</div>
    </div>
  )
}
