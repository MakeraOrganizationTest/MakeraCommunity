import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Heart, Download } from "lucide-react"

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
 * 模型卡片
 */
export default function ModelCard(props: { 
  ratio?: number,
  image: string, 
  alt: string,
  title?: string,
  id?: number,
  author?: { 
    name: string, 
    avatar: string 
  },
  stats?: {
    views: number,
    likes: number,
    downloads: number
  },
  isFeature?: boolean
}) {
  // 生成详情页链接
  const detailLink = `/models/${props.id || 'detail'}`;
  
  return (
    <Link href={detailLink} className="block w-full h-full">
      <div className="w-full h-full relative group rounded-lg overflow-hidden cursor-pointer transition-transform">
        <AspectRatio ratio={props.ratio || 4 / 3} className="group-hover:scale-102 transition-transform duration-300">
          <Image 
            src={props.image} 
            alt={props.alt} 
            fill
            className="w-full h-full object-cover" 
          />
        </AspectRatio>
        
        {/* 信息层 - 悬停时显示或在特色卡片上一直显示 */}
        {(props.title && props.author && props.stats) && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2
            ${props.isFeature ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0 max-w-[60%]">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage src={props.author.avatar} alt={props.author.name} />
                  <AvatarFallback className="bg-primary/20 text-[10px]">{props.author.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-white/80 truncate">{props.author.name}</span>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-white/80" />
                  <span className="text-xs text-white/80">{formatNumber(props.stats.likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3 text-white/80" />
                  <span className="text-xs text-white/80">{formatNumber(props.stats.downloads)}</span>
                </div>
              </div>
            </div>
            
            
            <h3 className="font-medium text-sm text-white line-clamp-1 mt-1">{props.title}</h3>
          </div>
        )}
      </div>
    </Link>
  )
}