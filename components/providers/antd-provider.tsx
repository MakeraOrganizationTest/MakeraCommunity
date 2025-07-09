'use client'

import '@ant-design/v5-patch-for-react-19'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, theme as antdTheme, App } from 'antd'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import enUS from 'antd/es/locale/en_US'

export function AntdRegistryProvider({
  children
}: {
  children: React.ReactNode
}) {
  return <AntdRegistry>{children}</AntdRegistry>
}

const customLightTheme = {
  token: {
    colorPrimary: '#217de8',
    colorInfo: '#217de8',
    colorSuccess: '#18cb59',
    colorError: '#ff4759',
    colorTextBase: '#1b1b1b',
    borderRadius: 10,
    borderRadiusSM: 8,
    borderRadiusXS: 4
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      fontWeight: 600,
      controlHeightSM: 32,
      contentFontSizeSM: 12,
      paddingInline: 32,
      paddingInlineSM: 16,
      paddingInlineLG: 32
    },
    Divider: {
      colorSplit: 'rgb(231,237,243)'
    },
    Input: {
      algorithm: true,
      controlHeight: 40,
      controlHeightLG: 48,
      activeBorderColor: 'rgb(27,27,27)',
      hoverBorderColor: 'rgb(60,63,68)',
      controlHeightSM: 32
    },
    InputNumber: {
      activeBorderColor: 'rgb(27,27,27)',
      hoverBorderColor: 'rgb(60,63,68)',
      handleHoverColor: 'rgb(60,63,68)',
      controlHeightSM: 32,
      controlHeightLG: 48
    },
    Select: {
      optionSelectedBg: 'rgba(33,125,232,0.1)',
      controlHeight: 40,
      controlHeightLG: 48,
      optionActiveBg: 'rgb(244,247,250)',
      activeBorderColor: 'rgb(27,27,27)',
      hoverBorderColor: 'rgb(60,63,68)',
      controlHeightSM: 32
    },
    Cascader: {
      optionSelectedBg: 'rgb(244,247,250)',
      optionSelectedColor: 'rgb(27,27,27)',
      optionPadding: '12px 12px'
    },
    Modal: {
      margin: 20,
      padding: 24
    },
    Steps: {
      colorPrimary: 'rgb(27,27,27)',
      colorPrimaryBorder: 'rgb(231,237,243)',
      colorText: 'rgb(27,27,27)',
      colorSplit: 'rgb(27,27,27)',
      lineType: 'dashed'
    },
    Pagination: {
      controlHeightSM: 32,
      controlHeight: 40,
      controlHeightLG: 48
    },
    Checkbox: {
      algorithm: true
    },
    Mentions: {
      controlHeight: 40
    },
    Segmented: {
      controlHeight: 37
    },
    Radio: {
      controlHeight: 37
    }
  }
}
const customDarkTheme = {
  token: {
    colorPrimary: '#1e6fe0',
    colorInfo: '#1e6fe0',
    colorSuccess: '#1bae51',
    colorError: '#e12d3f',
    colorTextBase: '#ffffff',
    borderRadius: 10,
    borderRadiusSM: 8,
    borderRadiusXS: 4
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      fontWeight: 600,
      controlHeightSM: 32,
      contentFontSizeSM: 12,
      paddingInline: 32,
      paddingInlineSM: 16,
      paddingInlineLG: 32
    },
    Divider: {
      colorSplit: '#27272a'
    },
    Input: {
      algorithm: true,
      controlHeight: 40,
      controlHeightLG: 48,
      activeBorderColor: '#ffffff',
      hoverBorderColor: '#d4d4d4',
      controlHeightSM: 32
    },
    InputNumber: {
      activeBorderColor: '#ffffff',
      hoverBorderColor: '#d4d4d4',
      handleHoverColor: '#d4d4d4',
      controlHeightSM: 32,
      controlHeightLG: 48
    },
    Select: {
      optionSelectedBg: 'rgba(30,111,224,0.1)',
      controlHeight: 40,
      controlHeightLG: 48,
      optionActiveBg: '#0a0a0a',
      activeBorderColor: '#ffffff',
      hoverBorderColor: '#d4d4d4',
      controlHeightSM: 32
    },
    Cascader: {
      optionSelectedBg: '#0a0a0a',
      optionSelectedColor: '#ffffff',
      optionPadding: '12px 12px'
    },
    Modal: {
      margin: 20,
      padding: 24
    },
    Steps: {
      colorPrimary: '#ffffff',
      colorPrimaryBorder: '#27272a',
      colorText: '#ffffff',
      colorSplit: '#ffffff',
      lineType: 'dashed'
    },
    Pagination: {
      controlHeightSM: 32,
      controlHeight: 40,
      controlHeightLG: 48
    },
    Checkbox: {
      algorithm: true
    },
    Mentions: {
      controlHeight: 40
    },
    Segmented: {
      controlHeight: 37
    },
    Radio: {
      controlHeight: 37
    }
  }
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 确保组件已挂载，避免 hydration 不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  // 在挂载前使用默认主题，避免 hydration 错误
  const customTheme =
    mounted && (resolvedTheme === 'dark' || theme === 'dark')
      ? { algorithm: antdTheme.darkAlgorithm, ...customDarkTheme }
      : { algorithm: antdTheme.defaultAlgorithm, ...customLightTheme }

  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        ...customTheme
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
