/*
 * @LastEditTime: 2025-03-26 14:51:09
 * @Description: 分类导航组件
 * @Date: 2025-03-26 14:17:24
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */

"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { cn } from "@/lib/utils";

// 分类数据接口
interface Category {
  id: number;
  name: string;
  count: number;
}

// 分类数据
const categories: Category[] = [
  { id: 1, name: "角色", count: 1245 },
  { id: 2, name: "场景", count: 783 },
  { id: 3, name: "交通", count: 562 },
  { id: 4, name: "动画", count: 821 },
  { id: 5, name: "道具", count: 497 },
  { id: 6, name: "武器", count: 324 },
  { id: 7, name: "科幻", count: 689 },
  { id: 8, name: "奇幻", count: 753 },
  { id: 9, name: "建筑", count: 415 },
  { id: 10, name: "自然", count: 632 },
  { id: 11, name: "动物", count: 482 },
  { id: 12, name: "人物", count: 768 },
  { id: 13, name: "服装", count: 345 },
  { id: 14, name: "食物", count: 267 },
  { id: 15, name: "材质", count: 526 },
  { id: 16, name: "工业", count: 315 },
  { id: 17, name: "医疗", count: 218 },
  { id: 18, name: "电子", count: 387 },
  { id: 19, name: "宗教", count: 196 },
  { id: 20, name: "体育", count: 276 },
  { id: 21, name: "乐器", count: 189 },
  { id: 22, name: "游戏", count: 428 },
  { id: 23, name: "家居", count: 312 },
  { id: 24, name: "军事", count: 245 },
  { id: 25, name: "古代", count: 176 },
  { id: 26, name: "中国风", count: 298 },
  { id: 27, name: "日式", count: 204 },
  { id: 28, name: "欧美", count: 267 },
  { id: 29, name: "机器人", count: 329 },
  { id: 30, name: "魔法", count: 217 },
  { id: 31, name: "天空", count: 164 },
  { id: 32, name: "海洋", count: 203 },
  { id: 33, name: "山脉", count: 178 },
  { id: 34, name: "城市", count: 289 },
  { id: 35, name: "农村", count: 154 },
  { id: 36, name: "动漫", count: 387 },
  { id: 37, name: "卡通", count: 219 },
  { id: 38, name: "写实", count: 246 },
  { id: 39, name: "抽象", count: 157 },
  { id: 40, name: "怪物", count: 213 },
  { id: 41, name: "植物", count: 187 },
  { id: 42, name: "太空", count: 225 },
  { id: 43, name: "地下", count: 136 },
  { id: 44, name: "珠宝", count: 165 },
  { id: 45, name: "纹理", count: 228 },
  { id: 46, name: "影视", count: 298 },
  { id: 47, name: "医学", count: 146 },
  { id: 48, name: "教育", count: 178 }
];

// 每行显示的分类数量
const ITEMS_PER_ROW = {
  mobile: 4,
  tablet: 8,
  desktop: 12
};

// 最多显示行数
const MAX_ROWS = 2;

export default function Category() {
  const [showAll, setShowAll] = useState(false);
  
  const toggleShowAll = () => {
    setShowAll(!showAll);
  };
  
  // 计算每种设备默认显示的分类数量
  const mobileVisible = ITEMS_PER_ROW.mobile * MAX_ROWS;
  const tabletVisible = ITEMS_PER_ROW.tablet * MAX_ROWS;
  const desktopVisible = ITEMS_PER_ROW.desktop * MAX_ROWS;
  
  return (
    <section className="w-full py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold">Categories</h2>
        <InteractiveHoverButton>View all</InteractiveHoverButton>
      </div>
      
      {/* 移动端 */}
      <div className="md:hidden">
        <div className="grid grid-cols-4 gap-2">
          {/* 显示前N个分类 */}
          {categories.slice(0, showAll ? categories.length : mobileVisible - 1).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          
          {/* 如果分类总数超过默认显示数量且未展开全部，显示"更多"按钮 */}
          {categories.length > mobileVisible && !showAll && (
            <MoreButton onClick={toggleShowAll} />
          )}
        </div>
        
        {/* 展开/收起按钮 */}
        {showAll && (
          <button 
            onClick={toggleShowAll}
            className="flex items-center justify-center w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronUp size={14} className="mr-1" />
            <span>收起</span>
          </button>
        )}
      </div>
      
      {/* 平板端 */}
      <div className="hidden md:block lg:hidden">
        <div className="grid grid-cols-8 gap-2">
          {/* 显示前N个分类 */}
          {categories.slice(0, showAll ? categories.length : tabletVisible - 1).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          
          {/* 如果分类总数超过默认显示数量且未展开全部，显示"更多"按钮 */}
          {categories.length > tabletVisible && !showAll && (
            <MoreButton onClick={toggleShowAll} />
          )}
        </div>
        
        {/* 展开/收起按钮 */}
        {showAll && (
          <button 
            onClick={toggleShowAll}
            className="flex items-center justify-center w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronUp size={14} className="mr-1" />
            <span>收起</span>
          </button>
        )}
      </div>
      
      {/* 桌面端 */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-12 gap-2">
          {/* 显示前N个分类 */}
          {categories.slice(0, showAll ? categories.length : desktopVisible - 1).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          
          {/* 如果分类总数超过默认显示数量且未展开全部，显示"更多"按钮 */}
          {categories.length > desktopVisible && !showAll && (
            <MoreButton onClick={toggleShowAll} />
          )}
        </div>
        
        {/* 展开/收起按钮 */}
        {showAll && (
          <button 
            onClick={toggleShowAll}
            className="flex items-center justify-center w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronUp size={14} className="mr-1" />
            <span>收起</span>
          </button>
        )}
      </div>
    </section>
  );
}

// 分类卡片
interface CategoryCardProps {
  category: Category;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link 
      href={`/category/${category.id}`}
      className={cn(
        "flex items-center justify-center h-9 px-2 py-1.5 rounded-sm",
        "border border-border bg-card text-card-foreground",
        "hover:bg-accent hover:text-accent-foreground transition-colors text-center",
        "cursor-pointer"
      )}
    >
      <span className="text-xs font-medium truncate">{category.name}</span>
    </Link>
  );
}

// "更多"按钮组件
interface MoreButtonProps {
  onClick: () => void;
}

function MoreButton({ onClick }: MoreButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center h-9 px-2 py-1.5 rounded-sm",
        "border border-border bg-card text-card-foreground",
        "hover:bg-accent hover:text-accent-foreground transition-colors text-center",
        "cursor-pointer"
      )}
    >
      <span className="text-xs font-medium mr-1">更多</span>
      <ChevronDown size={12} className="text-muted-foreground" />
    </button>
  );
}
