# CustomCard 组件使用说明

## 组件描述
自定义卡片组件，使用 flex-column 布局，支持动态文字内容。

## 特性
- ✅ 使用 flex-column 布局，无绝对定位
- ✅ 无 z-index 控制
- ✅ 支持动态文字内容（title 和 description）
- ✅ 图片固定，文字可变
- ✅ 响应式设计

## 使用方法

### 方式一：从组件文件夹直接导入
```jsx
import CustomCard from '../../components/CustomCard/index.jsx'

<CustomCard 
  title="健康"
  description="桃花窗口仍在，但"质量"比"数量"更值得评估..."
/>
```

### 方式二：从统一导出文件导入
```jsx
import { CustomCard } from '@/components'

<CustomCard 
  title="财富"
  description="本月财运旺盛，适合投资理财..."
/>
```

## Props 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | '健康' | 卡片标题（动态） |
| description | string | 默认描述文本 | 卡片描述内容（动态） |
| image | string | 默认图片URL | 卡片图片（固定） |
| className | string | '' | 自定义样式类名 |
| style | object | {} | 自定义内联样式 |
| onClick | function | - | 点击事件处理函数 |
| children | ReactNode | - | 自定义子元素（会覆盖默认结构） |

## 使用示例

### 基础使用
```jsx
<CustomCard 
  title="事业"
  descript