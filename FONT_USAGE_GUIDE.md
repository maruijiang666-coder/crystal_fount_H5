# 字体管理系统使用指南

## 🎯 概述

我已经为你创建了一个完整的字体管理系统，成功引入了阿里云OSS上的多种字体，并提供了统一的字体管理方案。

### 🆕 新增字体
- **张海山草体** - 主要中文字体，书法风格
- **方正行楷简体** - 行楷书法风格，适合标题
- **汉仪雪君体简体** - 优雅现代风格，适合正文
- **汉仪雪君体繁体** - 传统繁体风格，适合特殊场景
- **造字工房尚黑常规体 (OSS版本)** - 现代简约风格，备用字体

## 📁 文件结构

```
src/
├── styles/
│   └── fonts.css              # 字体定义和CSS变量
├── utils/
│   └── fontManager.js         # 字体管理工具函数
└── pages/
    └── FontDemo/              # 字体演示页面
        ├── FontDemo.jsx
        └── FontDemo.module.css
```

## 🚀 快速开始

### 1. 引入字体管理（已完成）

在 `src/app.css` 中已经自动引入了字体管理：

```css
@import './styles/fonts.css';
```

### 2. 使用方式

#### 方式一：CSS类名（推荐）

```jsx
import { View, Text } from '@tarojs/components';

// 使用CSS类名
<Text className="font-primary">张海山草体主要字体</Text>
<Text className="font-number">1234567890</Text>
<Text className="font-title">标题样式</Text>
<Text className="font-content">正文内容</Text>
<Text className="font-crystal">水晶相关文字</Text>
```

#### 方式二：内联样式（动态样式）

```jsx
import { getFontStyle } from '../../utils/fontManager.js';

// 基本使用
<Text style={getFontStyle('title', 'lg')}>大标题</Text>
<Text style={getFontStyle('content', 'md')}>正文内容</Text>
<Text style={getFontStyle('number', 'xl')}>888</Text>

// 自定义颜色和样式
<Text style={getFontStyle('crystal', 'lg', { color: '#d6a207' })}>
  水晶相关文字
</Text>
```

## 🎨 可用字体类型

| 类型 | CSS类名 | 函数参数 | 用途 |
|-----|---------|----------|------|
| 主要字体 | `font-primary` | `'primary'` | 主要中文字体（张海山草体） |
| 备用字体 | `font-secondary` | `'secondary'` | 造字工房尚黑 |
| 方正行楷 | `font-fangzheng-xingkai` | `'fangzheng_xingkai'` | 方正行楷简体 - 书法风格 |
| 汉仪雪君简体 | `font-hanyi-xuejun-jian` | `'hanyi_xuejun_jian'` | 汉仪雪君体简体 - 优雅风格 |
| 汉仪雪君繁体 | `font-hanyi-xuejun-fan` | `'hanyi_xuejun_fan'` | 汉仪雪君体繁体 - 传统风格 |
| 造字工房OSS | `font-zaozi-oss` | `'zaozi_oss'` | 造字工房尚黑OSS版本 - 现代风格 |
| 数字字体 | `font-number` | `'number'` | 数字显示 |
| 英文字体 | `font-english` | `'english'` | 英文显示 |
| 标题样式 | `font-title` | `'title'` | 标题文字 |
| 正文样式 | `font-content` | `'content'` | 正文内容 |
| 水晶样式 | `font-crystal` | `'crystal'` | 水晶相关文字 |

## 📏 字体大小

| 大小 | 函数参数 | 尺寸 |
|------|----------|------|
| 最小 | `'xs'` | 24rpx |
| 小 | `'sm'` | 28rpx |
| 中 | `'md'` | 32rpx |
| 大 | `'lg'` | 40rpx |
| 特大 | `'xl'` | 48rpx |
| 最大 | `'xxl'` | 64rpx |

## 💎 实际应用示例

### 水晶卡片
```jsx
import { getFontStyle } from '../../utils/fontManager.js';

<View className="crystal-card">
  <Text style={getFontStyle('crystal', 'lg')}>紫水晶</Text>
  <Text style={getFontStyle('content', 'sm')}>提升直觉与灵性</Text>
  <Text style={getFontStyle('number', 'xl')}>88</Text>
</View>
```

### 运势显示
```jsx
<View className="fortune-item">
  <Text style={getFontStyle('title', 'md')}>今日运势</Text>
  <Text style={getFontStyle('number', 'lg')}>95</Text>
  <Text style={getFontStyle('content', 'sm')}>运势极佳</Text>
</View>
```

### 书法风格标题
```jsx
<Text style={getFontStyle('fangzheng_xingkai', 'xl')}>书法风格标题</Text>
```

