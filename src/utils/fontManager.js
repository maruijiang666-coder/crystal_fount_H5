/**
 * 字体管理工具
 * 统一管理所有字体相关配置和使用
 */

// 字体名称枚举
export const FontFamilies = {
  PRIMARY: 'ZhangHaishanCaoti',      // 张海山草体 - 主要中文字体
  SECONDARY: 'ZaoziGongfangShangHeiOss', // 造字工房尚黑 - 备用中文字体
  FANGZHENG_XINGKAI: 'FangzhengXingkaiJianti', // 方正行楷简体
  HANYI_XUEJUN_JIAN: 'HanyiXuejunJianti', // 汉仪雪君体简体
  HANYI_XUEJUN_FAN: 'HanyiXuejunFanti', // 汉仪雪君体繁体
  ZAOZI_OSS: 'ZaoziGongfangShangHeiOss', // 造字工房尚黑 (OSS版本)
  NUMBER: 'Inter',                   // 数字字体
  ENGLISH: 'Inter',                  // 英文字体
  FALLBACK: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

// 字体样式配置
export const FontStyles = {
  // 标题样式
  TITLE: {
    fontFamily: FontFamilies.PRIMARY,
    fontWeight: '600',
    fontStyle: 'normal'
  },
  
  // 正文样式
  CONTENT: {
    fontFamily: FontFamilies.PRIMARY,
    fontWeight: '400',
    fontStyle: 'normal'
  },
  
  // 数字样式
  NUMBER: {
    fontFamily: FontFamilies.NUMBER,
    fontWeight: '900',
    fontStyle: 'normal'
  },
  
  // 英文样式
  ENGLISH: {
    fontFamily: FontFamilies.ENGLISH,
    fontWeight: '500',
    fontStyle: 'normal'
  },
  
  // 特殊样式 - 水晶相关
  CRYSTAL: {
    fontFamily: FontFamilies.PRIMARY,
    fontWeight: '500',
    fontStyle: 'normal'
  },
  
  // 方正行楷样式
  FANGZHENG_XINGKAI: {
    fontFamily: FontFamilies.FANGZHENG_XINGKAI,
    fontWeight: '400',
    fontStyle: 'normal'
  },
  
  // 汉仪雪君简体样式
  HANYI_XUEJUN_JIAN: {
    fontFamily: FontFamilies.HANYI_XUEJUN_JIAN,
    fontWeight: '400',
    fontStyle: 'normal'
  },
  
  // 汉仪雪君繁体样式
  HANYI_XUEJUN_FAN: {
    fontFamily: FontFamilies.HANYI_XUEJUN_FAN,
    fontWeight: '400',
    fontStyle: 'normal'
  },
  
  // 造字工房OSS版本样式
  ZAOZI_OSS: {
    fontFamily: FontFamilies.ZAOZI_OSS,
    fontWeight: '400',
    fontStyle: 'normal'
  }
};

// 字体大小配置（可以根据需要调整）
export const FontSizes = {
  XS: '24px',
  SM: '28px',
  MD: '32px',
  LG: '40px',
  XL: '48px',
  XXL: '64px'
};

/**
 * 获取字体样式对象
 * @param {string} type - 字体类型 (title, content, number, english, crystal)
 * @param {string} size - 字体大小 (xs, sm, md, lg, xl, xxl)
 * @param {Object} custom - 自定义样式
 * @returns {Object} 完整的样式对象
 */
export function getFontStyle(type = 'content', size = 'md', custom = {}) {
  const baseStyle = FontStyles[type.toUpperCase()] || FontStyles.CONTENT;
  const fontSize = FontSizes[size.toUpperCase()] || FontSizes.MD;
  
  return {
    ...baseStyle,
    fontSize,
    ...custom
  };
}

/**
 * 获取字体类名
 * @param {string} type - 字体类型
 * @returns {string} CSS类名
 */
export function getFontClass(type = 'primary') {
  const classMap = {
    primary: 'font-primary',
    secondary: 'font-secondary',
    number: 'font-number',
    english: 'font-english',
    crystal: 'font-crystal',
    title: 'font-title',
    content: 'font-content',
    // 新添加的字体类名
    fangzheng_xingkai: 'font-fangzheng-xingkai',
    hanyi_xuejun_jian: 'font-hanyi-xuejun-jian',
    hanyi_xuejun_fan: 'font-hanyi-xuejun-fan',
    zaozi_oss: 'font-zaozi-oss'
  };
  
  return classMap[type] || 'font-primary';
}

/**
 * 检查字体是否加载完成
 * @param {string} fontFamily - 字体族名称
 * @returns {Promise<boolean>}
 */
export function checkFontLoaded(fontFamily) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      // 非浏览器环境，直接返回true
      resolve(true);
      return;
    }
    
    // 使用字体加载API检查
    if ('fonts' in document) {
      document.fonts.load(`1em "${fontFamily}"`).then(() => {
        resolve(document.fonts.check(`1em "${fontFamily}"`));
      }).catch(() => {
        resolve(false);
      });
    } else {
      // 降级处理
      resolve(true);
    }
  });
}

/**
 * 预加载字体
 * @param {Array<string>} fontFamilies - 要预加载的字体数组
 */
export async function preloadFonts(fontFamilies = [FontFamilies.PRIMARY, FontFamilies.SECONDARY]) {
  const loadPromises = fontFamilies.map(fontFamily => checkFontLoaded(fontFamily));
  
  try {
    await Promise.all(loadPromises);
    console.log('字体加载完成:', fontFamilies);
  } catch (error) {
    console.warn('字体加载失败:', error);
  }
}

// 默认导出常用函数
export default {
  FontFamilies,
  FontStyles,
  FontSizes,
  getFontStyle,
  getFontClass,
  checkFontLoaded,
  preloadFonts
};