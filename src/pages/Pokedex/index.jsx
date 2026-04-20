import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { getOssImageUrl } from '../../utils/config';

// 模拟灵鹿种类数据
const DEER_TYPES = [
  {
    id: 'deer_001',
    name: '初级灵鹿',
    rarity: 'N',
    baseImage: 'SJSY/4847668f063c0997763f6e4c249ad33b.png',
    desc: '初入灵界的幼鹿，性格温顺，喜欢亲近人类。',
    fortuneType: '平安'
  },
  {
    id: 'deer_002',
    name: '中级灵鹿',
    rarity: 'R',
    baseImage: 'SJSY/b91b938179b31a6bcfe934515b7ec608.png',
    desc: '拥有了一定灵力的成年鹿，角上开始闪烁微光。',
    fortuneType: '健康'
  },
  {
    id: 'deer_003',
    name: '水晶灵鹿',
    rarity: 'SR',
    baseImage: 'SJSY/1e467fc804d0fd434a82a6706adadf24.png',
    desc: '全身由晶体构成的稀有灵鹿，是纯净灵力的结晶。',
    fortuneType: '财运'
  },
  {
    id: 'deer_004',
    name: '星空灵鹿',
    rarity: 'SSR',
    baseImage: 'SJSY/1e467fc804d0fd434a82a6706adadf24.png', // 复用图片，实际应有不同
    desc: '传说中承载着星辰之力的神鹿，只有在大运之时才会出现。',
    fortuneType: '全能'
  },
  {
    id: 'deer_005',
    name: '迷雾灵鹿',
    rarity: 'R',
    baseImage: 'SJSY/4847668f063c0997763f6e4c249ad33b.png',
    desc: '常年生活在迷雾森林中，行踪诡秘。',
    fortuneType: '智慧'
  },
  {
    id: 'deer_006',
    name: '炽焰灵鹿',
    rarity: 'SR',
    baseImage: 'SJSY/b91b938179b31a6bcfe934515b7ec608.png',
    desc: '性格热烈奔放，奔跑时足下生莲。',
    fortuneType: '桃花'
  }
];

const MOODS = ['开心', '期待', '平静', '困倦', '兴奋'];
const STORY_FRAGMENTS = [
  '在古老的遗迹中被唤醒，',
  '追逐着流星划过的轨迹而来，',
  '听到了你内心的呼唤，',
  '迷失在时空裂缝中，恰好遇见了你，'
];

