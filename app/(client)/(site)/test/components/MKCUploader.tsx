'use client'

import React, { useState, useRef, ChangeEvent } from 'react'
import {
  Upload,
  FileText,
  Package,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  parseMKCFile,
  validateMKCFile,
  getMKCFileList,
  type MKCParseResult,
  type MKCParseOptions
} from '@/lib/mkc-parser'
import { uploadFileWithPresigned } from '@/api/client/upload'
import { getFileLink } from '@/lib/link'

interface MKCUploaderProps {
  /** 上传路径 */
  path?: string
  /** 文件名配置 */
  fileName?: string | boolean
  /** 目标JSON文件名，默认contourPath.json */
  targetFileName?: string
  /** 最大文件大小（字节），默认50MB */
  maxFileSize?: number
  /** 解析成功回调 */
  onParseSuccess?: (result: MKCParseResult['data']) => void
  /** 上传成功回调 */
  onUploadSuccess?: (
    fileUrl: string,
    parseResult?: MKCParseResult['data']
  ) => void
  /** 错误回调 */
  onError?: (error: string) => void
  /** 是否自动上传文件 */
  autoUpload?: boolean
  /** 自定义样式类名 */
  className?: string
}

interface UploadState {
  isUploading: boolean
  isParsing: boolean
  isValidating: boolean
  uploadProgress: number
}