### 优雅内容展示
```jsx
<Text style={getFontStyle('hanyi_xuejun_jian', 'md')}>优雅的内容展示</Text>
```

### 传统繁体风格
```jsx
<Text style={getFontStyle('hanyi_xuejun_fan', 'lg')}>傳統繁體風格</Text>
```

## 🔧 高级功能

### 预加载字体
```jsx
import { preloadFonts } from '../../utils/fontManager.js';

useEffect(() => {
  preloadFonts([
    'ZhangHaishanCaoti', 
    'ZaoziGongfangShangHei',
    'FangzhengXingkaiJianti',
    'HanyiXuejunJianti',
    'HanyiXuejunFanti',
    'ZaoziGongfangShangHeiOss'
  ]);
}, []);
```

### 检查字体加载状态
```jsx
import { checkFontLoaded } from '../../utils/fontManager.js';

const isLoaded = await checkFontLoaded('ZhangHaishanCaoti');
```

## 🆕 添加新字体

如果你想添加更多字体，按照以下步骤：

### 1. 在 `src/styles/fonts.css` 中添加字体定义

```css
@font-face {
  font-family: 'NewFontName';
  src: url('https://your-font-url.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* 添加CSS变量 */
:root {
  --font-newfont: 'NewFontName', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

/* 添加CSS类 */
.font-newfont {
  font-family: var(--font-newfont);
}
```

### 2. 在 `src/utils/fontManager.js` 中更新配置

```javascript
export const FontFamilies = {
  // ... 现有字体
  NEWFONT: 'NewFontName'
};

export const FontStyles = {
  // ... 现有样式
  NEWSTYLE: {
    fontFamily: FontFamilies.NEWFONT,
    fontWeight: '400',
    fontStyle: 'normal'
  }
};

// 更新getFontClass函数
export function getFontClass(type = 'primary') {
  const classMap = {
    // ... 现有映射
    newfont: 'font-newfont'
  };
  
  return classMap[type] || 'font-primary';
}
```

### 3. 使用新字体

```jsx
// CSS类名方式
<Text className="font-newfont">新字体文字</Text>

// 内联样式方式
<Text style={getFontStyle('newstyle', 'md')}>新字体文字</Text>
```

## 🎨 CSS变量

系统定义了以下CSS变量，你可以在任何地方使用：

```css
:root {
  --font-primary: 'ZhangHaishanCaoti', -apple-system, sans-serif;
  --font-secondary: 'ZaoziGongfangShangHei', -apple-system, sans-serif;
  --font-fangzheng-xingkai: 'FangzhengXingkaiJianti', -apple-system, sans-serif;
  --font-hanyi-xuejun-jian: 'HanyiXuejunJianti', -apple-system, sans-serif;
  --font-hanyi-xuejun-fan: 'HanyiXuejunFanti', -apple-system, sans-serif;
  --font-zaozi-oss: 'ZaoziGongfangShangHeiOss', -apple-system, sans-serif;
  --font-number: 'Inter', 'Helvetica Neue', sans-serif;
  --font-fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

使用方式：
```css
.my-text {
  font-family: var(--font-primary);
}
```

## 📱 演示页面

我创建了一个字体演示页面，你可以通过以下方式访问：

1. 在微信开发者工具中，导航到 `pages/FontDemo/FontDemo` 页面
2. 或者修改某个页面的跳转逻辑，跳转到字体演示页面

演示页面展示了：
- 所有字体类型的视觉效果
- 不同字体大小的对比
- 实际应用场景示例
- 使用方法和最佳实践

## ⚡ 性能优化

1. **字体预加载**：系统会自动预加载主要字体
2. **字体显示策略**：使用 `font-display: swap` 提高加载性能
3. **备用字体**：每个字体都有完整的备用字体栈
4. **CSS变量**：减少重复代码，提高渲染效率

## 🎯 最佳实践

1. **优先使用CSS类名**：性能更好，代码更清晰
2. **动态样式使用函数**：需要条件渲染时使用 `getFontStyle()`
3. **保持一致性**：相同类型的文字使用相同的字体样式
4. **注意可读性**：中文内容优先使用 `font-primary`（张海山草体）
5. **数字显示**：使用 `font-number` 获得更好的数字显示效果

## 🔍 调试建议

1. 在微信开发者工具中查看控制台，确认字体加载状态
2. 使用演示页面测试不同字体效果
3. 检查网络请求，确认字体文件正确加载
4. 如有字体显示问题，检查CSS变量是否正确应用

---

现在你可以享受统一的字体管理系统了！🎉