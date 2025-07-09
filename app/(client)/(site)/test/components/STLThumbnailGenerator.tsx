import React, { useState } from 'react'
import { Button, Upload, Input, Space, Card } from 'antd'
import { UploadOutlined, PictureOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { generateSTLThumbnail } from '@/lib/stl'

interface STLThumbnailGeneratorProps {
  thumbnailSize?: number
  aspectRatio?: number
  className?: string
}

const STLThumbnailGenerator: React.FC<STLThumbnailGeneratorProps> = ({
  thumbnailSize = 256,
  aspectRatio = 4 / 3,
  className = ''
}) => {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleGenerate = async () => {
    // 判断使用文件还是URL
    if (selectedFile) {
      await generateFromFile(selectedFile)
    } else if (urlInput.trim()) {
      await generateFromUrl(urlInput.trim())
    } else {
      console.warn('Please select a file or enter a URL')
    }
  }

  const generateFromFile = async (file: File) => {
    try {
      setLoading(true)
      setProgress(0)
      setThumbnail(null)

      const result = await generateSTLThumbnail(
        file,
        thumbnailSize,
        aspectRatio,
        progressValue => {
          setProgress(progressValue)
        }
      )

      if (result) {
        setThumbnail(result)
        console.log('STL thumbnail generated successfully!')
      } else {
        console.warn('File is not a valid STL file')
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const generateFromUrl = async (url: string) => {
    try {
      setLoading(true)
      setProgress(0)
      setThumbnail(null)

      const result = await generateSTLThumbnail(
        url,
        thumbnailSize,
        aspectRatio,
        progressValue => {
          setProgress(progressValue)
        }
      )

      if (result) {
        setThumbnail(result)
        console.log('STL thumbnail generated successfully!')
      } else {
        console.warn('URL does not point to a valid STL file')
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const handleUploadChange = (info: any) => {
    setFileList(info.fileList.slice(-1)) // Keep only the last file

    // 由于我们阻止了自动上传，直接使用最新的文件
    if (info.fileList.length > 0) {
      const latestFile = info.fileList[info.fileList.length - 1]
      const file = latestFile.originFileObj || latestFile
      if (file instanceof File) {
        setSelectedFile(file)
        setUrlInput('') // 清空URL输入
      }
    } else {
      setSelectedFile(null)
    }
  }

  const beforeUpload = (file: File) => {
    const isSTL = file.name.toLowerCase().endsWith('.stl')
    if (!isSTL) {
      console.warn('Please select a STL file!')
      return false
    }

    // 不限制文件大小，允许上传
    return false // Prevent automatic upload
  }

  const handleReset = () => {
    setThumbnail(null)
    setUrlInput('')
    setFileList([])
    setSelectedFile(null)
    setProgress(0)
  }

  // 获取按钮文本
  const getButtonText = () => {
    if (loading) {
      return `Generating... ${Math.round(progress)}%`
    }
    return 'Generate Thumbnail'
  }

  return (
    <div className={`w-full ${className}`}>
      <Card
        title="STL Thumbnail Generator"
        extra={
          <Button onClick={handleReset} size="small">
            Reset
          </Button>
        }
      >
        <Space direction="vertical" size="large" className="w-full">
          {/* File Upload Section */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload STL File
            </h4>
            <Upload
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={beforeUpload}
              accept=".stl"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />} size="small">
                Select STL File
              </Button>
            </Upload>
          </div>

          {/* URL Input Section */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Or Enter STL URL
            </h4>
            <Input
              placeholder="https://example.com/model.stl"
              value={urlInput}
              onChange={e => {
                setUrlInput(e.target.value)
                if (e.target.value.trim()) {
                  setSelectedFile(null) // 清空文件选择
                  setFileList([])
                }
              }}
              size="small"
            />
          </div>

          {/* Current Selection Display */}
          {(selectedFile || urlInput.trim()) && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
              <strong>Selected:</strong>{' '}
              {selectedFile
                ? `File: ${selectedFile.name}`
                : `URL: ${urlInput.trim()}`}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              type="primary"
              onClick={handleGenerate}
              disabled={!selectedFile && !urlInput.trim()}
              loading={loading}
              size="small"
            >
              {getButtonText()}
            </Button>
          </div>

          {/* Progress Display */}
          {loading && (
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>生成进度</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail Display */}
          {thumbnail && !loading && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Generated Thumbnail ({thumbnailSize}x
                {Math.round(thumbnailSize / aspectRatio)})
              </h4>
              <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                <img
                  src={thumbnail}
                  alt="STL Thumbnail"
                  className="max-h-64 max-w-full rounded shadow-md"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <PictureOutlined className="mr-1" />
                White model thumbnail in PNG Base64 format, ready to use
              </div>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <strong>Usage:</strong>
            <br />
            1. Select a STL file OR enter a STL URL
            <br />
            2. Click "Generate Thumbnail" button
            <br />
            3. View the generated white model thumbnail below
            <br />
            <strong>Features:</strong>
            <br />
            • White model with custom background color
            <br />
            • Automatic optimal viewing angle selection
            <br />
            • Subtle shadows and balanced lighting
            <br />• Configurable aspect ratio (default 4:3)
            <br />• Real-time progress feedback
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default STLThumbnailGenerator
