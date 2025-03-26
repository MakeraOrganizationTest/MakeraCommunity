/*
 * @LastEditTime: 2025-03-26 14:40:09
 * @Description: 热门
 * @Date: 2025-03-25 17:07:45
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
import UnifiedCard from "./card/unified-card";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

const IMAGE_URL = "https://public-cdn.bblmw.cn/operation/d5053015aa8bc626.png?x-oss-process=image/resize,w_1920/format,webp";

// 可用标签
const TAG_OPTIONS = ["3D", "Character", "Animation", "Landscape", "Vehicle", "Weapon", "Sci-Fi", "Fantasy", "Environment"];

// 模拟数据
const hotModels = Array.from({ length: 8 }, (_, i) => {
  // 随机选择2-3个标签
  const randomTags = [...TAG_OPTIONS]
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 2) + 2);
    
  return {
    id: i + 1,
    src: IMAGE_URL,
    alt: `Hot Model ${i + 1}`,
    title: `Hot Model ${i + 1}`,
    author: {
      name: `Creator${i + 1}`,
      avatar: `https://i.pravatar.cc/150?img=${i + 5 + i}`,
      id: i + 1
    },
    stats: {
      views: Math.floor(Math.random() * 25000),
      likes: Math.floor(Math.random() * 3000),
      downloads: Math.floor(Math.random() * 1200),
    },
    tags: randomTags,
    rank: i + 1
  };
});

export default function Hot() {
  return (
    <section className="w-full py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Hot Models</h2>
        <InteractiveHoverButton>View all</InteractiveHoverButton>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {
          hotModels.map((model) => (
            <UnifiedCard
              key={model.id}
              image={model.src}
              alt={model.alt}
              title={model.title}
              author={model.author}
              stats={model.stats}
              id={model.id}
              tags={model.tags}
              rank={model.rank}
              variant="hot"
            />
          ))
        }
      </div>
    </section>
  );
}