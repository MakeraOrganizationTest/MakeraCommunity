import React from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
  pageSizeOptions?: number[];
}

/**
 * 表格分页组件
 */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className = '',
  pageSizeOptions = [10, 15, 20, 50, 100]
}: TablePaginationProps) {
  // 计算总页数
  const totalPages = Math.ceil(total / pageSize) || 1;
  
  // 计算显示的分页项
  const getPageItems = () => {
    const items: (number | 'ellipsis')[] = [];
    
    // 如果总页数小于等于5，直接显示所有页
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
      return items;
    }
    
    // 始终显示第一页
    items.push(1);
    
    // 计算中间页
    if (page <= 3) {
      // 如果当前页靠近开始
      items.push(2, 3);
      if (totalPages > 4) {
        items.push('ellipsis');
      }
    } else if (page >= totalPages - 2) {
      // 如果当前页靠近结尾
      if (totalPages > 4) {
        items.push('ellipsis');
      }
      items.push(totalPages - 2, totalPages - 1);
    } else {
      // 当前页在中间
      items.push('ellipsis', page - 1, page, page + 1, 'ellipsis');
    }
    
    // 始终显示最后一页（如果不是只有一页）
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  };
  
  // 计算当前页项信息文字
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const pageInfoText = total > 0 
    ? `${startItem}-${endItem} / ${total}`
    : '0 records';

  return (
    <div className={`w-full flex flex-col sm:flex-row items-center justify-between gap-2 ${className}`}>
      <div className="min-w-[200px] flex items-center text-xs text-muted-foreground">
        {pageInfoText}
        <div className="flex items-center ml-2 space-x-1">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-7 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">/ page</p>
        </div>
      </div>
      
      <Pagination className="flex justify-center sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) onPageChange(page - 1);
              }}
              className={`h-7 text-xs ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
            />
          </PaginationItem>
          
          {getPageItems().map((item, index) => 
            item === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis className="h-7" />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(item);
                  }}
                  isActive={item === page}
                  className="h-7 w-7 text-xs"
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          
          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                if (page < totalPages) onPageChange(page + 1);
              }}
              className={`h-7 text-xs ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
} 