import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ApiResponse } from '@/lib/server/types';

// 分页参数类型
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 基础请求参数类型
export interface BaseQueryParams extends PaginationParams {
  searchTerm?: string;
  [key: string]: any;
}

// 基础响应类型
export interface BaseResponse<T = any> extends ApiResponse<{
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
  message?: string;
}> {}

// 表格列配置
export interface ColumnDef<T = any> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  render?: (value: any, row: T) => React.ReactNode;
  accessorKey?: string;
  hideOnMobile?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
}

// 表格行操作
export interface RowAction<T = any> {
  icon?: LucideIcon | string;
  label: string;
  operation: string;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  className?: string;
  hideOn?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  isLoading?: (id: string | number) => boolean;
  tooltip?: string | boolean;
}

// 表格筛选器配置
export interface TableFilter {
  type: 'search' | 'select' | 'date' | 'checkbox';
  placeholder?: string;
  label?: string;
  key: string;
  value: any;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: any) => void;
}

// 表格头部操作按钮
export interface HeaderAction {
  icon?: LucideIcon | React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'secondary';
  className?: string;
  disabled?: boolean;
  tooltip?: string | boolean;
  showLabelOnMobile?: boolean;
}

// 数据表格属性
export interface CustomTableProps<T = any> {
  // 数据相关
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  
  // 标识字段
  idField?: string;
  
  // 分页相关
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  onPaginationChange?: (params: { page: number; pageSize: number }) => void;
  
  // 筛选相关
  filters?: TableFilter[];
  
  // 行操作相关
  rowActions?: RowAction<T>[];
  onRowAction?: (operation: string, id: any, row: T) => void;
  
  // 表格头部配置
  header?: {
    title?: string;
    description?: string;
    actions?: HeaderAction[];
  };
  
  // 自定义渲染
  renderEmpty?: (filters: any) => React.ReactNode;
  emptyStateMessage?: string;
  hideHeader?: boolean;
}

// 操作状态类型
export interface OperationStates {
  getLoadingId: (operation: string) => string | number | null;
  setLoadingId: (operation: string, id: string | number | null) => void;
}

// 自定义Hook返回值类型
export interface UseCustomTableReturn<T = any, P = BaseQueryParams> {
  data: T[];
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  filters: P;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (filters: Partial<P>) => void;
  operationStates: OperationStates;
}

// 自定义Hook参数类型
export interface UseCustomTableOptions<T = any, P = BaseQueryParams, R = any> {
  fetchData: (params: P) => Promise<R>;
  defaultParams: P;
  transformResponse?: (response: R) => { data: T[]; total: number };
} 