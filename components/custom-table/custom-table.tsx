import React, { useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { TableFilters } from './table-filters';
import { TablePagination } from './table-pagination';
import { ActionButton } from './action-button';
import { CustomTableProps, RowAction, HeaderAction } from './types';

/**
 * Custom Table Component
 */
export function CustomTable<T extends Record<string, any> = Record<string, any>>({
  data,
  columns,
  loading = false,
  idField = 'id',
  pagination,
  onPaginationChange,
  filters,
  rowActions,
  onRowAction,
  header,
  renderEmpty,
  emptyStateMessage = 'No data found',
  hideHeader = false,
}: CustomTableProps<T>) {
  // Calculate whether to show pagination
  const showPagination = useMemo(() => {
    return pagination && onPaginationChange;
  }, [pagination, onPaginationChange]);

  // Get row unique identifier
  const getRowId = (row: T) => {
    return row[idField];
  };

  // Get cell value
  const getCellValue = (row: T, column: typeof columns[0]) => {
    if (column.cell) {
      return column.cell(row);
    }
    if (column.render) {
      const value = column.accessorKey ? row[column.accessorKey] : row[column.key];
      return column.render(value, row);
    }
    return row[column.key];
  };

  // Render row action buttons
  const renderRowActions = (row: T, actions: RowAction<T>[]) => {
    const id = getRowId(row);
    const visibleActions = actions.filter(action => !action.hideOn || !action.hideOn(row));
    
    if (visibleActions.length === 0) {
      return null;
    }

    // Display desktop version buttons
    const renderDesktopActions = () => (
      <div className="hidden md:flex justify-end md:items-end md:space-x-1">
        {visibleActions.map((action) => {
          const Icon = typeof action.icon === 'string' ? null : action.icon;
          return (
            <ActionButton
              key={action.operation}
              icon={Icon}
              label={action.label}
              variant={action.variant}
              className={action.className}
              onClick={() => onRowAction?.(action.operation, id, row)}
              isLoading={action.isLoading ? action.isLoading(id) : false}
              disabled={action.disabled ? action.disabled(row) : false}
              tooltip={action.tooltip === undefined ? action.label : action.tooltip}
            />
          );
        })}
      </div>
    );

    // Display mobile version dropdown menu
    const renderMobileActions = () => (
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
            {visibleActions.map((action, index) => {
              const Icon = typeof action.icon === 'string' ? null : action.icon;
              const isLoading = action.isLoading ? action.isLoading(id) : false;
              const isDisabled = action.disabled ? action.disabled(row) : false;
              
              return action.operation === 'delete' || action.variant === 'destructive' ? (
                <React.Fragment key={action.operation}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="text-xs text-destructive"
                    onClick={() => onRowAction?.(action.operation, id, row)}
                    disabled={isDisabled || isLoading}
                  >
                    {isLoading ? (
                      <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : Icon ? (
                      <Icon className="mr-2 h-3.5 w-3.5" />
                    ) : null}
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ) : (
                <DropdownMenuItem
                  key={action.operation}
                  className="text-xs"
                  onClick={() => onRowAction?.(action.operation, id, row)}
                  disabled={isDisabled || isLoading}
                >
                  {isLoading ? (
                    <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : Icon ? (
                    <Icon className="mr-2 h-3.5 w-3.5" />
                  ) : null}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );

    return (
      <>
        {renderDesktopActions()}
        {renderMobileActions()}
      </>
    );
  };

  // Render loading state rows
  const renderLoadingRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`loading-${index}`} className="h-10">
        <TableCell colSpan={columns.length + (rowActions && rowActions.length > 0 ? 1 : 0)} className="py-1 px-2">
          <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4"></div>
        </TableCell>
      </TableRow>
    ));
  };

  // Render empty state
  const renderEmptyState = () => {
    if (renderEmpty) {
      return renderEmpty(filters);
    }
    
    return (
      <TableRow>
        <TableCell colSpan={columns.length + (rowActions && rowActions.length > 0 ? 1 : 0)} className="h-16 text-center text-sm">
          {emptyStateMessage}
        </TableCell>
      </TableRow>
    );
  };

  // Render table rows
  const renderRows = () => {
    if (loading) {
      return renderLoadingRows();
    }
    
    if (!data || data.length === 0) {
      return renderEmptyState();
    }

    return data.map((row) => (
      <TableRow key={getRowId(row)} className="h-10 hover:bg-muted/50">
        {columns.map((column) => (
          <TableCell
            key={column.key}
            className={`py-1 px-2 ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
          >
            {getCellValue(row, column)}
          </TableCell>
        ))}
        
        {rowActions && rowActions.length > 0 && (
          <TableCell className="py-1 px-2 text-right">
            {renderRowActions(row, rowActions)}
          </TableCell>
        )}
      </TableRow>
    ));
  };

  // Render header action buttons
  const renderHeaderActions = () => {
    const actions = header?.actions || [];

    if (actions.length === 0) {
      return null;
    }

    return (
      <div className="flex items-center space-x-2">
        {actions.map((action, index) => {
          const Icon = typeof action.icon === 'string' ? null : action.icon;
          
          // For small screens
          const mobileButton = (
            <div key={`mobile-${index}`} className="sm:hidden">
              <ActionButton
                icon={Icon}
                label={action.label}
                variant={action.variant || 'ghost'}
                size="icon"
                className={action.className}
                onClick={action.onClick}
                disabled={action.disabled}
                tooltip={action.tooltip === undefined ? action.label : action.tooltip}
              />
            </div>
          );
          
          // For larger screens
          const desktopButton = (
            <div key={`desktop-${index}`} className="hidden sm:block">
              <ActionButton
                icon={Icon}
                label={action.label}
                variant={action.variant || 'default'}
                size="sm"
                className={action.className}
                onClick={action.onClick}
                disabled={action.disabled}
                tooltip={action.tooltip === undefined ? action.label : action.tooltip}
              />
            </div>
          );
          
          return (
            <React.Fragment key={index}>
              {mobileButton}
              {desktopButton}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full py-4!">
      {!hideHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{header?.title || 'Data Table'}</CardTitle>
            <CardDescription>
              {header?.description || 'Manage and view records in a structured format.'}
            </CardDescription>
          </div>
          
          {renderHeaderActions()}
        </CardHeader>
      )}
      
      <CardContent className="flex-1 p-0">
        {filters && filters.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center px-6 pb-2">
            <TableFilters filters={filters} />
          </div>
        )}
        
        <div className="mx-6 rounded-md border overflow-auto">
          <Table className="text-sm">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="hover:bg-muted/30">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`h-8 px-2 py-1 ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  >
                    {column.header}
                  </TableHead>
                ))}
                
                {rowActions && rowActions.length > 0 && (
                  <TableHead className="h-8 px-2 py-1 text-right">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {renderRows()}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {showPagination && (
        <CardFooter className="w-full flex flex-col sm:flex-row items-center justify-between border-t pt-4! px-4 gap-2">
          <TablePagination
            page={pagination!.page}
            pageSize={pagination!.pageSize}
            total={pagination!.total}
            onPageChange={(page) => onPaginationChange?.({ page, pageSize: pagination!.pageSize })}
            onPageSizeChange={(pageSize) => onPaginationChange?.({ page: 1, pageSize })}
          />
        </CardFooter>
      )}
    </Card>
  );
} 