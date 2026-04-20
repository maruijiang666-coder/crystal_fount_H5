import { View, Text } from '@tarojs/components'
import './FontCheck.css'

export default function FontCheck() {
  return (
    <View className="font-check-container">
      <Text className="title">字体检查页面</Text>
      
      <View className="font-section">
        <Text className="section-title">1. 默认字体（应该显示张海山草体）</Text>
        <Text className="default-font">这是默认字体文本 abc 123</Text>
      </View>
      
      <View className="font-section">
        <Text className="section-title">2. 主要字体变量（--font-primary）</Text>
        <Text className="font-primary">主要字体：张海山草体 abc 123</Text>
      </View>
      
      <View className="font-section">
        <Text className="section-title">3. 方正行楷简体</Text>
        <Text className="font-fangzheng-xingkai">方正行楷简体 abc 123</Text>
      </View>
      
      <View className="font-section">
        <Text className="section-title">4. 汉仪雪君体简体</Text>
        <Text className="font-hanyi-xuejun-jian">汉仪雪君体简体 abc 123</Text>
      </View>
      
      <View className="font-section">
        <Text className="section-title">5. 汉仪雪君体繁体</Text>
        <Text className="font-hanyi-xuejun-fan">汉仪雪君体繁体 abc 123</Text>
      </View>
      
      <View className="font-section">
        <Text className="section-title">6. 系统备用字体</Text>
        <Text className="system-font" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>系统备用字体 abc 123</Text>
      </View>
      
      <View className="font-section">
        <Text className="section-title">7. 测试中文显示</Text>
        <Text className="default-font">运势金 水晶 好运 塔罗牌</Text>
      </View>
    </View>
  )
}