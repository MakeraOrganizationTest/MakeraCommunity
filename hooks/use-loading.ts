import { useState as useReactState } from 'react'

/**
 * 加载状态钩子
 * @returns 加载状态及控制函数
 */
export function useState(initialState = false) {
  const [loading, setLoading] = useReactState(initialState)

  const startLoading = () => setLoading(true)
  const stopLoading = () => setLoading(false)

  return {
    loading,
    setLoading,
    startLoading,
    stopLoading
  }
}

export default useState
