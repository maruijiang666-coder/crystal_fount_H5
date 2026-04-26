import { useState, useRef, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components';
import { getOssImageUrl } from '../../utils/config.js';
import CardSlider from '../../components/CardSlider';
import styles from './index.module.css';
import tarotData from './tarot_mapping.json';

// Parse Tarot Data
const OSS_BASE_URL = tarotData[0].image_url;
// Filter out the first element (url) and the back card (number 78)
const VALID_CARDS = tarotData.slice(1).filter(card => card.number !== 78);

const getCardDisplayName = (card) => {
  if (!card) return 'Unknown';
  return card.simple_chinese || card.chinese_name || card.filename?.replace(/\.[^.]+$/, '') || 'Unknown';
};

const SPREAD_TYPES = [
  {
    id: 'decision',
    name: '三选一牌阵',
    subTitle: 'Decision Spread',
    description: '对比清晰：直观呈现两种选择的利弊与潜在结果\n聚焦决策：专为面临明确三元选择设计\n适用场景：职业选择、关系决策、路径选择',
    positions: ['用户选中的选项 (Option 1)', '选项二 (Option 2)', '选项三 (Option 3)']
  },
  {
    id: 'holy_triangle',
    name: '圣三角牌阵',
    subTitle: 'Holy Triangle Spread',
    description: '经典通用：使用率约 30%，被视为塔罗基础牌阵\n时间流视角：清晰展示事件演变逻辑与因果关系\n适用场景：趋势预测、问题溯源、个人成长规划',
    positions: ['过去 (Past)', '现在 (Present)', '未来 (Future)']
  },
  {
    id: 'issue_focus',
    name: '三牌问题导向阵',
    subTitle: 'Issue Focus Spread',
    description: '问题解决导向：从 “是什么 - 为什么 - 怎么办” 提供完整思路\n实用性强：不纠结过去，聚焦当下行动方案\n适用场景：工作难题突破、关系矛盾处理、个人瓶颈突破',
    positions: ['现状 (Situation)', '挑战 (Challenge)', '建议 (Advice)']
  }
];

export default function TaLuo(props) {
  const router = Taro.useRouter();
  const userQuestion = decodeURIComponent(router.params.question || '');

  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]); // 存储已选中的卡片索引 (Visual)
  const [drawnCards, setDrawnCards] = useState([]); // 存储实际抽到的塔罗牌数据
  const [flippedStatus, setFlippedStatus] = useState([false, false, false]); // 记录卡片是否翻开
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [isSpreadConfirmed, setIsSpreadConfirmed] = useState(false); // 是否确认牌阵
  const [cardOrder, setCardOrder] = useState([0, 1, 2]); // 卡片逻辑顺序映射
  const touchStartRef = useRef({ x: 0, y: 0 });
  const cardSliderRef = useRef(null);
  const isTouchingCardSlider = useRef(false);

  const resetSpreadState = (showToast = false) => {
    setSelectedCardIndex(null);
    setSelectedCards([]);
    setDrawnCards([]);
    setFlippedStatus([false, false, false]);
    setCurrentSpreadIndex(0);
    setCardOrder([0, 1, 2]);
    setIsSpreadConfirmed(false);
    isTouchingCardSlider.current = false;
    touchStartRef.current = { x: 0, y: 0 };
    Taro.removeStorageSync('last_tarot_reading');

    if (showToast) {
      Taro.showToast({
        title: '已重置',
        icon: 'none',
        duration: 1000
      });
    }
  };

  const handleCardSelect = (index) => {
    setSelectedCardIndex(index);
    console.log('[TaLuo] onCardSelect', {
      index,
      selectedCardsLength: selectedCards.length,
      isSpreadConfirmed,
    });
  };

  const handlePickCurrentCard = () => {
    if (!isSpreadConfirmed) {
      return;
    }

    if (selectedCardIndex === null) {
      Taro.showToast({
        title: '请先选中一张牌',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    if (selectedCards.length >= 3) {
      Taro.showToast({
        title: '已达到3张上限',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    if (selectedCards.includes(selectedCardIndex)) {
      Taro.showToast({
        title: '此卡片已选择',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    console.log('准备添加第', selectedCards.length + 1, '张卡');
    setSelectedCards(prevSelectedCards => [...prevSelectedCards, selectedCardIndex]);

    const newCard = getRandomCard(drawnCards);
    if (newCard) {
      setDrawnCards(prevDrawnCards => [...prevDrawnCards, newCard]);
    }

    console.log('添加卡片到顶部，当前已选:', selectedCards.length + 1);
    Taro.showToast({
      title: `已选择第${selectedCards.length + 1}张牌`,
      icon: 'none',
      duration: 1000
    });
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    console.log('[TaLuo] touchstart', {
      x: touchStartRef.current.x,
      y: touchStartRef.current.y,
      selectedCardIndex,
      selectedCardsLength: selectedCards.length,
      isSpreadConfirmed,
      isTouchingCardSlider: isTouchingCardSlider.current,
    });
  };

  const getRandomCard = (currentDrawn) => {
    const availableCards = VALID_CARDS.filter(card => 
      !currentDrawn.some(drawn => drawn.card.number === card.number)
    );
    if (availableCards.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];
    const isReversed = Math.random() < 0.5; // 50% 概率逆位
    return { card, isReversed };
  };

  const handleTouchEnd = (e) => {
    if (isTouchingCardSlider.current) {
      console.log('[TaLuo] touchend skipped because slider is active', {
        selectedCardIndex,
        selectedCardsLength: selectedCards.length,
      });
      return;
    }
    // 未确认牌阵时无法抽卡
    if (!isSpreadConfirmed) {
      console.log('[TaLuo] touchend skipped because spread not confirmed');
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touchStartRef.current.x - touch.clientX;
    const deltaY = touchStartRef.current.y - touch.clientY;

    console.log('handleTouchEnd 触发 - deltaX:', deltaX, 'deltaY:', deltaY, 'selectedCardIndex:', selectedCardIndex, 'selectedCards.length:', selectedCards.length);

    // 横向滑动交给 CardSlider 处理，页面不再把它误判成抽牌
    if (Math.abs(deltaX) > Math.abs(deltaY)) return;
    console.log('[TaLuo] vertical swipe detected', {
      deltaX,
      deltaY,
      selectedCardIndex,
      selectedCardsLength: selectedCards.length,
    });

    // 向上滑动在卡片选择器区域内时，直接触发选牌
    if (deltaY > 100) {
      handlePickCurrentCard();
    }
  };

  useEffect(() => {
    if (drawnCards.length > 0) {
      const lastDrawn = drawnCards[drawnCards.length - 1];
      if (lastDrawn && lastDrawn.card) {
        // Preload the image
      }
    }
  }, [drawnCards]);

  // 监听翻牌状态，全部翻开时打印日志
  useEffect(() => {
    if (flippedStatus.every(status => status) && drawnCards.length === 3) {
      console.log('1. 要占卜的内容:', userQuestion || '未输入');
      console.log('2. 牌阵:', SPREAD_TYPES[currentSpreadIndex].name);
      
      // 使用逻辑顺序打印
      const orderedCards = cardOrder.map(index => {
        const drawn = drawnCards[index];
        return drawn ? `${drawn.card.chinese_name} (${drawn.isReversed ? '逆位' : '正位'})` : '未知';
      });
      console.log('3. 目前抽到的牌(按选择顺序):', orderedCards);
    }
  }, [flippedStatus, drawnCards, currentSpreadIndex, userQuestion, cardOrder]);

  // 点击翻牌
  const handleCardFlip = (index) => {
    // 必须抽满3张才能翻牌
    if (selectedCards.length < 3) {
      Taro.showToast({
        title: '请先抽取3张牌',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    console.log('点击翻牌:', {
      index: index,
      currentSpread: SPREAD_TYPES[currentSpreadIndex].id,
      flippedStatus: flippedStatus,
      drawnCards: drawnCards,
      selectedCards: selectedCards
    });

    if (!flippedStatus[index]) {
      const currentSpread = SPREAD_TYPES[currentSpreadIndex];
      
      // 所有牌阵都保持抽牌顺序，不因首次点击而重排 cardOrder
      if (currentSpread.id === 'decision') {
        console.log('[TaLuo] decision spread keeps draw order', {
          cardOrder,
          clickedIndex: index,
        });
      }
      
      // 翻开当前点击的牌
      const newStatus = [...flippedStatus];
      newStatus[index] = true;
      setFlippedStatus(newStatus);
      
      // 如果是三选一牌阵且是第一次翻牌，自动翻开剩余两张
      if (currentSpread.id === 'decision' && flippedStatus.every(status => !status)) {
        setTimeout(() => {
          setFlippedStatus([true, true, true]);
        }, 500);
      }
    }
  };

  // 重置选择
  const handleReset = () => {
    resetSpreadState(true);
  };

  const handleSpreadChange = (e) => {
    setCurrentSpreadIndex(e.detail.current);
  };

  const handleConfirmSpread = () => {
    setIsSpreadConfirmed(true);
  };

  const canShowPlacementButton = flippedStatus.every(status => status) && drawnCards.length === 3;

  Taro.useDidShow(() => {
    // 进入页面时强制重开一局，避免上一次的抽牌状态残留
    resetSpreadState(false);
  });

  return (
    <>
      <View
        className={`flex-col ${styles['page']} ${props.className}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部区域 - 牌阵选择 */}
        <View className={`flex-col items-center self-stretch ${styles['section']}`} style={{ backgroundImage: `url(${getOssImageUrl('TaLuo/1e734912a97ed8f162bfe0b3fe1f74f7.png')})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', position: 'relative', height: 'auto' }}>
          <Text className={`${styles['font']}`}>Tarot Mapping</Text>
          
          {/* 显示用户问题 */}
          {userQuestion && (
            <View className={styles.userQuestionContainer}>
              <Text className={styles.userQuestionText}>
                &quot;{userQuestion}&quot;
              </Text>
            </View>
          )}
          
          {/* Spread Selector - Only show full swiper when spread is not confirmed */}
          {!isSpreadConfirmed ? (
            <>
              <View style={{ width: '100%', overflow: 'hidden' }}>
                <Swiper
                className={styles.spreadSwiper}
                indicatorDots
                indicatorColor='rgba(255, 255, 255, 0.3)'
                indicatorActiveColor='#D4AF37'
                circular
                current={currentSpreadIndex}
                onChange={handleSpreadChange}
                style={{ width: '100%', height: 'auto', minHeight: '300px', marginTop: '20px' }}
                >
                {SPREAD_TYPES.map((spread) => (
                    <SwiperItem key={spread.id}>
                    <View className='flex-col items-center justify-center' style={{ height: '100%', padding: '0 10px' }}>
                        <Text className={styles.spreadTitle} style={{ color: '#D4AF37', fontSize: '25px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {spread.name}
                        </Text>
                        <Text style={{ color: '#aaa', fontSize: '26px', marginBottom: '12px' }}>
                          {spread.subTitle}
                        </Text>
                        <Text style={{ color: '#fff', fontSize: '16px', textAlign: 'center', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {spread.description}
                        </Text>
                    </View>
                    </SwiperItem>
                ))}
                </Swiper>
              </View>
                
                {/* Confirm Button */}
                <View 
                    className={styles.confirmButton}
                    onClick={handleConfirmSpread}
                >
                    <Text className={styles.confirmButtonText}>Confirm Selection</Text>
                </View>
            </>
          ) : (
            // Simplified View when spread is confirmed
            <View className='flex-col items-center justify-center' style={{ width: '90%', height: '100px', marginTop: '20px' }}>
                <Text className={styles.spreadTitle} style={{ color: '#D4AF37', fontSize: '32px', fontWeight: 'bold' }}>
                    {SPREAD_TYPES[currentSpreadIndex].name}
                </Text>
                <Text style={{ color: '#aaa', fontSize: '24px' }}>
                    {SPREAD_TYPES[currentSpreadIndex].subTitle}
                </Text>
            </View>
          )}
        </View>

        {isSpreadConfirmed && (
            <View className={`flex-col items-center self-center ${styles['group']}`}
            onClick={() => {
                Taro.navigateTo({ url: '/pages/TaLuoAnswer/index?skipPlacement=1' });
            }}>
            <Text className={`${styles['text']}`}>Tap to pick your card</Text>
            <Image
                style={{ margin: '20px 0 0 0' }}
                className={`${styles['image_2']} ${styles['mt-7']}`}
                src={getOssImageUrl('TaLuo/e3fe51b2b356d777af64ab7ea8fac5f9.png')}
            />
            </View>
        )}

        {/* 卡片选择器 - Only show when spread is confirmed */}
        {isSpreadConfirmed && (
            <View style={{ width: '100%', height: '200px', flexShrink: 0, marginTop: '-6px' }}>
            <CardSlider
                ref={cardSliderRef}
                style={{ width: '100%', height: '100%' }}
                cardWidth={124}
                cardHeight={186}
                onCardSelect={handleCardSelect}
                onSwipeUp={handlePickCurrentCard}
                onInSliderChange={(isInside) => {
                  isTouchingCardSlider.current = isInside;
                }}
            />
            </View>
        )}

        {/* 结果显示区域 */}
        <View className={`flex-col self-stretch ${styles['group_5']}`}>
            {/* Card 1 */}
            <View className={styles.resultItem}>
                <Text className={`self-center ${styles['font_2']} ${styles['text_2']}`}>
                    {SPREAD_TYPES[currentSpreadIndex].positions[0]}
                </Text>
                <Text className={`self-center ${styles['font_3']} ${styles['text_3']}`} style={{ marginTop: 0 }}>
                    {flippedStatus[cardOrder[0]] && drawnCards[cardOrder[0]] && drawnCards[cardOrder[0]].card ? `${drawnCards[cardOrder[0]].card.chinese_name} (${drawnCards[cardOrder[0]].isReversed ? '逆位' : '正位'})` : '未知'}
                </Text>
            </View>

            {/* Card 2 */}
            <View className={styles.resultItem}>
                <Text className={`self-center ${styles['font_2']} ${styles['text_2']}`}>
                    {SPREAD_TYPES[currentSpreadIndex].positions[1]}
                </Text>
                <Text className={`self-center ${styles['font_3']} ${styles['text_5']}`} style={{ marginTop: 0 }}>
                    {flippedStatus[cardOrder[1]] && drawnCards[cardOrder[1]] && drawnCards[cardOrder[1]].card ? `${drawnCards[cardOrder[1]].card.chinese_name} (${drawnCards[cardOrder[1]].isReversed ? '逆位' : '正位'})` : '未知'}
                </Text>
            </View>

            {/* Card 3 */}
            <View className={styles.resultItem}>
                <Text className={`self-center ${styles['font_2']} ${styles['text_2']}`}>
                    {SPREAD_TYPES[currentSpreadIndex].positions[2]}
                </Text>
                <Text className={`self-center ${styles['font_3']} ${styles['text_7']}`} style={{ marginTop: 0 }}>
                    {flippedStatus[cardOrder[2]] && drawnCards[cardOrder[2]] && drawnCards[cardOrder[2]].card ? `${drawnCards[cardOrder[2]].card.chinese_name} (${drawnCards[cardOrder[2]].isReversed ? '逆位' : '正位'})` : '未知'}
                </Text>
            </View>

          <View className={`flex-row items-center justify-center `}>
            <Image
              className={`shrink-0 ${styles['image_4']}`}
              src={getOssImageUrl('TaLuo/1f962a56642df1b7d09ef159b7ef97cb.png')}
            />
            <Text className={`${styles['font_2']} ${styles['text_2']} ${styles['text_8']} mx-16`}>
              Analysis from the system
            </Text>
            <Image
              className={`shrink-0 ${styles['image_4']} ${styles['image_1']}`}
              src={getOssImageUrl('TaLuo/1f962a56642df1b7d09ef159b7ef97cb.png')}
            />
          </View>
        </View>

        {canShowPlacementButton && (
          <View className={styles.placementButtonWrap}>
            <View
              className={`flex-row ${styles['section_3']}`}
              onClick={() => {
                const readingData = {
                  question: userQuestion || '',
                  spread_type: SPREAD_TYPES[currentSpreadIndex].id,
                  cards: cardOrder.map(index => {
                    const drawn = drawnCards[index];
                    if (drawn && drawn.card) {
                      return `${getCardDisplayName(drawn.card)} (${drawn.isReversed ? '逆位' : '正位'})`;
                    }
                    return 'Unknown';
                  })
                };
                Taro.setStorageSync('last_tarot_reading', readingData);
                
                Taro.navigateTo({ url: `/pages/TaLuoAnswer/index?skipPlacement=1` });
              }}
            >
              <Image
                className={`shrink-0 ${styles['image_6']}`}
                src={getOssImageUrl('TaLuo/30a17279e1f392df2783a8abb3ab03ac.png')}
              />
              <Text className={`${styles['font_2']} ${styles['text_2']} ${styles['placementButtonText']}`}>
                牌阵就位
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 悬浮的选中卡片组 - 固定在顶部区域上方，横向排列 */}
      {selectedCards.length > 0 && (
        <>
          {/* 进度提示 */}
          <View className={styles.progressIndicator}>
            <Text className={styles.progressText}>
              {selectedCards.length}/3
            </Text>
          </View>

          {/* 卡片容器 */}
          <View className={styles.floatingCardsContainer}>
            {drawnCards.map((drawnCard, index) => {
              // 安全获取逻辑索引，避免越界
              const logicalIndex = (cardOrder && cardOrder.length > index) ? cardOrder[index] : index;
              // 安全获取翻转状态
              const isFlipped = (flippedStatus && flippedStatus.length > logicalIndex) ? flippedStatus[logicalIndex] : false;

              return (
                <View
                  key={index}  // 统一使用 index 作为 key
                  className={styles.floatingCardWrapper}
                  style={{
                    animationDelay: `${index * 0.15}s`
                  }}
                  onClick={() => handleCardFlip(logicalIndex)}
                >
                  <View className={styles.flipScene}>
                    <View className={`${styles.flipper} ${isFlipped ? styles.flipped : ''}`}>
                      {/* Front: 牌背 (Cover) */}
                      <Image
                        className={`${styles.cardFace} ${styles.cardFaceFront}`}
                        src={getOssImageUrl('TaLuo/onlyCard.png')}
                        mode='aspectFit'
                      />
                      {/* Back: 牌面 (Content) */}
                      <Image
                        className={`${styles.cardFace} ${styles.cardFaceBack} ${drawnCard && drawnCard.isReversed ? styles.cardFaceBackReversed : ''}`}
                        src={drawnCard && drawnCard.card ? `${OSS_BASE_URL}${drawnCard.card.filename}` : ''}
                        onLoad={() => console.log(`图片加载成功: ${drawnCard.card.filename}`)}
                        onError={() => console.error(`图片加载失败: ${drawnCard.card.filename}`)}
                        mode='aspectFit'
                      />
                    </View>
                  </View>
                  
                  <Text className={styles.floatingCardText}>
                    {isFlipped && drawnCard && drawnCard.card 
                      ? `${drawnCard.card.chinese_name} (${drawnCard.isReversed ? '逆位' : '正位'})` 
                      : drawnCard && drawnCard.card 
                        ? '已抽牌但未翻转' 
                        : '未知'}
                  </Text>
                  <View className={styles.cardBadge}>
                    <Text className={styles.cardBadgeText}>{index + 1}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 重置按钮 */}
          <View
            className={styles.resetButton}
            onClick={handleReset}
          >
            <Text className={styles.resetButtonText}>重置</Text>
          </View>
        </>
      )}
      {/* 预加载图片 - 隐藏渲染 */}
      <View style={{ display: 'none' }}>
        {drawnCards.map((drawn, index) => (
          drawn && drawn.card ? <Image key={index} src={`${OSS_BASE_URL}${drawn.card.filename}`} /> : null
        ))}
      </View>
    </>
  );
}

TaLuo.defaultProps = { className: '' };
