import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Image, Text } from '@tarojs/components';
import styles from './index.module.css';

const CardSlider = forwardRef((props, ref) => {
  const { 
    totalCards = 78, 
    defaultSelectedIndex = 60, 
    visibleCount = 11, 
    imageUrl = "https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/TaLuo/oneCard.png",
    onCardSelect,
    onSwipeUp,
    onInSliderChange,
    cardWidth = 124,
    cardHeight = 186
  } = props;

  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);
  const [leftCount, setLeftCount] = useState(5);
  const [rightCount, setRightCount] = useState(5);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isTouchingRef = useRef(false);
  const gestureIntentRef = useRef('pending');

  const calculateLeftCount = (index) => {
    if (index <= 4) {
      return Math.max(0, index - 1);
    }
    return 5;
  };

  const calculateRightCount = (index) => {
    const remainingRight = totalCards - 1 - index;
    if (remainingRight < 5) {
      return remainingRight;
    }
    return 5;
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    isTouchingRef.current = true;
    gestureIntentRef.current = 'pending';
    if (onInSliderChange) onInSliderChange(true);
    console.log('[CardSlider] touchstart', {
      x: touchStartXRef.current,
      y: touchStartYRef.current,
      selectedIndex,
    });
  };

  const handleTouchMove = (e) => {
    if (!isTouchingRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (gestureIntentRef.current === 'pending') {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > 12 || absY > 12) {
        gestureIntentRef.current = absX > absY ? 'horizontal' : 'vertical';
        console.log('[CardSlider] gesture decided', {
          intent: gestureIntentRef.current,
          deltaX,
          deltaY,
          selectedIndex,
        });
        if (gestureIntentRef.current === 'horizontal') {
          if (onInSliderChange) onInSliderChange(true);
        } else if (onInSliderChange) {
          onInSliderChange(false);
        }
      }
    }

    console.log('[CardSlider] touchmove', {
      deltaX,
      deltaY,
      intent: gestureIntentRef.current,
      selectedIndex,
    });
    
    if (gestureIntentRef.current === 'horizontal') {
      try {
        e.preventDefault();
      } catch (err) {
        console.log('preventDefault not supported');
      }
      setDragOffsetX(deltaX * 0.25);
    }
  };

  const handleTouchEnd = (e) => {
    if (!isTouchingRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    console.log('[CardSlider] touchend raw', {
      deltaX,
      deltaY,
      selectedIndex,
      dragOffsetX,
    });
    console.log('[CardSlider] touchend:start', {
      deltaX,
      deltaY,
      selectedIndex,
      leftCount,
      rightCount,
    });
    
    const minSwipeDistance = 24;
    const isHorizontalSwipe = gestureIntentRef.current === 'horizontal' || Math.abs(deltaX) > Math.abs(deltaY) * 0.8;
    if (isHorizontalSwipe && Math.abs(deltaX) > minSwipeDistance) {
      const swipeIntensity = Math.abs(deltaX);
      let cardChangeCount = 1;
      
      if (swipeIntensity > 200) {
        cardChangeCount = 4;
      } else if (swipeIntensity > 150) {
        cardChangeCount = 3;
      } else if (swipeIntensity > 100) {
        cardChangeCount = 2;
      } else {
        cardChangeCount = 1;
      }
      
      if (deltaX > 0) {
        console.log('[CardSlider] swipe -> left', { cardChangeCount, deltaX });
        handleSelectMultipleLeft(cardChangeCount);
      } else {
        console.log('[CardSlider] swipe -> right', { cardChangeCount, deltaX });
        handleSelectMultipleRight(cardChangeCount);
      }
    } else {
      console.log('[CardSlider] touchend ignored', {
        minSwipeDistance,
        horizontal: Math.abs(deltaX) > Math.abs(deltaY),
        distance: Math.abs(deltaX),
      });
      if (deltaY > 100 && onSwipeUp) {
        onSwipeUp(selectedIndex);
      }
    }
    
    isTouchingRef.current = false;
    gestureIntentRef.current = 'pending';
    setDragOffsetX(0);
    if (onInSliderChange) {
      onInSliderChange(false);
    }
  };

  const handleTouchCancel = () => {
    isTouchingRef.current = false;
    gestureIntentRef.current = 'pending';
    setDragOffsetX(0);
    if (onInSliderChange) {
      onInSliderChange(false);
    }
  };

  useEffect(() => {
    setLeftCount(calculateLeftCount(selectedIndex));
    setRightCount(calculateRightCount(selectedIndex));
    console.log('[CardSlider] selectedIndex changed', {
      selectedIndex,
      leftCount: calculateLeftCount(selectedIndex),
      rightCount: calculateRightCount(selectedIndex),
    });
  }, [selectedIndex]);

  // 组件初始化时设置正确的leftCount和rightCount
  useEffect(() => {
    setLeftCount(calculateLeftCount(selectedIndex));
    setRightCount(calculateRightCount(selectedIndex));
  }, []);

  // 确保父组件总是知道当前选中的卡片
  useEffect(() => {
    if (onCardSelect) {
      onCardSelect(selectedIndex);
    }
  }, [selectedIndex]);

  // 处理向左选择
  const handleSelectLeft = () => {
    setSelectedIndex(prevIndex => {
      const nextIndex = Math.max(0, prevIndex - 1);
      console.log('[CardSlider] handleSelectLeft', { prevIndex, nextIndex });
      return nextIndex;
    });
  };

  // 处理向右选择
  const handleSelectRight = () => {
    setSelectedIndex(prevIndex => {
      const nextIndex = Math.min(totalCards - 1, prevIndex + 1);
      console.log('[CardSlider] handleSelectRight', { prevIndex, nextIndex });
      return nextIndex;
    });
  };

  // 处理多张卡片向左切换
  const handleSelectMultipleLeft = (count) => {
    setSelectedIndex(prevIndex => {
      const nextIndex = Math.max(0, prevIndex - count);
      console.log('[CardSlider] handleSelectMultipleLeft', { prevIndex, count, nextIndex });
      return nextIndex;
    });
  };

  // 处理多张卡片向右切换
  const handleSelectMultipleRight = (count) => {
    setSelectedIndex(prevIndex => {
      const nextIndex = Math.min(totalCards - 1, prevIndex + count);
      console.log('[CardSlider] handleSelectMultipleRight', { prevIndex, count, nextIndex });
      return nextIndex;
    });
  };

  // 公开方法供父组件调用
  useImperativeHandle(ref, () => ({
    selectLeft: handleSelectLeft,
    selectRight: handleSelectRight,
    getSelectedIndex: () => selectedIndex
  }), [selectedIndex]);

  return (
    <View 
      className={styles.sliderContainer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {Array.from({ length: leftCount + 1 + rightCount }, (_, displayIndex) => {
        const startIndex = Math.max(0, selectedIndex - leftCount);
        const actualIndex = Math.min(totalCards - 1, startIndex + displayIndex);
        
        // 扁平牌阵：更接近参考图的横向展开与轻弧度
        const displayCenterIndex = leftCount;
        const distanceFromCenter = displayIndex - displayCenterIndex;
        const absDistance = Math.abs(distanceFromCenter);
        const x = distanceFromCenter * 29;
        const y = absDistance * absDistance * 1.5 + absDistance * 2;
        const rotation = distanceFromCenter * 5.8;
        const scale = displayIndex === leftCount ? 1.04 : Math.max(0.9, 1 - absDistance * 0.018);
        const dragFollow = dragOffsetX * 0.22;
        
        return (
          <Image
            key={actualIndex}
            className={styles.cardImage}
            src={imageUrl}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: displayIndex === leftCount
                ? `translate(-50%, -50%) translateX(${dragFollow}px) rotate(${rotation}deg) scale(${scale})`
                : `translate(-50%, -50%) translateX(${dragFollow}px) rotate(${rotation}deg) scale(${scale})`,
              zIndex: displayIndex === leftCount ? 999 : 500 - Math.abs(distanceFromCenter),
              filter: displayIndex === leftCount ? 'none' : 'grayscale(50%) brightness(70%)',
              transition: 'all 0.2s ease-out',
              width: `${cardWidth}px`,
              height: `${cardHeight}px`
            }}
          />
        );
      })}
      
      {/* 选中卡片提示 */}
      <View style={{
        position: 'absolute',
        left: '50%',
        top: 'calc(50% - 170px)',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '4px 12px',
        borderRadius: '8px'
      }}>
        <Text style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          第{selectedIndex + 1}张
        </Text>
      </View>
    </View>
  );
});

CardSlider.defaultProps = {
  totalCards: 78,
  defaultSelectedIndex: 60,
  visibleCount: 11,
  cardWidth: 124,
  cardHeight: 186
};

CardSlider.displayName = 'CardSlider';

export default CardSlider;
