'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, useAnimation } from 'framer-motion'

// 定义组件的Props类型
interface LikeButtonProps {
  isLiked?: boolean // 外部控制的点赞状态
  onChange?: (liked: boolean) => void // 状态变化统一回调
}

const LikeButton = ({ isLiked = false, onChange }: LikeButtonProps) => {
  // 交互状态
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // 动画控制器
  const buttonControls = useAnimation()
  const iconControls = useAnimation()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 清理函数
  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // 组件卸载时清理
  useEffect(() => {
    return clearTimeouts
  }, [])

  // 处理按钮动画效果
  useEffect(() => {
    if (isPressed) {
      // 按下时的震动效果
      buttonControls.start({
        scale: 0.9,
        x: [0, -1, 1, -0.8, 0.8, -0.5, 0.5, 0],
        y: [0, 0.5, 0, 0.5, 0],
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 20,
          x: {
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          },
          y: {
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse'
          }
        }
      })

      // 图标也一起震动
      iconControls.start({
        rotate: [0, -1.5, 1.5, -1, 1, 0],
        scale: [1, 0.97, 1, 0.98, 1],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }
      })
    } else if (isTransitioning) {
      // 过渡动画 - 从按下到点赞的过渡
      buttonControls.start({
        scale: [0.9, 1.1, 1],
        x: 0,
        y: 0,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
          times: [0, 0.6, 1]
        }
      })

      // 停止图标震动
      iconControls.stop()
      iconControls.set({ rotate: 0, scale: 1 })
    } else if (isHovered && !isLiked) {
      // 悬停效果 - 仅在未点赞状态
      buttonControls.start({
        scale: 1.05,
        x: 0,
        y: 0,
        transition: { duration: 0.2 }
      })
    } else {
      // 默认状态
      buttonControls.start({
        scale: 1,
        x: 0,
        y: 0
      })
    }
  }, [
    isHovered,
    isPressed,
    isTransitioning,
    isLiked,
    buttonControls,
    iconControls
  ])

  // 处理点赞逻辑
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLiked) {
      // 如果已点赞，触发取消点赞事件
      if (onChange) onChange(false)
    } else if (!isTransitioning) {
      // 如果未点赞且不在过渡中，开始按下效果
      setIsPressed(true)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isPressed) {
      // 按下后松开，开始过渡动画
      setIsPressed(false)
      setIsTransitioning(true)

      // 提前准备c4动画，使过渡更加连贯
      clearTimeouts()
      timeoutRef.current = setTimeout(() => {
        // 在c3动画还没结束前就触发点赞回调
        if (onChange) onChange(true)
        // 延迟一点再结束过渡状态，让c4的入场动画有时间展示
        setTimeout(() => {
          setIsTransitioning(false)
        }, 250)
      }, 400)
    }
  }

  // 鼠标悬停相关
  const handleMouseEnter = () => {
    if (!isTransitioning) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (isPressed) {
      setIsPressed(false)
    }
  }

  // 触摸屏支持
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLiked) {
      if (onChange) onChange(false)
    } else if (!isTransitioning) {
      setIsPressed(true)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isPressed) {
      setIsPressed(false)
      setIsTransitioning(true)

      clearTimeouts()
      timeoutRef.current = setTimeout(() => {
        if (onChange) onChange(true)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 250)
      }, 400)
    }
  }

  // 图片尺寸
  const imageSize = 28

  // 根据状态确定显示的图片
  const renderIcon = () => {
    if (isPressed) {
      // 按下状态 - c2 图片
      return (
        <motion.div animate={iconControls} initial={{ rotate: 0, scale: 1 }}>
          <Image
            src="/images/icons/c2.png"
            alt="like-pressed"
            width={imageSize}
            height={imageSize}
            draggable={false}
          />
        </motion.div>
      )
    }

    if (isTransitioning) {
      // c3状态动画
      if (!isLiked) {
        return (
          <motion.div
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.15, 0.98, 1.05, 1],
              rotate: [0, 3, -3, 1, -1, 0],
              y: [0, -2, 4, 2, 0]
            }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
              times: [0, 0.2, 0.5, 0.7, 1]
            }}
          >
            <Image
              src="/images/icons/c3.png"
              alt="like-transitioning"
              width={imageSize}
              height={imageSize}
              draggable={false}
            />
          </motion.div>
        )
      } else {
        return (
          <motion.div
            initial={{ scale: 0.95, opacity: 0.95, rotate: -5 }}
            animate={{
              scale: [0.95, 1.05, 0.98, 1],
              opacity: [0.95, 1],
              rotate: [-5, 2, -1, 0]
            }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
              times: [0, 0.4, 0.7, 1]
            }}
          >
            <Image
              src="/images/icons/c4.png"
              alt="liked-transitioning"
              width={imageSize}
              height={imageSize}
              draggable={false}
            />
          </motion.div>
        )
      }
    }

    if (isLiked) {
      // 已点赞最终状态 - c4 图片
      return (
        <motion.div initial={{ scale: 1 }} animate={{ scale: 1 }}>
          <Image
            src="/images/icons/c4.png"
            alt="liked"
            width={imageSize}
            height={imageSize}
            draggable={false}
          />
        </motion.div>
      )
    }

    // 默认或悬停状态 - c0 或 c1 图片
    const imgSrc = isHovered ? '/images/icons/c1.png' : '/images/icons/c0.png'
    return (
      <Image
        src={imgSrc}
        alt={isHovered ? 'like-hover' : 'like-default'}
        width={imageSize}
        height={imageSize}
        draggable={false}
      />
    )
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="cursor-pointer relative w-12 h-12 flex items-center justify-center rounded-full p-2 select-none touch-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleClick}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={e => e.preventDefault()}
        animate={buttonControls}
      >
        {renderIcon()}
      </motion.div>
    </div>
  )
}

export default LikeButton
