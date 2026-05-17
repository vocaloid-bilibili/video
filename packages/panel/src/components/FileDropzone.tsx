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
      className={`upload-area ${isDragActive ? "dragover" : ""} ${uploading ? "uploading" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="upload-icon">
        <Upload size={32} />
      </div>
      <p>{isDragActive ? "松开以上传文件" : "点击或拖拽 JSON 文件"}</p>
      {uploadProgress && <div className="upload-progress">{uploadProgress}</div>}
    </div>
  )
}
