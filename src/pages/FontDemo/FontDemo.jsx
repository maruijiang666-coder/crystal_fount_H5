import React, { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { getFontStyle, getFontClass, preloadFonts } from '../../utils/fontManager';
import './FontDemo.module.css';

/**
 * 字体演示页面
 * 展示如何使用新的字体管理系统
 */
export default function FontDemo() {
  useEffect(() => {
    // 预加载字体
    preloadFonts([
      'ZhangHaishanCaoti', 
      'ZaoziGongfangShangHeiOss',
      'FangzhengXingkaiJianti',
      'HanyiXuejunJianti',
      'HanyiXuejunFanti'
    ]);
  }, []);

  return (
    <View className="font-demo">
      <View className="header">
        <Text className="title">字体管理系统演示</Text>
        <Text className="subtitle">基于张海山草体的统一字体管理</Text>
      </View>

      <View className="demo-section">
        <Text className="section-title">1. CSS类名方式使用</Text>
        
        <View className="demo-item">
          <Text className="font-primary">张海山草体 - 主要字体</Text>
          <Text className="label">使用类名: font-primary</Text>
        </View>

        <View className="demo-item">
          <Text className="font-secondary">造字工房尚黑 - 备用字体</Text>
          <Text className="label">使用类名: font-secondary</Text>
        </View>

        <View className="demo-item">
          <Text className="font-fangzheng-xingkai">方正行楷简体 - 书法风格</Text>
          <Text className="label">使用类名: font-fangzheng-xingkai</Text>
        </View>

        <View className="demo-item">
          <Text className="font-hanyi-xuejun-jian">汉仪雪君体简体 - 优雅风格</Text>
          <Text className="label">使用类名: font-hanyi-xuejun-jian</Text>
        </View>

        <View className="demo-item">
          <Text className="font-hanyi-xuejun-fan">漢儀雪君體繁體 - 繁體風格</Text>
          <Text className="label">使用类名: font-hanyi-xuejun-fan</Text>
        </View>

        <View className="demo-item">
          <Text className="font-zaozi-oss">造字工房尚黑OSS - 现代风格</Text>
          <Text className="label">使用类名: font-zaozi-oss</Text>
        </View>

        <View className="demo-item">
          <Text className="font-number">1234567890</Text>
          <Text className="label">使用类名: font-number</Text>
        </View>

        <View className="demo-item">
          <Text className="font-title">标题样式字体</Text>
          <Text className="label">使用类名: font-title</Text>
        </View>

        <View className="demo-item">
          <Text className="font-content">正文样式字体</Text>
          <Text className="label">使用类名: font-content</Text>
        </View>
      </View>

      <View className="demo-section">
        <Text className="section-title">2. 内联样式方式使用</Text>
        
        <View className="demo-item">
          <Text style={getFontStyle('title', 'lg')}>大标题样式</Text>
          <Text className="label">getFontStyle('title', 'lg')</Text>
        </View>

        <View className="demo-item">
          <Text style={getFontStyle('content', 'md')}>正文内容样式</Text>
          <Text className="label">getFontStyle('content', 'md')</Text>
        </View>

        <View className="demo-item">
          <Text style={getFontStyle('fangzheng_xingkai', 'lg')}>方正行楷书法风格</Text>
          <Text className="label">getFontStyle('fangzheng_xingkai', 'lg')</Text>
        </View>

        <View className="demo-item">
          <Text style={getFontStyle('hanyi_xuejun_jian', 'md')}>汉仪雪君简体优雅风格</Text>
          <Text className="label">getFontStyle('hanyi_xuejun_jian', 'md')</Text>
        </View>

        <View className="demo-item">
          <Text style={getFontStyle('hanyi_xuejun_fan', 'lg')}>漢儀雪君繁體傳統風格</Text>
          <Text className="label">getFontStyle('hanyi_xuejun_fan', 'lg')</Text>
        </View>

        <View className="demo-item">
          <Text style={getFontStyle('number', 'xl')}>888</Text>
          <Text className="label">getFontStyle('number', 'xl')</Text>
        </View>

        <View className="demo-item">
          <Text style={getFontStyle('crystal', 'lg', { color: '#d6a207' })}>水晶相关文字</Text>
          <Text className="label">getFontStyle(&#39;crystal&#39;, &#39;lg&#39;, &#123; color: &#39;#d6a207&#39; &#125;)</Text>
        </View>
      </View>

      <View className="demo-section">
        <Text className="section-title">3. 不同大小对比</Text>
        
        <View className="size-demo">
          <Text style={getFontStyle('content', 'xs')}>最小文字 (xs)</Text>
          <Text style={getFontStyle('content', 'sm')}>小文字 (sm)</Text>
          <Text style={getFontStyle('content', 'md')}>中等文字 (md)</Text>
          <Text style={getFontStyle('content', 'lg')}>大文字 (lg)</Text>
          <Text style={getFontStyle('content', 'xl')}>特大文字 (xl)</Text>
          <Text style={getFontStyle('content', 'xxl')}>最大文字 (xxl)</Text>
        </View>
      </View>

      <View className="demo-section">
        <Text className="section-title">4. 实际应用场景</Text>
        
        <View className="app-demo">
          <View className="crystal-card">
            <Text className="crystal-name" style={getFontStyle('crystal', 'lg')}>紫水晶</Text>
            <Text className="crystal-desc" style={getFontStyle('content', 'sm')}>提升直觉与灵性</Text>
            <Text className="crystal-number" style={getFontStyle('number', 'xl')}>88</Text>
          </View>
          
          <View className="fortune-item">
            <Text className="fortune-title" style={getFontStyle('title', 'md')}>今日运势</Text>
            <Text className="fortune-score" style={getFontStyle('number', 'lg')}>95</Text>
            <Text className="fortune-text" style={getFontStyle('content', 'sm')}>运势极佳</Text>
          </View>
        </View>
      </View>

      <View className="tips">
        <Text className="tips-title">使用提示</Text>
        <Text className="tips-content">• 推荐使用CSS类名方式，性能更好</Text>
        <Text className="tips-content">• 动态样式使用getFontStyle函数</Text>
        <Text className="tips-content">• 字体已预加载，无需担心加载问题</Text>
        <Text className="tips-content">• 支持自定义颜色和大小组合</Text>
      </View>
    </View>
  );
}