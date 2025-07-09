/*
 * @LastEditTime: 2025-04-10 15:30:06
 * @Description: ...
 * @Date: 2025-04-09 18:32:55
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ActionButtonProps {
  icon?: LucideIcon | React.ReactNode;
  label?: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabelOnMobile?: boolean;
  tooltip?: string | boolean;
}

/**
 * Action Button Component
 */
export function ActionButton({
  icon,
  label,
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'ghost',
  size = 'icon',
  className = '',
  showLabelOnMobile = false,
  tooltip
}: ActionButtonProps) {
  // Render icon
  const Icon = icon as LucideIcon;
  
  // Loading indicator
  const loadingIndicator = (
    <span 
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        size === 'icon' ? 'h-3.5 w-3.5' : 'mr-2 h-4 w-4'
      )}
    />
  );

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(className, size === 'icon' ? 'h-7 w-7' : '')}
    >
      {isLoading ? loadingIndicator : (<Icon className={size === 'icon' ? 'h-3.5 w-3.5' : 'mr-2 h-4 w-4'} />)}
      {label && (size !== 'icon' || showLabelOnMobile) && (
        <span className={cn({
          'hidden sm:inline-block': showLabelOnMobile && size === 'icon'
        })}>
          {label}
        </span>
      )}
      {label && size === 'icon' && <span className="sr-only">{label}</span>}
    </Button>
  );

  // If tooltip is a string and not false, wrap the button with Tooltip component
  if (tooltip && typeof tooltip === 'string') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  // If tooltip is false or not provided, return the button directly
  return buttonContent;
} 