/*
 * @LastEditTime: 2025-03-26 12:10:00
 * @Description: 精选
 * @Date: 2025-03-25 17:07:45
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
import UnifiedCard from "./card/unified-card";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

const IMAGE_URL = "https://public-cdn.bblmw.cn/operation/d5053015aa8bc626.png?x-oss-process=image/resize,w_1920/format,webp";

// 模拟数据
const featuredModels = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  src: IMAGE_URL,
  alt: `Featured Model ${i + 1}`,
  title: `Featured Models ${i + 1}`,
  author: {
    name: `Creator${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${i + 10 + i}`,
    id: i + 1
  },
  stats: {
    views: Math.floor(Math.random() * 15000),
    likes: Math.floor(Math.random() * 2000),
    downloads: Math.floor(Math.random() * 800),
  },
  tags: ["Game", "Role", "Scene"].slice(0, Math.floor(Math.random() * 3) + 1)
}));

export default function Featured() {
  return (
    <section className="w-full py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Featured Models</h2>
        {/* <a href="/featured" className="text-sm text-primary hover:underline">View all</a> */}
        <InteractiveHoverButton>View all</InteractiveHoverButton>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {
          featuredModels.map((model) => (
            <UnifiedCard
              key={model.id}
              image={model.src}
              alt={model.alt}
              title={model.title}
              author={model.author}
              stats={model.stats}
              id={model.id}
              tags={model.tags}
              variant="featured"
            />
          ))
        }
      </div>
    </section>
  );
}