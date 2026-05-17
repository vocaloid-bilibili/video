"use client"

/**
 * HomePage - 排行榜合成控制台主页面
 * 
 * 功能概述:
 * - 展示文件列表并支持上传
 * - 按日期选择和展示视频片段
 * - 显示处理状态和实时日志
 * - 提供片段修复和编辑器跳转功能
 */

import { useEffect, useState, useCallback } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"
import { api } from "../api"
import type { StatusInfo } from "../api"
import type { FileInfo } from "../types/editor"
import { FilePanel } from "../components/home/FilePanel"
import { SegmentPanel } from "../components/home/SegmentPanel"
import type { StatusType } from "../components/home/StatusCard"
import { StatusCard } from "../components/home/StatusCard"
import type { LogEntry } from "../components/home/LogTerminal"
import { LogTerminal, parseLog } from "../components/home/LogTerminal"
import { RepairDialog } from "../components/home/RepairDialog"

export default function HomePage() {
  // ==================== 状态定义 ====================
  
  /** 文件列表数据 */
  const [files, setFiles] = useState<FileInfo[]>([])
  
  /** 文件列表加载状态，初始为 true 表示正在加载 */
  const [filesLoading, setFilesLoading] = useState(true)
  
  /** 当前选中的日期，用于筛选片段 */
  const [selectedDate, setSelectedDate] = useState("")
  
  /** 指定日期下的视频片段列表 */
  const [segments, setSegments] = useState<string[]>([])
  
  /** 片段列表加载状态 */
  const [segmentsLoading, setSegmentsLoading] = useState(false)
  
  /** 后端处理状态信息，包含状态类型、目标日期、进度、步骤等 */
  const [status, setStatus] = useState<StatusInfo>({ status: "idle" })
  
  /** 解析后的日志条目列表 */
  const [logs, setLogs] = useState<LogEntry[]>([])
  
  /** 修复对话框的目标文件名 */
  const [repairTarget, setRepairTarget] = useState("")
  
  /** 修复对话框是否打开 */
  const [repairDialogOpen, setRepairDialogOpen] = useState(false)

  // ==================== 回调函数定义 ====================

  /**
   * 加载文件列表
   * 通过 API 获取文件数据并更新状态
   */
  const loadFiles = useCallback(async () => {
    const { files: filesData } = await api.getFiles()
    setFiles(filesData)
    setFilesLoading(false)
  }, [])

  /**
   * 加载指定日期的视频片段
   * @param date - 要查询的日期字符串
   * 如果日期为空则清空片段列表
   */
  const loadSegments = useCallback(async (date: string) => {
    if (!date) {
      setSegments([])
      return
    }
    setSegmentsLoading(true)
    const { segments: segmentsData } = await api.getSegments(date)
    setSegments(segmentsData)
    setSegmentsLoading(false)
  }, [])

  /**
   * 上传文件
   * @param filesToUpload - 要上传的文件列表
   * 上传成功后显示提示并刷新文件列表
   */
  const uploadFiles = useCallback(async (filesToUpload: File[]) => {
    const data = await api.uploadFiles(filesToUpload)
    toast.success(`上传成功: ${data.files.join(", ")}`)
    loadFiles()
  }, [loadFiles])

  /**
   * 处理合并操作
   * @param date - 要合并的日期
   * 弹出确认对话框，用户确认后触发后端合并任务
   */
  const handleMerge = useCallback(async (date: string) => {
    if (!confirm("确认合并?")) return
    await api.triggerMerge(date)
    toast.success("合并任务已启动")
  }, [])

  /**
   * 跳转到编辑器
   * @param date - 要编辑的日期
   * 调用 API 导航到编辑器页面
   */
  const handleStart = useCallback((date: string) => {
    api.navigateToEditor(date)
  }, [])

  /**
   * 处理日期变更
   * @param date - 新的日期值
   * 使用 flushSync 确保状态同步更新，然后加载对应日期的片段
   */
  const handleDateChange = useCallback((date: string) => {
    flushSync(() => {
      setSelectedDate(date)
    })
    loadSegments(date)
  }, [loadSegments])

  /**
   * 处理下载（已弃用）
   * 下载功能已由 <a> 标签直接处理，此回调保留为空实现
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDownload = useCallback((_filename: string) => {
    // Already handled by <a> tag
  }, [])

  /**
   * 打开修复对话框
   * @param filename - 要修复的文件名
   * 设置目标文件并打开修复对话框
   */
  const handleRepair = useCallback((filename: string) => {
    setRepairTarget(filename)
    setRepairDialogOpen(true)
  }, [])

  /**
   * 确认修复操作
   * 根据文件名格式构建不同的修复载荷并发送到后端
   * 支持两种格式：
   * 1. 标准格式: { date, segmentName }
   * 2. 排行榜格式: { date, type, rank } (匹配 rank_new_*.mp4 或 rank_main_*.mp4)
   */
  const confirmRepair = useCallback(async () => {
    if (!selectedDate || !repairTarget) return

    // 默认载荷：使用 segmentName 格式
    let payload: Parameters<typeof api.repairSegment>[0] = {
      date: selectedDate,
      segmentName: repairTarget,
    }

    // 尝试匹配排行榜格式的文件名
    const match = repairTarget.match(/rank_(new|main)_(\d+)\.mp4/)
    if (match) {
      // 匹配成功，使用排行榜格式载荷
      payload = {
        date: selectedDate,
        type: match[1],   // "new" 或 "main"
        rank: parseInt(match[2]), // 排名数字
      }
    }

    await api.repairSegment(payload)
    toast.success("指令已发送")
  }, [selectedDate, repairTarget])

  /**
   * 清空日志列表
   */
  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // ==================== 副作用处理 ====================

  /**
   * 初始化加载
   * 组件挂载时延迟加载文件列表
   * 使用 setTimeout 延迟 0ms 确保在 DOM 渲染后执行
   */
  useEffect(() => {
    const id = setTimeout(loadFiles, 0)
    return () => clearTimeout(id)
  }, [loadFiles])

  /**
   * 状态轮询
   * 每秒从后端获取最新状态和日志信息
   * 包含清理函数确保组件卸载时停止轮询
   */
  useEffect(() => {
    let mounted = true  // 组件挂载标志
    let timeoutId: ReturnType<typeof setTimeout>

    const pollStatus = async () => {
      // 获取后端状态
      const statusData = await api.getStatus()
      
      if (mounted) {
        // 更新状态
        setStatus(statusData)

        // 如果有新的日志，解析并更新日志列表
        if (statusData.logs && statusData.logs.length > 0) {
          const parsedLogs = statusData.logs.map(parseLog)
          setLogs(parsedLogs)
        }
      }
      
      // 如果组件仍挂载，继续定时轮询
      if (mounted) {
        timeoutId = setTimeout(pollStatus, 1000)
      }
    }

    // 启动轮询
    pollStatus()
    
    // 清理函数：组件卸载时停止轮询
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // ==================== 渲染 ====================

  return (
    <>
      {/* 页面头部 */}
      <header className="flex items-center justify-between h-12 px-5 border-b border-border bg-background shrink-0">
        <h1 className="text-[15px] font-semibold">排行榜合成控制台</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>在线</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 gap-4 flex">
        {/* 文件面板：展示文件列表，支持上传、刷新、合并、启动编辑 */}
        <FilePanel
          files={files}
          loading={filesLoading}
          onRefresh={loadFiles}
          onUpload={uploadFiles}
          onMerge={handleMerge}
          onStart={handleStart}
        />

        {/* 片段面板：按日期筛选片段，支持下载和修复 */}
        <SegmentPanel
          files={files}
          selectedDate={selectedDate}
          segments={segments}
          loading={segmentsLoading}
          onDateChange={handleDateChange}
          onDownload={handleDownload}
          onRepair={handleRepair}
        />

        {/* 右侧状态区域：状态卡片 + 日志终端 */}
        <div className="flex flex-col gap-4 flex-1">
          <StatusCard
            status={status.status as StatusType}
            targetDate={status.targetDate}
            progress={status.progress}
            step={status.step}
          />

          <LogTerminal logs={logs} onClear={clearLogs} />
        </div>
      </main>

      {/* 修复对话框：确认修复操作 */}
      <RepairDialog
        isOpen={repairDialogOpen}
        target={repairTarget}
        onClose={() => setRepairDialogOpen(false)}
        onConfirm={confirmRepair}
      />
    </>
  )
}
