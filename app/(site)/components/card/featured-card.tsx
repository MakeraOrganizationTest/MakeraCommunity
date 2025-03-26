/*
 * @LastEditTime: 2025-03-25 18:59:37
 * @Description: 精选模型卡片
 * @Date: 2025-03-25 18:00:45
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Heart, Download, CheckCircle } from "lucide-react"
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
 * 精选模型卡片
 */
export default function FeaturedCard(props: {
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
  tags?: string[]
}) {
  // 生成详情页链接
  const detailLink = `/models/${props.id}`;
  
  // 生成作者页面链接
  const authorLink = `/creators/${props.author.id || 'profile'}`;

  return (
    <div className="relative h-full flex flex-col rounded-xl overflow-hidden border border-border/40 hover:border-primary/30 transition-all hover:shadow-md group">
      <div className="relative overflow-hidden">
        <AspectRatio ratio={3 / 2} className="group-hover:scale-102 transition-transform duration-300">
          <Image
            src={props.image}
            alt={props.alt}
            fill
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        
        {/* 收藏按钮 */}
        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/40">
          <Heart className="h-4 w-4 text-white" />
        </div>
        
        {/* 标签 - 移到图片底部 */}
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
              
              {/* 作者链接 - 覆盖作者区域 */}
              <Link href={authorLink} className="absolute inset-0 z-10" aria-label={`View ${props.author.name}'s profile`}></Link>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatNumber(props.stats.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatNumber(props.stats.likes)}</span>
              </div>
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