export default function MKCUploader({
  path = 'mkc-files',
  fileName,
  targetFileName = 'contourPath.json',
  maxFileSize = 50 * 1024 * 1024, // 50MB
  onParseSuccess,
  onUploadSuccess,
  onError,
  autoUpload = false,
  className
}: MKCUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<MKCParseResult | null>(null)
  const [fileList, setFileList] = useState<string[]>([])
  const [currentTargetFile, setCurrentTargetFile] = useState(targetFileName)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isParsing: false,
    isValidating: false,
    uploadProgress: 0
  })
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setSelectedFile(null)
    setParseResult(null)
    setFileList([])
    setUploadState({
      isUploading: false,
      isParsing: false,
      isValidating: false,
      uploadProgress: 0
    })
  }

  const handleFileSelection = async (file: File) => {
    console.log('选择文件:', file.name, file.size)

    // 验证文件大小
    if (file.size > maxFileSize) {
      const errorMsg = `文件大小超过限制，最大允许 ${formatFileSize(maxFileSize)}`
      onError?.(errorMsg)
      return
    }

    setSelectedFile(file)
    setParseResult(null)
    setFileList([])

    // 1. 验证文件格式
    setUploadState(prev => ({ ...prev, isValidating: true }))

    const validation = await validateMKCFile(file)

    setUploadState(prev => ({ ...prev, isValidating: false }))

    if (!validation.success || !validation.isValid) {
      const errorMsg = validation.message || '不支持的文件格式'
      onError?.(errorMsg)
      return
    }

    // 2. 获取文件列表
    const fileListResult = await getMKCFileList(file)
    if (fileListResult.success && fileListResult.files) {
      setFileList(fileListResult.files)
      console.log('文件列表:', fileListResult.files)
    }

    // 3. 解析MKC文件
    await handleParseFile(file, currentTargetFile)
  }

  const handleParseFile = async (file: File, targetFile: string) => {
    setUploadState(prev => ({ ...prev, isParsing: true }))

    const parseOptions: MKCParseOptions = {
      targetFileName: targetFile
    }

    const result = await parseMKCFile(file, parseOptions)

    setUploadState(prev => ({ ...prev, isParsing: false }))
    setParseResult(result)

    if (result.success && result.data) {
      console.log('MKC解析成功:', result.data)
      onParseSuccess?.(result.data)

      // 如果启用自动上传，则立即上传文件
      if (autoUpload) {
        handleUpload(file, result.data)
      }
    } else {
      console.error('MKC解析失败:', result.message)
      onError?.(result.message)
    }
  }

  const handleTargetFileChange = async (newTargetFile: string) => {
    setCurrentTargetFile(newTargetFile)
    if (selectedFile && fileList.length > 0) {
      await handleParseFile(selectedFile, newTargetFile)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleUpload = async (
    file: File = selectedFile!,
    parseData?: MKCParseResult['data']
  ) => {
    if (!file) return

    setUploadState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }))

    try {
      console.log('开始上传MKC文件:', file.name)

      const response = await uploadFileWithPresigned(file, {
        path,
        fileName: typeof fileName === 'string' ? fileName : file.name,
        maxFileSize,
        onProgress: (progress: number) => {
          setUploadState(prev => ({ ...prev, uploadProgress: progress }))
        }
      })

      if (response.success && response.key) {
        // 使用统一的链接处理函数构建文件URL
        const fileUrl = getFileLink(response.key)

        if (fileUrl) {
          console.log('MKC文件上传成功:', fileUrl)
          onUploadSuccess?.(fileUrl, parseData || parseResult?.data)
        } else {
          throw new Error('生成文件链接失败')
        }

        // 延迟重置状态，让用户看到完成状态
        setTimeout(() => {
          resetState()
        }, 1500)
      } else {
        throw new Error(response.error || '上传失败')
      }
    } catch (error) {
      console.error('MKC文件上传失败:', error)
      const errorMsg =
        error instanceof Error ? error.message : '上传过程中发生错误'
      onError?.(errorMsg)
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0
      }))
    }
  }

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const isProcessing =
    uploadState.isUploading || uploadState.isParsing || uploadState.isValidating

  return (
    <div className={cn('mx-auto w-full max-w-2xl space-y-4', className)}>
      {/* 文件选择区域 */}
      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              'rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary hover:bg-primary/5',
              isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mkc,.zip"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Package className="h-8 w-8 text-primary" />
              </div>

              <div>
                <p className="text-lg font-medium">
                  {selectedFile ? '重新选择MKC文件' : '选择MKC文件'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  拖拽文件到此处或点击选择 (.mkc, .zip)
                  <br />
                  最大文件大小: {formatFileSize(maxFileSize)}
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                  <Badge variant="outline">
                    {formatFileSize(selectedFile.size)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 目标文件选择 */}
      {fileList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">选择要解析的JSON文件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-file">目标文件名</Label>
              <Input
                id="target-file"
                value={currentTargetFile}
                onChange={e => setCurrentTargetFile(e.target.value)}
                placeholder="请输入要查找的JSON文件名"
                disabled={isProcessing}
              />
              <Button
                onClick={() => handleTargetFileChange(currentTargetFile)}
                disabled={isProcessing || !selectedFile}
                size="sm"
                variant="outline"
              >
                重新解析
              </Button>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">
                可用文件 ({fileList.length} 个):
              </h4>
              <div className="max-h-32 overflow-auto rounded-md bg-muted p-3">
                {fileList.map((fileName, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-background/50',
                      fileName.toLowerCase().includes('.json') &&
                        'bg-primary/10'
                    )}
                    onClick={() => setCurrentTargetFile(fileName)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span className="font-mono text-xs">{fileName}</span>
                    </div>
                    {fileName.toLowerCase().includes('.json') && (
                      <Badge variant="secondary" className="text-xs">
                        JSON
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 处理状态显示 */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader className="h-5 w-5 animate-spin" />
              <div className="flex-1">
                {uploadState.isValidating && (
                  <p className="text-sm">正在验证文件格式...</p>
                )}
                {uploadState.isParsing && (
                  <p className="text-sm">
                    正在解析目标文件: {currentTargetFile}
                  </p>
                )}
                {uploadState.isUploading && (
                  <div>
                    <p className="mb-2 text-sm">正在上传文件...</p>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadState.uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {uploadState.uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 解析结果显示 */}
      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {parseResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  解析结果
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  解析失败
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parseResult.success && parseResult.data ? (
              <>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    成功解析文件:{' '}
                    <strong>{parseResult.data.jsonFileName}</strong>
                  </AlertDescription>
                </Alert>

                {/* JSON内容预览 */}
                <div>
                  <h4 className="mb-2 font-medium">JSON内容预览:</h4>
                  <div className="max-h-40 overflow-auto rounded-md bg-muted p-3 font-mono text-sm">
                    <pre>
                      {JSON.stringify(parseResult.data.jsonContent, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* 文件统计 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">总文件数:</span>
                    <span className="ml-2 font-medium">
                      {parseResult.data.allFiles.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">JSON配置项:</span>
                    <span className="ml-2 font-medium">
                      {Object.keys(parseResult.data.jsonContent).length}
                    </span>
                  </div>
                </div>

                {/* 上传按钮 */}
                {!autoUpload && !uploadState.isUploading && (
                  <Button
                    onClick={() => handleUpload()}
                    className="w-full"
                    disabled={!selectedFile}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    上传MKC文件
                  </Button>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