export default function Pokedex() {
  const [caughtDeers, setCaughtDeers] = useState([]);
  const [selectedDeer, setSelectedDeer] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // 加载已捕获的灵鹿
    const stored = Taro.getStorageSync('caught_deers') || [];
    setCaughtDeers(stored);
  }, []);

  // 模拟捕获功能
  const handleCapture = async () => {
    if (isScanning) return;
    setIsScanning(true);
    Taro.vibrateLong();
    
    Taro.showLoading({ title: '灵力搜索中...' });

    // 1. 模拟获取地理位置 (Mock GPS)
    let location = { latitude: 0, longitude: 0, name: '未知领域' };
    try {
      const res = await Taro.getLocation({ type: 'wgs84' }).catch(() => null);
      if (res) {
        location = { 
          latitude: res.latitude.toFixed(2), 
          longitude: res.longitude.toFixed(2), 
          name: `坐标(${res.latitude.toFixed(2)}, ${res.longitude.toFixed(2)})`
        };
      } else {
        location = { latitude: 31.23, longitude: 121.47, name: '幻境森林 (模拟)' };
      }
    } catch (e) {
      location = { latitude: 31.23, longitude: 121.47, name: '幻境森林 (模拟)' };
    }

    // 2. 延迟模拟扫描过程
    setTimeout(() => {
      Taro.hideLoading();
      
      // 3. 随机抽取一只灵鹿
      const randomType = DEER_TYPES[Math.floor(Math.random() * DEER_TYPES.length)];
      
      // 4. 生成个性化属性
      const newDeer = {
        uuid: Date.now().toString(), // 唯一ID
        ...randomType,
        level: 1,
        capturedAt: new Date().toLocaleDateString(),
        location: location,
        mood: MOODS[Math.floor(Math.random() * MOODS.length)],
        story: `${STORY_FRAGMENTS[Math.floor(Math.random() * STORY_FRAGMENTS.length)]} 决定成为你的守护伙伴。`,
        fortuneBuff: `今日${randomType.fortuneType} +${Math.floor(Math.random() * 10 + 5)}%`
      };

      const updated = [...caughtDeers, newDeer];
      setCaughtDeers(updated);
      Taro.setStorageSync('caught_deers', updated);
      
      setSelectedDeer(newDeer); // 自动打开详情页
      setIsScanning(false);
      Taro.showToast({ title: '捕获成功！', icon: 'success' });
    }, 2000);
  };

  // 升级功能
  const handleUpgrade = () => {
    if (!selectedDeer) return;
    
    Taro.showLoading({ title: '注入灵力...' });
    setTimeout(() => {
      Taro.hideLoading();
      const updatedLevel = selectedDeer.level + 1;
      
      const updatedDeer = { ...selectedDeer, level: updatedLevel };
      setSelectedDeer(updatedDeer);

      // 更新列表中的数据
      const updatedList = caughtDeers.map(d => d.uuid === selectedDeer.uuid ? updatedDeer : d);
      setCaughtDeers(updatedList);
      Taro.setStorageSync('caught_deers', updatedList);
      
      Taro.showToast({ title: '升级成功！', icon: 'none' });
    }, 1000);
  };

  const closeModal = () => setSelectedDeer(null);

  // 渲染网格项
  const renderGridItem = (type) => {
    // 查找是否已获得该种类的鹿 (显示最新的一只或最高级的一只)
    const caught = caughtDeers.filter(d => d.id === type.id).sort((a,b) => b.level - a.level)[0];
    const isLocked = !caught;

    return (
      <View 
        key={type.id} 
        className={`${styles.card} ${isLocked ? styles.locked : styles.caught} ${styles[type.rarity]}`}
        onClick={() => caught ? setSelectedDeer(caught) : Taro.showToast({ title: '尚未发现此灵鹿', icon: 'none' })}
      >
        <Image 
          src={getOssImageUrl(type.baseImage)} 
          className={styles.image} 
          mode="aspectFit"
        />
        <View className={`${styles.rarityBadge} ${styles[type.rarity]}`}>{type.rarity}</View>
        <Text className={styles.name}>{type.name}</Text>
        {caught && <View className={styles.levelBadge}>Lv.{caught.level}</View>}
      </View>
    );
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>灵鹿图鉴</Text>
        <View className={styles.stats}>
          收集进度: {new Set(caughtDeers.map(d => d.id)).size} / {DEER_TYPES.length}
        </View>
      </View>

      <View className={styles.grid}>
        {DEER_TYPES.map(renderGridItem)}
      </View>

      {/* 捕获按钮 (Demo) */}
      <View className={styles.captureBtn} onClick={handleCapture}>
        <Text>🔮 探索捕获</Text>
      </View>

      {/* 详情弹窗 */}
      {selectedDeer && (
        <View className={styles.modalOverlay} onClick={closeModal}>
          <View className={`${styles.modalContent} ${styles[selectedDeer.rarity]}`} onClick={e => e.stopPropagation()}>
            <View className={styles.closeBtn} onClick={closeModal}>×</View>
            
            <View className={styles.detailHeader}>
              <Image 
                src={getOssImageUrl(selectedDeer.baseImage)} 
                className={styles.detailImage} 
                mode="aspectFit"
              />
              <Text className={styles.detailName}>{selectedDeer.name}</Text>
              <Text className={`${styles.detailRarity} ${styles[selectedDeer.rarity]}`}>
                {selectedDeer.rarity} | Lv.{selectedDeer.level}
              </Text>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>档案</Text>
              <View className={styles.sectionContent}>
                <View><Text className={styles.tag}>心情: {selectedDeer.mood}</Text></View>
                <View style={{marginTop: '8px'}}><Text className={styles.tag}>{selectedDeer.fortuneBuff}</Text></View>
                <Text style={{display: 'block', marginTop: '8px', fontSize: '14px', opacity: 0.8}}>{selectedDeer.desc}</Text>
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>捕获记录</Text>
              <View className={styles.sectionContent}>
                <View className={styles.locationInfo}>
                  <Text>📍 {selectedDeer.location.name}</Text>
                </View>
                <View className={styles.locationInfo} style={{marginTop: '4px'}}>
                  <Text>📅 {selectedDeer.capturedAt}</Text>
                </View>
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>灵鹿故事</Text>
              <Text className={styles.sectionContent} style={{fontStyle: 'italic'}}>
                "{selectedDeer.story}"
              </Text>
            </View>

            <Button className={styles.upgradeBtn} onClick={handleUpgrade}>
              注入灵力 (升级)
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
