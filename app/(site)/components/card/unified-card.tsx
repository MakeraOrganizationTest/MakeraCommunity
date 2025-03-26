/*
 * @LastEditTime: 2025-03-26 13:10:00
 * @Description: 统一模型卡片组件 - 支持精选和热门两种风格
 * @Date: 2025-03-26 12:00:00
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Heart, Download, Flame, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// 格式化数字，简化显示
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * 统一模型卡片
 */
export default function UnifiedCard(props: {
  image: string,
  alt: string,
  title: string,
  id: number,
  author: {
    name: string,
    avatar: string,
    id?: string | number
  },
  stats: {
    views: number,
    likes: number,
    downloads: number
  },
  tags?: string[],
  rank?: number,  // 热门模型的排名
  variant?: "featured" | "hot", // 卡片变体: featured(精选) 或 hot(热门)
  horizontalOnMobile?: boolean, // 在移动端是否水平显示
}) {
  // 默认为精选模式
  const variant = props.variant || "featured";
  const isHot = variant === "hot";
  
  // 生成详情页链接
  const detailLink = `/models/${props.id}`;
  
  // 生成作者页面链接
  const authorLink = `/creators/${props.author.id || 'profile'}`;

  return (
    <div className="relative h-full flex flex-col rounded-xl overflow-hidden border border-border/40 hover:border-primary/30 transition-all hover:shadow-md group">
      {/* 热门标志 - 仅热门卡片显示 */}
      {isHot && (
        <div className="absolute top-2 left-2 z-10 flex items-center justify-center">
          <Flame className="h-5 w-5 text-red-500 drop-shadow-sm" />
        </div>
      )}
      
      {/* 图片部分 */}
      <div className="relative overflow-hidden">
        <AspectRatio ratio={3/2} className="group-hover:scale-102 transition-transform duration-300">
          <Image
            src={props.image}
            alt={props.alt}
            fill
            className="object-cover"
          />
        </AspectRatio>
        
        {/* 收藏按钮 - 所有卡片都显示 */}
        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/40">
          <Heart className="h-4 w-4 text-white" />
        </div>
        
        {/* 标签 - 所有卡片在图片底部显示 */}
        {props.tags && props.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 max-w-[calc(100%-16px)]">
            {props.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] py-0 px-2 h-5 bg-black/30 backdrop-blur-sm border-transparent text-white">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* 内容部分 */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-base line-clamp-1 mb-2">{props.title}</h3>
        
        <div className="mt-auto pt-3 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 max-w-[60%] relative z-10">
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage src={props.author.avatar} alt={props.author.name} />
                <AvatarFallback className="bg-primary/20 text-[10px]">{props.author.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{props.author.name}</span>
              
              {/* 作者链接 */}
              <Link href={authorLink} className="absolute inset-0 z-10" aria-label={`View ${props.author.name}'s profile`}></Link>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 浏览量图标 - 热门模式使用TrendingUp图标 */}
              <div className="flex items-center gap-1">
                {isHot ? (
                  <TrendingUp className="h-3 w-3 text-primary" />
                ) : (
                  <Eye className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={cn(
                  isHot ? "text-primary font-medium" : "text-muted-foreground",
                  "text-xs"
                )}>
                  {formatNumber(props.stats.views)}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatNumber(props.stats.likes)}</span>
              </div>
              
              {/* 下载图标 - 所有卡片都显示 */}
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatNumber(props.stats.downloads)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 卡片主链接 */}
      <Link href={detailLink} className="absolute inset-0 z-0" aria-label={`View ${props.title} details`}></Link>
    </div>
  );
} 