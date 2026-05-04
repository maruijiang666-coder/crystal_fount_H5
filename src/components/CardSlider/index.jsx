import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Image, Text } from '@tarojs/components';
import styles from './index.module.css';

const CardSlider = forwardRef((props, ref) => {
  const { 
    totalCards = 78, 
    defaultSelectedIndex = 60, 
    imageUrl = "https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/TaLuo/oneCard.png",
    onCardSelect,
    onSwipeUp,
    cardWidth = 124,
    cardHeight = 186,
    style
  } = props;

  const [activePosition, setActivePosition] = useState(defaultSelectedIndex);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const touchStartPositionRef = useRef(defaultSelectedIndex);
  const lastTouchXRef = useRef(0);
  const lastTouchTimeRef = useRef(0);
  const swipeVelocityRef = useRef(0);
  const isTouchingRef = useRef(false);
  const gestureIntentRef = useRef('pending');
  const dragOffsetFrameRef = useRef(null);
  const pendingPositionRef = useRef(defaultSelectedIndex);
  const DRAG_INTENT_THRESHOLD = 12;
  const SWIPE_SNAP_DISTANCE = Math.max(60, Math.round(cardWidth * 0.56));
  const MAX_VISIBLE_SIDE_CARDS = 5;
  const RENDER_BUFFER = 1;
  const maxIndex = Math.max(0, totalCards - 1);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const selectedIndex = clamp(Math.round(activePosition), 0, maxIndex);

  const applyPositionResistance = (nextPosition) => {
    if (nextPosition < 0) {
      return nextPosition * 0.3;
    }

    if (nextPosition > maxIndex) {
      return maxIndex + (nextPosition - maxIndex) * 0.3;
    }

    return nextPosition;
  };

  const cancelPendingDragOffsetUpdate = () => {
    if (dragOffsetFrameRef.current === null) return;

    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(dragOffsetFrameRef.current);
    } else {
      clearTimeout(dragOffsetFrameRef.current);
    }

    dragOffsetFrameRef.current = null;
  };

  const schedulePositionUpdate = (nextPosition) => {
    pendingPositionRef.current = nextPosition;

    if (dragOffsetFrameRef.current !== null) {
      return;
    }

    const requestFrame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (callback) => setTimeout(callback, 16);

    dragOffsetFrameRef.current = requestFrame(() => {
      dragOffsetFrameRef.current = null;
      setActivePosition((prevPosition) => (
        prevPosition === pendingPositionRef.current ? prevPosition : pendingPositionRef.current
      ));
    });
  };

  const snapToPosition = (nextPosition) => {
    cancelPendingDragOffsetUpdate();
    pendingPositionRef.current = nextPosition;
    setActivePosition((prevPosition) => (
      prevPosition === nextPosition ? prevPosition : nextPosition
    ));
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const now = Date.now();
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = now;
    touchStartPositionRef.current = activePosition;
    pendingPositionRef.current = activePosition;
    lastTouchXRef.current = touch.clientX;
    lastTouchTimeRef.current = now;
    swipeVelocityRef.current = 0;
    isTouchingRef.current = true;
    gestureIntentRef.current = 'pending';
  };

  const handleTouchMove = (e) => {
    if (!isTouchingRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const now = Date.now();

    if (gestureIntentRef.current === 'pending') {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > DRAG_INTENT_THRESHOLD || absY > DRAG_INTENT_THRESHOLD) {
        gestureIntentRef.current = absX > absY ? 'horizontal' : 'vertical';
      }
    }
    
    if (gestureIntentRef.current === 'horizontal') {
      const elapsed = Math.max(1, now - lastTouchTimeRef.current);
      const instantVelocity = (touch.clientX - lastTouchXRef.current) / elapsed;
      swipeVelocityRef.current = swipeVelocityRef.current * 0.42 + instantVelocity * 0.58;
      lastTouchXRef.current = touch.clientX;
      lastTouchTimeRef.current = now;

      try {
        e.preventDefault();
      } catch (err) {
        // Some Taro runtimes do not expose preventDefault on touch events.
      }

      const rawPosition = touchStartPositionRef.current - deltaX / SWIPE_SNAP_DISTANCE;
      const nextPosition = applyPositionResistance(rawPosition);
      if (Math.abs(nextPosition - pendingPositionRef.current) >= 0.01) {
        schedulePositionUpdate(nextPosition);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!isTouchingRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const elapsed = Math.max(1, Date.now() - touchStartTimeRef.current);
    const isHorizontalSwipe = gestureIntentRef.current === 'horizontal' || Math.abs(deltaX) > Math.abs(deltaY) * 0.85;
    const velocityFromStart = deltaX / elapsed;
    const swipeVelocity = Math.abs(swipeVelocityRef.current) > Math.abs(velocityFromStart)
      ? swipeVelocityRef.current
      : velocityFromStart;

    if (isHorizontalSwipe && Math.abs(deltaX) > 8) {
      const currentPosition = pendingPositionRef.current;
      const momentumOffset = (-swipeVelocity * 180) / SWIPE_SNAP_DISTANCE;
      const projectedPosition = applyPositionResistance(currentPosition + momentumOffset);
      const nextIndex = clamp(Math.round(projectedPosition), 0, maxIndex);
      snapToPosition(nextIndex);
    } else if (deltaY < -100 && onSwipeUp) {
      onSwipeUp(selectedIndex);
    } else {
      snapToPosition(selectedIndex);
    }
    
    isTouchingRef.current = false;
    gestureIntentRef.current = 'pending';
  };

  const handleTouchCancel = () => {
    isTouchingRef.current = false;
    gestureIntentRef.current = 'pending';
    snapToPosition(selectedIndex);
  };

  useEffect(() => {
    return () => {
      cancelPendingDragOffsetUpdate();
    };
  }, []);

  // 确保父组件总是知道当前选中的卡片
  useEffect(() => {
    if (onCardSelect) {
      onCardSelect(selectedIndex);
    }
  }, [selectedIndex, onCardSelect]);

  const visualCenterPosition = clamp(activePosition, 0, maxIndex);
  const renderStart = Math.max(0, Math.floor(visualCenterPosition) - MAX_VISIBLE_SIDE_CARDS - RENDER_BUFFER);
  const renderEnd = Math.min(maxIndex, Math.ceil(visualCenterPosition) + MAX_VISIBLE_SIDE_CARDS + RENDER_BUFFER);
  const cardSpacing = Math.max(28, Math.round(cardWidth * 0.3));
  const arcHeightFactor = Math.max(3.5, cardHeight * 0.018);
  const fanCompression = Math.max(3.5, cardWidth * 0.032);

  // 处理向左选择
  const handleSelectLeft = () => {
    snapToPosition(clamp(selectedIndex - 1, 0, maxIndex));
  };

  // 处理向右选择
  const handleSelectRight = () => {
    snapToPosition(clamp(selectedIndex + 1, 0, maxIndex));
  };

  useEffect(() => {
    setActivePosition((prevPosition) => {
      const normalizedPosition = clamp(prevPosition, 0, maxIndex);
      return normalizedPosition === prevPosition ? prevPosition : normalizedPosition;
    });
    pendingPositionRef.current = clamp(pendingPositionRef.current, 0, maxIndex);
    touchStartPositionRef.current = clamp(touchStartPositionRef.current, 0, maxIndex);
  }, [maxIndex]);

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
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ...style }}
    >
      {Array.from({ length: renderEnd - renderStart + 1 }, (_, displayIndex) => {
        const actualIndex = renderStart + displayIndex;
        const distanceFromCenter = actualIndex - visualCenterPosition;
        const absDistance = Math.abs(distanceFromCenter);
        const signedDistance = distanceFromCenter === 0 ? 0 : Math.sign(distanceFromCenter);
        const x = distanceFromCenter * cardSpacing - signedDistance * Math.pow(absDistance, 1.32) * fanCompression;
        const y = Math.pow(absDistance, 1.55) * arcHeightFactor;
        const rotation = distanceFromCenter * 6.1;
        const isCenterCard = actualIndex === selectedIndex;
        const scale = Math.max(0.84, 1.055 - absDistance * 0.05);
        const opacity = absDistance > MAX_VISIBLE_SIDE_CARDS + 0.35
          ? 0
          : Math.max(0.18, isCenterCard ? 1 : 0.98 - absDistance * 0.16);
        const transition = isTouchingRef.current && gestureIntentRef.current === 'horizontal'
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease-out';
        
        return (
          <Image
            key={actualIndex}
            className={styles.cardImage}
            src={imageUrl}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: `translate3d(-50%, -50%, 0) rotate(${rotation}deg) scale(${scale})`,
              zIndex: 1000 - Math.round(absDistance * 100),
              opacity,
              transition,
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              willChange: 'transform, opacity'
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
  cardWidth: 124,
  cardHeight: 186
};

CardSlider.displayName = 'CardSlider';

export default CardSlider;
