import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiResponse } from '@/lib/server/types'
import {
  UseCustomTableOptions,
  UseCustomTableReturn,
  BaseQueryParams,
  BaseResponse
} from '../types'

/**
 * 自定义Hook，用于处理表格数据、分页、筛选和操作状态
 */
export function useCustomTable<
  T = any,
  P extends BaseQueryParams = BaseQueryParams,
  R = any
>(options: UseCustomTableOptions<T, P, R>): UseCustomTableReturn<T, P> {
  const { fetchData, defaultParams, transformResponse } = options

  // 状态管理
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [params, setParams] = useState<P>(defaultParams)
  const [total, setTotal] = useState(0)

  // 操作加载状态管理 - 使用useState
  const [loadingMap, setLoadingMap] = useState<
    Record<string, string | number | null>
  >({})

  // 操作状态管理
  const operationStates = {
    getLoadingId: (operation: string) => loadingMap[operation],
    setLoadingId: (operation: string, id: string | number | null) => {
      setLoadingMap(prev => ({
        ...prev,
        [operation]: id
      }))
    }
  }

  // 获取数据函数
  const fetchTableData = async () => {
    try {
      setLoading(true)
      const response = await fetchData(params)

      let newData: T[] = []
      let newTotal = 0

      if (transformResponse) {
        // 使用自定义转换
        const transformed = transformResponse(response)
        newData = transformed.data
        newTotal = transformed.total
      } else {
        // 尝试处理不同的响应格式
        const apiResponse = response as unknown as ApiResponse<any>

        if (
          apiResponse &&
          apiResponse.data &&
          typeof apiResponse.data === 'object'
        ) {
          // 处理标准API格式
          const responseData = apiResponse.data
          if (responseData.data && Array.isArray(responseData.data)) {
            newData = responseData.data
            newTotal = responseData.total || 0
          } else if (Array.isArray(responseData)) {
            // 直接处理数组数据
            newData = responseData
            newTotal = apiResponse.data.total || 0
          }
        }
      }

      setData(newData)
      setTotal(newTotal)
    } catch (error) {
      console.error('Failed to fetch table data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和参数变化时重新获取数据
  useEffect(() => {
    fetchTableData()
  }, [params])

  // 设置页码
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }))
  }, [])

  // 设置每页数量
  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])

  // 设置筛选条件
  const setFilters = useCallback((filters: Partial<P>) => {
    setParams(prev => ({ ...prev, ...filters, page: 1 }))
  }, [])

  // 手动刷新数据
  const refresh = useCallback(() => {
    return fetchTableData()
  }, [fetchTableData])

  return {
    data,
    loading,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total
    },
    filters: params,
    refresh,
    setPage,
    setPageSize,
    setFilters,
    operationStates
  }
}
