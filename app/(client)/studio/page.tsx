'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { EditorMain } from '@/components/editor/editor3d/main/editorMain'
import './studio.scss'

var timer: any = null

export default function Studio() {
  const mainRef = useRef<any>(null)
  const [stlUrl, setStlUrl] = useState<string | null | void>()

  const loadFile = useCallback(() => {
    if (mainRef?.current) {
      if (timer !== null && timer !== undefined) clearTimeout(timer)

      if (stlUrl) {
        mainRef?.current?.loadStlFile({ stlUrl })
        return
      }
    }
  }, [stlUrl])

  useEffect(() => {
    setStlUrl(null)
  }, [])

  return (
    <div
      id="contentId"
      className="StudioLayout"
      style={{
        background: '#030712'
      }}
    >
      <EditorMain
        ref={mainRef}
        onLoad={() => {
          if (mainRef.current) {
            loadFile()
          }
        }}
      />
    </div>
  )
}
