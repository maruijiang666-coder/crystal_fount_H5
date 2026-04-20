import { View, Text, Image } from '@tarojs/components'
import './index.css'

/**
 * 自定义卡片组件 - 使用flex-column布局，避免绝对定位
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子元素内容（可选）
 * @param {string} props.className - 自定义样式类名（可选）
 * @param {Object} props.style - 自定义内联样式（可选）
 * @param {Function} props.onClick - 点击事件处理函数（可选）
 * @param {string} props.image - 图片URL（可选）
 * @param {string} props.title - 标题文字（可选，默认显示"健康"）
 * @param {string} props.description - 描述文字（可选）
 */
const CustomCard = (props) => {
  const { 
    children, 
    className, 
    style, 
    onClick, 
    image = 'https://ide.code.fun/api/image?token=69290ea0043f1900118ee756&name=eeacc8e98445154364ba7a0e8f863b15.png',
    title = '健康',
    description = '桃花窗口仍在，但"质量"比"数量"更值得评估。白羊、天秤、射手会遇到多位示好对象，却可能因自己标准模糊而错过最佳互动时机；慢下来、先观察兴趣价值观是否合拍，再决定要不要深入'
  } = props

  // 如果提供了children，优先使用children内容
  if (children) {
    return (
      <View 
        className={`custom-card ${className || ''}`}
        style={style}
        onClick={onClick}
      >
        {children}
      </View>
    )
  }

  // 默认结构 - 使用flex-column布局，避免绝对定位
  return (
    <View 
      className={`custom-card ${className || ''}`}
      style={style}
      onClick={onClick}
    >
      {/* 图片区域 */}
      <View className="custom-card-image-wrapper">
        <Image
          className="custom-card-image"
          src={image}
          mode="aspectFit"
        />
      </View>
      
      {/* 内容区域 */}
      <View className="custom-card-content">
        {/* 标题区域 */}
        <View className="custom-card-header">
          <Text className="custom-card-title">{title}</Text>
        </View>
        
        {/* 描述内容区域 */}
        <View className="custom-card-body">
          <Text className="custom-card-description">
            {description}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default CustomCard