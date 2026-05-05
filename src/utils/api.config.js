// API 配置

// 获取 API 基础 URL
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__API_BASE_URL__ !== undefined) {
    return window.__API_BASE_URL__;
  }

  if (typeof API_BASE_URL !== 'undefined') {
    return API_BASE_URL;
  }

  return '';
};

// API 端点配置
export const API_ENDPOINTS = {
  // 认证相关
  WX_LOGIN: '/api/auth/wx/login/',
  WX_GET_PHONE: '/api/auth/wx/get_phone_number/',
  WX_VALIDATE: '/api/auth/wx/validate/',
  H5_SMS_SEND_CODE: '/api/auth/wx/send_login_sms/',
  H5_SMS_LOGIN: '/api/auth/wx/sms_login/',
  USER_ME: '/api/auth/users/me/',
  
  // 用户资料相关
  PROFILES: '/api/profiles/',

  // 水晶/运势相关
  FORTUNE_REPORT: '/api/fortune_report/',
  TOUCH_CRYSTAL: '/api/touch_crystal/',
  TOUCH_CRYSTAL_CONSUME_ENERGY: '/api/touch_crystal/consume_energy/',
  ACTIVATE_CRYSTAL: '/api/activate_crystal/',
  ACTIVATE_CRYSTAL_USER_TAGS: '/api/activate_crystal/user_nfc_tags/',
  YUNSHI_PODCAST: '/api/yunshi/fortune/podcast/',
  YUNSHI_REPORT: '/api/yunshi/fortune/report/',
  YUNSHI_TASKS: '/api/yunshi/fortune/tasks/',
  YUNSHI_MATCH_REPORT: '/api/yunshi/match/report/',
  
  // 其他端点可以在这里添加
};

// 获取完整 API URL
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};
