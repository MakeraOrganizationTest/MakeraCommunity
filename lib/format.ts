/**
 * 常用的数字格式化预设
 */
export const NumberFormats = {
  /** 中文货币格式 */
  CURRENCY_CN: { currency: 'CNY', locale: 'zh-CN' },
  /** 美元货币格式 */
  CURRENCY_USD: { currency: 'USD', locale: 'en-US' },
  /** 欧元货币格式 */
  CURRENCY_EUR: { currency: 'EUR', locale: 'de-DE' },
  /** 日元货币格式 */
  CURRENCY_JPY: { currency: 'JPY', locale: 'ja-JP' },
  /** 中文数字格式 */
  NUMBER_CN: 'zh-CN',
  /** 美式数字格式 */
  NUMBER_US: 'en-US',
  /** 欧式数字格式 */
  NUMBER_EU: 'de-DE'
} as const

/**
 * 常用的日期格式预设
 */
export const DateFormats = {
  /** 2025-01-15 */
  DATE: 'YYYY-MM-DD',
  /** 2025/01/15 */
  DATE_SLASH: 'YYYY/MM/DD',
  /** 01-15-2025 */
  DATE_US: 'MM-DD-YYYY',
  /** 15/01/2025 */
  DATE_EU: 'DD/MM/YYYY',
  /** 14:30:25 */
  TIME: 'HH:mm:ss',
  /** 14:30 */
  TIME_SHORT: 'HH:mm',
  /** 2025-01-15 14:30:25 */
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  /** 2025-01-15 14:30 */
  DATETIME_SHORT: 'YYYY-MM-DD HH:mm',
  /** 2025/01/15 14:30:25 */
  DATETIME_SLASH: 'YYYY/MM/DD HH:mm:ss',
  /** 2025年01月15日 */
  DATE_CN: 'YYYY年MM月DD日',
  /** 2025年01月15日 14:30:25 */
  DATETIME_CN: 'YYYY年MM月DD日 HH:mm:ss',
  /** 25-01-15 */
  DATE_SHORT: 'YY-MM-DD',
  /** 01/15 */
  MONTH_DAY: 'MM/DD',
  /** 15日 */
  DAY_CN: 'DD日'
} as const

/**
 * 将日期字符串格式化为本地化格式
 * @param dateString 要格式化的 ISO 日期字符串、Date对象或null/undefined
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  locale = 'en-US'
) {
  if (!dateString) return 'N/A'

  let date: Date
  if (dateString instanceof Date) {
    date = dateString
  } else {
    date = new Date(dateString)
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * 格式化日期和时间
 * @param dateString 要格式化的 ISO 日期字符串、Date对象或null/undefined
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 带时间的格式化日期字符串
 */
