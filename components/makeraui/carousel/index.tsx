'use client'

import React, { useState, useEffect, useRef } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { MIconArrowRight, MIconArrowLeft } from '@/components/icons'

interface MCarouselProps {
  items?: string[]
}

export default function MCarousel({ items }: MCarouselProps) {
  const [nav1, setNav1] = useState<Slider | undefined>(undefined)
  const [nav2, setNav2] = useState<Slider | undefined>(undefined)
  const [currentSlide, setCurrentSlide] = useState(0)
  const sliderRef1 = useRef<Slider>(null)
  const sliderRef2 = useRef<Slider>(null)

  // 默认示例数据
  const defaultItems: string[] = []

  const carouselItems = items || defaultItems

  useEffect(() => {
    setNav1(sliderRef1.current || undefined)
    setNav2(sliderRef2.current || undefined)
  }, [])

  // 自定义前进按钮
  const NextArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      className="absolute top-1/2 right-6 z-10 flex h-[46px] w-[46px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-[22px] text-white transition-all duration-200 hover:bg-black/70"
      onClick={onClick}
    >
      <MIconArrowRight />
    </button>
  )

  // 自定义后退按钮
  const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      className="absolute top-1/2 left-6 z-10 flex h-[46px] w-[46px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-[22px] text-white transition-all duration-200 hover:bg-black/70"
      onClick={onClick}
    >
      <MIconArrowLeft />
    </button>
  )

  const mainSliderSettings = {
    asNavFor: nav2,
    ref: sliderRef1,
    arrows: true,
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    beforeChange: (current: number, next: number) => setCurrentSlide(next),
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />
  }

  const navSliderSettings = {
    asNavFor: nav1,
    ref: sliderRef2,
    slidesToShow: 5,
    slidesToScroll: 1,
    swipeToSlide: true,
    focusOnSelect: true,
    infinite: true,
    arrows: false,
    dots: false,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 4
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 3
        }
      }
    ]
  }

  return (
    <div className="w-full space-y-3 overflow-hidden">
      {/* 主轮播图 - 大图显示 */}
      <div className="relative w-full">
        <Slider {...mainSliderSettings}>
          {carouselItems.map((item, index) => (
            <div key={`${item}-${index}`} className="outline-none">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
                <img src={item} className="h-full w-full object-cover" />
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* 缩略图导航轮播 */}
      <div className="w-full">
        <div className="-ml-[4px] w-[calc(100%+8px)]">
          <Slider {...navSliderSettings}>
            {carouselItems.map((item, index) => (
              <div
                key={`nav-${item}-${index}`}
                className="px-[8px] py-[3px] outline-none"
              >
                <div
                  className={`relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-md bg-gray-100 transition-all duration-200 hover:opacity-80 ${
                    index === currentSlide
                      ? 'ring-2 ring-foreground ring-offset-1'
                      : ''
                  }`}
                >
                  <img src={item} className="h-full w-full object-cover" />

                  {item.toLowerCase().endsWith('.gif') && (
                    <div className="absolute bottom-0 left-0 rounded-tr-[12px] bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
                      GIF
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  )
}
