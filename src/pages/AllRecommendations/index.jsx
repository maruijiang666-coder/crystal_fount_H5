import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.css';
import { getOssImageUrl } from '../../utils/config.js';
import { checkCrystalActivation } from '../../utils/auth.js';

export default function AllRecommendations() {
  const [pressedCard, setPressedCard] = useState(null);

  const cards = [
    {
      id: 'card1',
      title: '触碰水晶',
      desc: '触碰水晶可以加速宠物的进化',
      bg: 'SJSY/sjsy_bc1.png',
      url: '/pages/NFCTouch/index'
    },
    {
      id: 'card2',
      title: '运势',
      desc: '运势解读',
      bg: 'SJSY/sjsy_bc2.png',
      url: '/pages/yunshi/yunshi'
    },
    {
      id: 'card3',
      title: '抽牌',
      desc: '塔罗牌占卜，探索内心答案',
      bg: 'SJSY/sjsy_bc3.png',
      url: '/pages/TanChuang/index'
    },
    {
      id: 'card4',
      title: '播客',
      desc: '运势解析播客',
      bg: 'SJSY/sjsy_bc1.png',
      url: '/pages/Podcast/index'
    }
  ];

  const handleCardClick = (card) => {
    console.log('点击卡片:', card);
    if (card.url) {
      if (checkCrystalActivation()) {
        const targetUrl = card.id === 'card2'
          ? `${card.url}?source=entertainment`
          : card.url;
        Taro.navigateTo({ url: targetUrl });
      }
    } else {
      Taro.showToast({ title: '敬请期待', icon: 'none' });
    }
  };

  return (
    <View className={styles.page}>
      <Text className={styles.title}>所有推荐</Text>
      <View className={styles.grid}>
        {cards.map((card) => (
          <View
            key={card.id}
            className={styles.card}
            style={{
              backgroundImage: `url(${getOssImageUrl(card.bg)})`,
              transform: pressedCard === card.id ? 'scale(0.98)' : 'scale(1)',
              opacity: pressedCard === card.id ? 0.9 : 1
            }}
            onTouchStart={() => setPressedCard(card.id)}
            onTouchEnd={() => setPressedCard(null)}
            onTouchCancel={() => setPressedCard(null)}
            onClick={() => handleCardClick(card)}
          >
            <Text className={styles.font}>{card.title}</Text>
            <Text className={styles.desc}>{card.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
