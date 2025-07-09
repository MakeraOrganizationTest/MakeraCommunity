'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { useState, useRef } from 'react'
import type { CarouselApi } from '@/components/ui/carousel'

export default function MCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const mainCarouselRef = useRef<CarouselApi | undefined>(undefined)
  const thumbCarouselRef = useRef<CarouselApi | undefined>(undefined)

  // 处理小图点击事件
  const handleThumbClick = (index: number) => {
    setSelectedIndex(index)
    // 滚动大图到指定位置
    if (mainCarouselRef.current) {
      mainCarouselRef.current.scrollTo(index)
    }
  }

  return (
    <div>
      <Carousel setApi={setMainCarouselRef}>
        <CarouselContent className="-ml-0">
          {Array.from({ length: 8 }).map((_, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-gray-200">
                <span>轮播图 {index + 1}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <Carousel className="mt-3 w-full" setApi={setThumbCarouselRef}>
        <CarouselContent className="-ml-3 gap-0">
          {Array.from({ length: 8 }).map((_, index) => (
            <CarouselItem key={index} className="basis-1/5 pl-3">
              <div
                className={`flex aspect-[4/3] w-full cursor-pointer items-center justify-center rounded-md transition-all duration-150 ${
                  selectedIndex === index
                    ? 'box-border border-2 border-foreground'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => handleThumbClick(index)}
              >
                <span>轮播图 {index + 1}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )

  function setMainCarouselRef(api: CarouselApi) {
    mainCarouselRef.current = api
  }

  function setThumbCarouselRef(api: CarouselApi) {
    thumbCarouselRef.current = api
  }
}
