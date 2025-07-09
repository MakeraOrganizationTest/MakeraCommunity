'use client'

import Image from 'next/image'

const models = [
  {
    title: '3D Sunflower Flower Witch',
    author: 'menggo',
    price: '998',
    downloads: '2.78M',
    avatar: '/assets/figma/avatar-1.png', // 占位符
    bg: '/assets/figma/card-bg-1.png' // 占位符
  }
  // 可根据Figma继续添加更多卡片数据
]

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-[#1B1B1B] flex flex-col items-center py-10 gap-10">
      <h1 className="text-3xl font-semibold text-white w-full max-w-6xl mb-6">
        🔥Popular Models
      </h1>
      <div className="flex flex-row flex-wrap gap-5 w-full max-w-6xl justify-center">
        {models.map((model, idx) => (
          <div
            key={idx}
            className="w-[248px] flex flex-col rounded-2xl overflow-hidden shadow-lg bg-[#202020] border border-[#232323]"
          >
            <div className="relative h-[186px] w-full">
              <Image
                src={model.bg}
                alt={model.title}
                fill
                className="object-cover"
                style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                sizes="248px"
                priority={idx === 0}
              />
            </div>
            <div className="flex flex-col gap-3 p-4 bg-[#202020] rounded-b-2xl">
              <div className="text-base font-semibold text-white truncate">
                {model.title}
              </div>
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300">
                    <Image
                      src={model.avatar}
                      alt={model.author}
                      width={24}
                      height={24}
                    />
                  </div>
                  <span className="text-xs text-[#9D9E9E] font-medium">
                    {model.author}
                  </span>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="8" fill="#FACC27" />
                  </svg>
                  <span className="text-xs text-white font-semibold">
                    {model.price}
                  </span>
                </div>
              </div>
              <div className="flex flex-row items-center gap-1 text-xs text-[#9D9E9E]">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <polygon points="8,2 14,14 2,14" fill="#9D9E9E" />
                </svg>
                <span>{model.downloads}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center w-full mt-8">
        <button className="px-6 py-3 rounded-xl bg-[#1B1B1B] text-white font-semibold border border-[#232323] hover:bg-[#232323] transition">
          See more
        </button>
      </div>
    </div>
  )
}
