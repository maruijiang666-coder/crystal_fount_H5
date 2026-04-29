import React, { useEffect, useState, useRef } from 'react';
import { View } from '@tarojs/components';
import styles from './index.module.css';

const Digit = ({ value, height = 30, fontSize = 24 }) => {
  // 生成 0-9-0 的序列，确保滚动连续性
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  
  // value 是处理过的“显示值”，比如 3.5
  // 我们取模 10，得到 3.5
  // 对应的位移是 -3.5 * height
  const offset = value % 10;
  
  // translateY 是负值，向上移动
  const translateY = -(offset * height);

  return (
    <View className={styles.digitWindow} style={{ height: `${height}px`, width: `${fontSize * 0.8}px` }}>
      <View 
        className={styles.digitList}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {numbers.map((num, index) => (
          <View 
            key={index} 
            className={styles.digit}
            style={{ height: `${height}px`, fontSize: `${fontSize}px`, lineHeight: `${height}px` }}
          >
            {num}
          </View>
        ))}
      </View>
    </View>
  );
};

export default function RollingNumber({ value, height = 30, fontSize = 24 }) {
  const [currentValue, setCurrentValue] = useState(value);
  const requestRef = useRef();
  const startTimeRef = useRef();
  const startValueRef = useRef(value);
  const targetValueRef = useRef(value);

  // 监听 value 变化并启动动画
  useEffect(() => {
    if (value !== targetValueRef.current) {
      startValueRef.current = currentValue;
      targetValueRef.current = value;
      startTimeRef.current = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const duration = 2000; // 2秒动画
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease Out Cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        
        const nextVal = startValueRef.current + (targetValueRef.current - startValueRef.current) * ease;
        setCurrentValue(nextVal);
        
        if (progress < 1) {
          requestRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentValue(targetValueRef.current);
        }
      };
      
      // 取消之前的动画
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [value]);

  // 初始化同步
  useEffect(() => {
    if (Math.abs(currentValue - value) < 0.01 && currentValue !== value) {
        setCurrentValue(value);
    }
  }, [value]);


  // 动态计算位数
  const maxVal = Math.max(targetValueRef.current, currentValue);
  const digitCount = Math.max(String(Math.floor(maxVal)).length, 1);
  
  const digits = [];
  
  // 从高位到低位渲染
  for (let i = digitCount - 1; i >= 0; i--) {
    let digitValue;
    
    if (i === 0) {
      // 个位：连续滚动
      digitValue = currentValue;
    } else {
      // 高位：机械里程表逻辑
      // 只有当低一位 (i-1) 的值超过 9 时，当前位才开始转动
      
      const divisor = Math.pow(10, i);
      const prevDivisor = Math.pow(10, i - 1);
      
      // 低一位的完整值（包含小数）
      const prevVal = currentValue / prevDivisor;
      // 低一位的当前显示数字（0-10）
      const prevRemainder = prevVal % 10;
      
      // 当前位的理论值
      const rawVal = currentValue / divisor;
      
      if (prevRemainder > 9) {
        // 如果低位在 9-10 之间（即正在进位），高位跟随转动
        // 比如 39.5 -> 低位是 9.5 -> 高位应该是 3.5
        digitValue = Math.floor(rawVal) + (prevRemainder - 9);
      } else {
        // 否则高位保持整数状态
        // 比如 38.5 -> 低位是 8.5 -> 高位应该是 3.0
        digitValue = Math.floor(rawVal);
      }
    }
    
    digits.push(
      <Digit 
        key={i} 
        value={digitValue} 
        height={height} 
        fontSize={fontSize}
      />
    );
  }

  return (
    <View className={styles.container} style={{ height: `${height}px` }}>
      {digits}
    </View>
  );
}
