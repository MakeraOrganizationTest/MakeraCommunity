/*
 * @LastEditTime: 2025-03-25 19:55:37
 * @Description: 热门模型卡片
 * @Date: 2025-03-25 19:15:37
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Heart, Download, TrendingUp, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
 * 热门模型卡片
 */
export default function HotCard(props: {
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
  rank: number
}) {
  // 生成详情页链接
  const detailLink = `/models/${props.id}`;
  
  // 生成作者页面链接
  const authorLink = `/creators/${props.author.id || 'profile'}`;

  return (
    <div className="relative flex lg:flex-col rounded-xl overflow-hidden border border-border/40 hover:border-primary/30 transition-all hover:shadow-md group">
      {/* 火苗图标 - 仅显示火苗 */}
      <div className="absolute top-2 left-2 z-10 flex items-center justify-center">
        <Flame className="h-5 w-5 text-red-500 drop-shadow-sm" />
      </div>
      
      {/* 图片部分 - 小屏幕占据左侧，大屏幕占据顶部 */}
      <div className="relative w-1/3 lg:w-full overflow-hidden">
        <AspectRatio ratio={4/3} className="group-hover:scale-102 transition-transform duration-300">
          <Image
            src={props.image}
            alt={props.alt}
            fill
            className="object-cover"
          />
        </AspectRatio>
        
        {/* 标签 - 大屏幕时显示在图片底部 */}
        {props.tags && props.tags.length > 0 && (
          <div className="hidden lg:flex absolute bottom-2 left-2 flex-wrap gap-1.5 max-w-[calc(100%-16px)]">
            {props.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] py-0 px-2 h-5 bg-black/30 backdrop-blur-sm border-transparent text-white">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* 内容部分 - 小屏幕占据右侧，大屏幕占据底部 */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <h3 className="font-medium text-sm lg:text-base line-clamp-1 mb-1">{props.title}</h3>
          
          {/* 标签 - 小屏幕时显示在内容中 */}
          {props.tags && props.tags.length > 0 && (
            <div className="flex lg:hidden flex-wrap gap-1 mb-2 max-w-full">
              {props.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-muted/50 border-transparent">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0 max-w-[50%] lg:max-w-[60%] relative z-10">
            <Avatar className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0">
              <AvatarImage src={props.author.avatar} alt={props.author.name} />
              <AvatarFallback className="bg-primary/20 text-[8px] lg:text-[10px]">{props.author.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] lg:text-xs text-muted-foreground truncate">{props.author.name}</span>
            
            {/* 作者链接 */}
            <Link href={authorLink} className="absolute inset-0 z-10" aria-label={`View ${props.author.name}'s profile`}></Link>
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-primary" />
              <span className="text-[10px] lg:text-xs text-primary font-medium">{formatNumber(props.stats.views)}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Heart className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-muted-foreground" />
              <span className="text-[10px] lg:text-xs text-muted-foreground">{formatNumber(props.stats.likes)}</span>
            </div>
            {/* 在大屏幕显示下载数据 */}
            <div className="hidden lg:flex items-center gap-0.5">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{formatNumber(props.stats.downloads)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 卡片主链接 */}
      <Link href={detailLink} className="absolute inset-0 z-0" aria-label={`View ${props.title} details`}></Link>
    </div>
  );
} 