export function formatDateTime(
  dateString: string | Date | null | undefined,
  locale = 'en-US'
) {
  if (!dateString) return 'N/A'

  let date: Date
  if (dateString instanceof Date) {
    date = dateString
  } else {
    date = new Date(dateString)
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * 格式化相对时间（如 "2 days ago"）
 * @param dateString 要格式化的 ISO 日期字符串
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString: string, locale = 'en-US') {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now.getTime() - date.getTime()

  // 将毫秒转换为适当的时间单位
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30) // Approximate
  const years = Math.floor(days / 365) // Approximate

  // 如果可用，使用 Intl.RelativeTimeFormat
  if (typeof Intl.RelativeTimeFormat !== 'undefined') {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

    if (years > 0) return rtf.format(-years, 'year')
    if (months > 0) return rtf.format(-months, 'month')
    if (days > 0) return rtf.format(-days, 'day')
    if (hours > 0) return rtf.format(-hours, 'hour')
    if (minutes > 0) return rtf.format(-minutes, 'minute')
    return rtf.format(-seconds, 'second')
  }

  // 对于不支持 RelativeTimeFormat 的浏览器的兼容方案
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`
}

/**
 * 格式化日期为自定义格式
 * @param dateString 要格式化的 ISO 日期字符串
 * @param format 格式字符串，支持的格式：
 *   - YYYY: 四位年份
 *   - YY: 两位年份
 *   - MM: 两位月份
 *   - M: 月份（不补零）
 *   - DD: 两位日期
 *   - D: 日期（不补零）
 *   - HH: 两位小时（24小时制）
 *   - H: 小时（24小时制，不补零）
 *   - mm: 两位分钟
 *   - m: 分钟（不补零）
 *   - ss: 两位秒数
 *   - s: 秒数（不补零）
 * @returns 格式化后的日期字符串
 */
export function formatCustomDateTime(
  dateString: string,
  format: string
): string {
  const date = new Date(dateString)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  return format
    .replace(/YYYY/g, String(year))
    .replace(/YY/g, String(year).slice(-2))
    .replace(/MM/g, String(month).padStart(2, '0'))
    .replace(/M/g, String(month))
    .replace(/DD/g, String(day).padStart(2, '0'))
    .replace(/D/g, String(day))
    .replace(/HH/g, String(hours).padStart(2, '0'))
    .replace(/H/g, String(hours))
    .replace(/mm/g, String(minutes).padStart(2, '0'))
    .replace(/m/g, String(minutes))
    .replace(/ss/g, String(seconds).padStart(2, '0'))
    .replace(/s/g, String(seconds))
}

/**
 * 格式化日期为标准格式（YYYY-MM-DD HH:mm:ss）
 * @param dateString 要格式化的 ISO 日期字符串
 * @returns 标准格式的日期字符串
 */
export function formatStandardDateTime(dateString: string): string {
  return formatCustomDateTime(dateString, DateFormats.DATETIME)
}

/**
 * 智能格式化时间（n天内显示相对时间，n天外显示自定义格式）
 * @param dateString 要格式化的 ISO 日期字符串
 * @param options 配置选项
 * @param options.dayThreshold 天数阈值，超过此天数显示自定义格式（默认：7天）
 * @param options.format 超过阈值时使用的格式（默认：DateFormats.DATETIME）
 * @param options.locale 格式化的区域设置（默认：'en-US'）
 * @returns 智能格式化后的时间字符串
 */
export function formatSmartDateTime(
  dateString: string,
  options: {
    dayThreshold?: number
    format?: string
    locale?: string
  } = {}
): string {
  const {
    dayThreshold = 7,
    format = DateFormats.DATETIME_SLASH,
    locale = 'en-US'
  } = options

  const now = new Date()
  const date = new Date(dateString)
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  // 如果在阈值天数内，显示相对时间
  if (Math.abs(days) <= dayThreshold) {
    return formatRelativeTime(dateString, locale)
  }

  // 超过阈值天数，显示自定义格式
  return formatCustomDateTime(dateString, format)
}

/**
 * 格式化数字为千分位分隔符格式
 * @param value 要格式化的数字
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 带千分位分隔符的数字字符串
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value)
}

/**
 * 格式化数字为指定小数位数
 * @param value 要格式化的数字
 * @param decimals 小数位数（默认：2）
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 格式化后的数字字符串
 */
export function formatDecimal(
  value: number,
  decimals = 2,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * 格式化数字为货币格式
 * @param value 要格式化的数字
 * @param currency 货币代码（默认：'USD'）
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value)
}

/**
 * 格式化数字为百分比格式
 * @param value 要格式化的数字（0-1之间的小数）
 * @param decimals 小数位数（默认：1）
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(
  value: number,
  decimals = 1,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * 格式化数字为简化单位格式（K、M、B）
 * @param value 要格式化的数字
 * @param decimals 小数位数（默认：1）
 * @returns 格式化后的简化数字字符串
 */
export function formatCompactNumber(value: number, decimals = 1): string {
  if (value === 0) return '0'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`
  } else {
    return `${sign}${absValue}`
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数（默认：1）
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * 格式化数字范围
 * @param min 最小值
 * @param max 最大值
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 格式化后的范围字符串
 */
export function formatRange(
  min: number,
  max: number,
  locale = 'en-US'
): string {
  const formatter = new Intl.NumberFormat(locale)
  return `${formatter.format(min)} - ${formatter.format(max)}`
}

/**
 * 格式化数字为序数（1st, 2nd, 3rd, 4th...）
 * @param value 要格式化的数字
 * @param locale 格式化的区域设置（默认：'en-US'）
 * @returns 格式化后的序数字符串
 */
export function formatOrdinal(value: number, locale = 'en-US'): string {
  if (typeof Intl.PluralRules !== 'undefined') {
    const pr = new Intl.PluralRules(locale, { type: 'ordinal' })
    const rule = pr.select(value)

    const suffixes: Record<string, string> = {
      one: 'st',
      two: 'nd',
      few: 'rd',
      other: 'th'
    }

    return `${value}${suffixes[rule] || 'th'}`
  }

  // 兼容方案
  const lastDigit = value % 10
  const lastTwoDigits = value % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${value}th`
  }

  switch (lastDigit) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}
