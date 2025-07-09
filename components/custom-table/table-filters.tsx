import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { TableFilter } from './types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import useDebounce from '@/hooks/use-debounce';

interface TableFiltersProps {
  filters: TableFilter[];
  className?: string;
}

/**
 * 表格筛选组件
 */
export function TableFilters({ filters, className = '' }: TableFiltersProps) {
  // 为所有搜索筛选器维护状态
  const [searchStates, setSearchStates] = useState<Record<string, string>>({});
  
  // 初始化标志，防止重复初始化
  const initialized = useRef(false);
  
  // 初始化搜索状态，只在第一次渲染时执行
  useEffect(() => {
    if (!initialized.current) {
      const initialStates: Record<string, string> = {};
      filters.forEach(filter => {
        if (filter.type === 'search') {
          initialStates[filter.key] = filter.value?.toString() || '';
        }
      });
      if (Object.keys(initialStates).length > 0) {
        setSearchStates(initialStates);
      }
      initialized.current = true;
    }
  }, []);
  
  // 对所有搜索状态应用防抖
  const debouncedSearchStates = useDebounce(searchStates, 500);
  
  // 跟踪上一次处理过的防抖状态
  const prevDebouncedStatesRef = useRef<Record<string, string>>({});
  
  // 当防抖状态变化时触发对应的 onChange
  useEffect(() => {
    // 确保有状态且防抖值已更新
    if (debouncedSearchStates && Object.keys(debouncedSearchStates).length > 0) {
      filters.forEach(filter => {
        if (filter.type === 'search' && 
            debouncedSearchStates[filter.key] !== undefined && 
            filter.onChange && 
            debouncedSearchStates[filter.key] !== prevDebouncedStatesRef.current[filter.key]) {
          filter.onChange(debouncedSearchStates[filter.key]);
        }
      });
      // 更新上一次处理的状态
      prevDebouncedStatesRef.current = {...debouncedSearchStates};
    }
  }, [debouncedSearchStates]);
  
  // 搜索筛选器处理函数
  const handleSearchChange = (key: string, value: string) => {
    setSearchStates(prev => ({ ...prev, [key]: value }));
  };
  
  // 渲染单个筛选器
  const renderFilter = (filter: TableFilter) => {
    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.key} className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={filter.placeholder || 'Search...'}
              className="pl-8"
              value={searchStates[filter.key] || ''}
              onChange={(e) => handleSearchChange(filter.key, e.target.value)}
            />
          </div>
        );
        
      case 'select':
        return (
          <div key={filter.key} className="min-w-[160px] w-full sm:w-auto">
            {filter.label && (
              <label className="text-sm font-medium mb-1 block text-muted-foreground sm:hidden">
                {filter.label}
              </label>
            )}
            <Select
              value={filter.value?.toString() || ''}
              onValueChange={(value) => filter.onChange(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={filter.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={filter.key} className="flex items-center space-x-2">
            <Checkbox
              id={filter.key}
              checked={!!filter.value}
              onCheckedChange={(checked) => filter.onChange(!!checked)}
            />
            {filter.label && (
              <label
                htmlFor={filter.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {filter.label}
              </label>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (!filters || filters.length === 0) return null;
  
  return (
    <div className={`w-full flex flex-col sm:flex-row gap-4 items-start sm:items-center ${className}`}>
      {filters.map(filter => renderFilter(filter))}
    </div>
  );
} 