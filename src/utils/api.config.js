// API 配置

// 获取 API 基础 URL
export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

// API 端点配置
export const API_ENDPOINTS = {
  // 认证相关
  WX_LOGIN: '/api/auth/wx/login/',
  WX_GET_PHONE: '/api/auth/wx/get_phone_number/',
  WX_VALIDATE: '/api/auth/wx/validate/',
  USER_ME: '/api/auth/users/me/',
  
  // 用户资料相关
  PROFILES: '/api/profiles/',
  
  // 其他端点可以在这里添加
};

// 获取完整 API URL
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};