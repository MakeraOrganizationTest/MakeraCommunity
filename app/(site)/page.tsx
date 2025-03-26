/*
 * @LastEditTime: 2025-03-26 14:37:17
 * @Description: ...
 * @Date: 2025-03-18 15:40:42
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
import Hero from "./components/hero";
import Featured from "./components/featured";
import Hot from "./components/hot";
import Category from "./components/category";

export default function HomePage() {
  return (
    <div className="max-w-[1920px] mx-auto w-full px-4 lg:px-6">
      <Hero />
      {/* 分类 */}
      <Category />
      {/* 精选 */}
      <Featured />
      {/* 热门 */}
      <Hot />
    </div>
  );
}
