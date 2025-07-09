/**
 * API错误码常量
 * API error code constants
 */

// 通用错误码 (10000-19999)
// Common error codes (10000-19999)
export const COMMON_ERROR = {
  UNKNOWN: { code: 10000, message: 'Unknown error' },
  SYSTEM_ERROR: { code: 10001, message: 'System error' },
  PARAM_ERROR: { code: 10002, message: 'Parameter error' },
  REQUEST_ERROR: { code: 10003, message: 'Request error' },
  VALIDATION_ERROR: { code: 10004, message: 'Data validation failed' },
  RATE_LIMIT: { code: 10005, message: 'Request rate limit exceeded' }
} as const

// 认证相关错误码 (20000-29999)
// Authentication related error codes (20000-29999)
export const AUTH_ERROR = {
  UNAUTHORIZED: { code: 20001, message: 'Unauthorized, please login first' },
  FORBIDDEN: { code: 20002, message: 'No access permission' },
  LOGIN_FAILED: {
    code: 20003,
    message: 'Login failed, incorrect username or password'
  },
  TOKEN_EXPIRED: { code: 20004, message: 'Login expired, please login again' },
  INVALID_TOKEN: { code: 20005, message: 'Invalid authentication token' },
  ACCOUNT_DISABLED: { code: 20006, message: 'Account has been disabled' },
  ACCOUNT_LOCKED: {
    code: 20007,
    message: 'Account has been locked, please try again later'
  },
  INVALID_CREDENTIALS: { code: 20008, message: 'Invalid credentials' },
  REGISTRATION_FAILED: { code: 20009, message: 'Registration failed' },
  EMAIL_EXISTS: { code: 20010, message: 'Email already exists' }
} as const

// 用户相关错误码 (30000-39999)
// User related error codes (30000-39999)
export const USER_ERROR = {
  NOT_FOUND: { code: 30001, message: 'User does not exist' },
  UPDATE_FAILED: { code: 30002, message: 'User information update failed' },
  CREATE_FAILED: { code: 30003, message: 'User creation failed' },
  DELETE_FAILED: { code: 30004, message: 'User deletion failed' },
  INVALID_PROFILE: { code: 30005, message: 'Invalid user profile' },
  SYNC_FAILED: {
    code: 30006,
    message: 'User information synchronization failed'
  },
  PERMISSION_RETRIEVAL_FAILED: {
    code: 30007,
    message: 'User permission retrieval failed'
  }
} as const

// 角色权限相关错误码 (40000-49999)
// Role and permission related error codes (40000-49999)
export const ROLE_PERMISSION_ERROR = {
  ROLE_NOT_FOUND: { code: 40001, message: 'Role does not exist' },
  PERMISSION_NOT_FOUND: { code: 40002, message: 'Permission does not exist' },
  ROLE_CREATE_FAILED: { code: 40003, message: 'Role creation failed' },
  PERMISSION_CREATE_FAILED: {
    code: 40004,
    message: 'Permission creation failed'
  },
  ROLE_UPDATE_FAILED: { code: 40005, message: 'Role update failed' },
  PERMISSION_UPDATE_FAILED: {
    code: 40006,
    message: 'Permission update failed'
  },
  ROLE_DELETE_FAILED: { code: 40007, message: 'Role deletion failed' },
  PERMISSION_DELETE_FAILED: {
    code: 40008,
    message: 'Permission deletion failed'
  },
  PERMISSION_ASSIGN_FAILED: {
    code: 40009,
    message: 'Permission assignment failed'
  }
} as const

// 数据相关错误码 (50000-59999)
// Data related error codes (50000-59999)
export const DATA_ERROR = {
  NOT_FOUND: { code: 50001, message: 'Data does not exist' },
  CREATE_FAILED: { code: 50002, message: 'Data creation failed' },
  UPDATE_FAILED: { code: 50003, message: 'Data update failed' },
  DELETE_FAILED: { code: 50004, message: 'Data deletion failed' },
  QUERY_FAILED: { code: 50005, message: 'Data query failed' },
  VALIDATION_FAILED: { code: 50006, message: 'Data validation failed' },
  DUPLICATE_ENTRY: { code: 50007, message: 'Data already exists' }
} as const

// 将所有错误码合并为一个对象
// Merge all error codes into one object
export const ERROR_CODES = {
  ...COMMON_ERROR,
  ...AUTH_ERROR,
  ...USER_ERROR,
  ...ROLE_PERMISSION_ERROR,
  ...DATA_ERROR
} as const

// 错误码类型定义
// Error code type definition
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]['code']

// HTTP状态码映射到自定义错误码
// HTTP status code mapping to custom error codes
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: COMMON_ERROR.PARAM_ERROR.code,
  401: AUTH_ERROR.UNAUTHORIZED.code,
  403: AUTH_ERROR.FORBIDDEN.code,
  404: DATA_ERROR.NOT_FOUND.code,
  422: COMMON_ERROR.VALIDATION_ERROR.code,
  429: COMMON_ERROR.RATE_LIMIT.code,
  500: COMMON_ERROR.SYSTEM_ERROR.code
} as const
