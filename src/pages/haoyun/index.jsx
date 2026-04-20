import { useState, useRef, useEffect, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image, Button } from '@tarojs/components';
import { getOssImageUrl } from '../../utils/config.js';
import styles from './index.module.css';

// 水晶加成数据
const CRYSTAL_BONUSES = {
  "白水晶": { career: 4, love: -2, health: 10, finance: -3 },
  "粉水晶": { career: -3, love: 10, health: 5, finance: -2 },
  "紫水晶": { career: 6, love: 4, health: -7, finance: 3 },
  "黄水晶": { career: 7, love: -3, health: -4, finance: 10 },
  "茶晶": { career: 5, love: -2, health: 8, finance: -4 },
  "绿水晶": { career: 8, love: 5, health: -6, finance: 7 },
  "黑曜石": { career: 4, love: -1, health: 7, finance: -5 },
  "红水晶": { career: -3, love: 8, health: 6, finance: -2 }
};

export default function Haoyun(props) {
  // 运势数据 State
  const [fortuneData, setFortuneData] = useState({
    career_score: 0,
    finance_score: 0,
    health_score: 0,
    love_score: 0,
    career_score_change: 0,
    finance_score_change: 0,
    health_score_change: 0,
    love_score_change: 0,
    lucky_color: '',
    base_scores: {
      career_score: 55,
      finance_score: 55,
      health_score: 55,
      love_score: 55
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 处理运势分数对比逻辑
  const processFortuneScores = (currentData) => {
    // 1. 获取今天的日期字符串
    const today = new Date().toDateString();
    
    // 2. 获取存储的数据（包含日期和分数）
    // fortune_storage: { date: '...', scores: {...} }
    const stored = Taro.getStorageSync('fortune_storage');
    
    // 3. 获取用于展示对比的基准分数
    // fortune_display_base: { date: '...', scores: {...} }
    let displayBase = Taro.getStorageSync('fortune_display_base');
    
    // 准备基准分数 (默认 55)
    let baseScores = {
      career_score: 55,
      finance_score: 55,
      health_score: 55,
      love_score: 55
    };

    // 逻辑分支处理
    if (!stored) {
      // Case 1: 首次运行，没有任何存储
      // 使用默认的 baseScores (55)
      
      // 保存当前数据为最新存储
      Taro.setStorageSync('fortune_storage', {
        date: today,
        scores: {
          career_score: currentData.career_score,
          finance_score: currentData.finance_score,
          health_score: currentData.health_score,
          love_score: currentData.love_score
        }
      });
      
      // 保存默认基准为今日的对比基准
      Taro.setStorageSync('fortune_display_base', {
        date: today,
        scores: baseScores
      });
    } else if (stored.date !== today) {
      // Case 2: 跨天（存储的数据不是今天的）
      // 使用存储的数据（昨天的）作为基准
      baseScores = stored.scores;
      
      // 更新存储为今天的新数据
      Taro.setStorageSync('fortune_storage', {
        date: today,
        scores: {
          career_score: currentData.career_score,
          finance_score: currentData.finance_score,
          health_score: currentData.health_score,
          love_score: currentData.love_score
        }
      });
      
      // 更新今日的对比基准为昨天的分数
      Taro.setStorageSync('fortune_display_base', {
        date: today,
        scores: baseScores
      });
    } else {
      // Case 3: 同一天内再次打开（存储的数据是今天的）
      // 应该使用 fortune_display_base 中的数据作为基准
      if (displayBase && displayBase.date === today) {
        baseScores = displayBase.scores;
      }
      // 如果没有 displayBase，就用默认的 55
      
      // 更新 fortune_storage 为最新获取的数据
      Taro.setStorageSync('fortune_storage', {
        date: today,
        scores: {
          career_score: currentData.career_score,
          finance_score: currentData.finance_score,
          health_score: currentData.health_score,
          love_score: currentData.love_score
        }
      });
    }
    
    // 4. 计算变化值并返回新对象
    return {
      ...currentData,
      base_scores: baseScores,
      career_score_change: currentData.career_score - baseScores.career_score,
      finance_score_change: currentData.finance_score - baseScores.finance_score,
      health_score_change: currentData.health_score - baseScores.health_score,
      love_score_change: currentData.love_score - baseScores.love_score,
    };
  };

  // 获取运势数据
  const fetchFortuneData = async () => {
    // 1. 优先尝试从本地缓存获取 TaLuoAnswer 数据
    const taLuoAnswer = Taro.getStorageSync('TaLuoAnswer');

    if (taLuoAnswer) {
      console.log('使用本地缓存的 TaLuoAnswer 数据');
      const rawData = {
        career_score: taLuoAnswer.career_score || 0,
        finance_score: taLuoAnswer.finance_score || 0,
        health_score: taLuoAnswer.health_score || 0,
        love_score: taLuoAnswer.love_score || 0,
        lucky_color: taLuoAnswer.lucky_color || '', // 尝试获取幸运色
      };

      const formattedData = processFortuneScores(rawData);

      setFortuneData(formattedData);
      return; // 成功获取 TaLuoAnswer 后直接返回，不再请求 API
    }

    // 2. 其次尝试从本地缓存获取 fortune_report_data (原逻辑)
    const cachedDataWrapper = Taro.getStorageSync('fortune_report_data');
    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2小时缓存

    // 检查缓存是否存在且未过期（2小时内）
    if (cachedDataWrapper && cachedDataWrapper.timestamp && (now - cachedDataWrapper.timestamp < CACHE_DURATION) && cachedDataWrapper.data) {
      console.log('使用本地缓存的运势数据');
      let cachedData = cachedDataWrapper.data;
      
      // 应用分数对比逻辑
      cachedData = processFortuneScores(cachedData);
      
      setFortuneData(cachedData);
      return;
    }

    // 3. 最后尝试请求 API
    try {
      const res = await Taro.request({
        url: 'https://crystal.quant-speed.com/api/fortune_report/',
        method: 'GET',
        header: {
          'accept': 'application/json',
          'X-Login-Token': Taro.getStorageSync('importcode'),
          'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
        }
      });

      if (res.statusCode === 200 && res.data) {
        let data = res.data;
        
        // 应用分数对比逻辑
        data = processFortuneScores(data);
        
        setFortuneData(data);
        
        // 保存数据到本地缓存，包含时间戳
        Taro.setStorageSync('fortune_report_data', {
          timestamp: Date.now(),
          data: data
        });
      }
    } catch (error) {
      console.error('Fetch fortune data failed:', error);
    }
  };

  const handleRefresh = async () => {
    if (!Taro.getStorageSync('importcode')) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/My/index' });
      }, 1500);
      return;
    }
    if (isRefreshing) return;
    setIsRefreshing(true);
    Taro.showLoading({ title: '刷新中...' });
    Taro.removeStorageSync('fortune_report_data');
    await fetchFortuneData();
    Taro.hideLoading();
    Taro.showToast({ title: '刷新成功', icon: 'success' });
    setTimeout(() => setIsRefreshing(false), 1000); // Ensure animation has time to play
  };

  useEffect(() => {
    fetchFortuneData();
  }, []);

  // 分享给朋友
  Taro.useShareAppMessage(() => {
    return {
      title: '查看我的水晶运势日报',
      path: '/pages/haoyun/index',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    }
  })

  // 分享到朋友圈
  Taro.useShareTimeline(() => {
    return {
      title: '查看我的水晶运势日报',
      query: '',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    }
  })

  // 水晶数据
  const crystalData = [
    { name: '白水晶', image: 'haoyun/fe694d3a3f949398b861d7fa52204512.png', url: '/pages/yunshi/yunshi' },
    { name: '粉水晶', image: 'haoyun/7472af062d80aa70e18ed201c20fcbb0.png', url: '/pages/yunshi/yunshi' },
    { name: '紫水晶', image: 'haoyun/67d2cfcd71d6c5b40c39b31656458454.png', url: '/pages/yunshi/yunshi' },
    { name: '黄水晶', image: 'haoyun/e8e7945752127834a63c696581ed055a.png', url: '/pages/yunshi/yunshi' },
    { name: '茶晶', image: 'haoyun/e8e7945752127834a63c696581ed055a.png', url: '/pages/yunshi/yunshi' },
    { name: '绿水晶', image: 'haoyun/67d2cfcd71d6c5b40c39b31656458454.png', url: '/pages/yunshi/yunshi' },
    { name: '黑曜石', image: 'haoyun/67d2cfcd71d6c5b40c39b31656458454.png', url: '/pages/yunshi/yunshi' },
    { name: '红水晶', image: 'haoyun/7472af062d80aa70e18ed201c20fcbb0.png', url: '/pages/yunshi/yunshi' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPetStatus, setShowPetStatus] = useState(false);
  const [petInfo, setPetInfo] = useState({
    name: '水晶灵鹿',
    rarity: 'R级',
    level: '5'
  });

  useEffect(() => {
    if (showPetStatus) {
      const caughtDeers = Taro.getStorageSync('caught_deers');
      if (caughtDeers && caughtDeers.length > 0) {
        // Use the first deer found in storage
        const deer = caughtDeers[0];
        setPetInfo({
          name: deer.name || '水晶灵鹿',
          rarity: deer.rarity || 'R级',
          level: deer.level || '5'
        });
      }
    }
  }, [showPetStatus]);

  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  // 触摸开始
  const handleTouchStart = (e) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };

  // 触摸移动
  const handleTouchMove = (e) => {
    if (isAnimating) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    setOffsetX(deltaX);
  };

  // 触摸结束
  const handleTouchEnd = () => {
    if (isAnimating) return;
    
    const threshold = 40; // 滑动阈值
    const duration = Date.now() - touchStartTime.current;
    const velocity = Math.abs(offsetX) / duration;
    
    const arcWidth = 280;
    const itemWidth = arcWidth / 3;
    // 因为 getArcPosition 接收的是 offsetX / 2，所以这里要乘 2
    // 使得 offset / itemWidth = 1
    const targetOffset = itemWidth * 2;

    if (Math.abs(offsetX) > threshold || velocity > 0.3) {
      setIsAnimating(true);
      
      let finalOffsetX;
      let nextIndex;

      if (offsetX > 0) {
        // 向右滑动，显示上一个
        nextIndex = (currentIndex - 1 + crystalData.length) % crystalData.length;
        finalOffsetX = targetOffset;
      } else {
        // 向左滑动，显示下一个
        nextIndex = (currentIndex + 1) % crystalData.length;
        finalOffsetX = -targetOffset;
      }
      
      // 1. 动画滑动到目标位置
      setOffsetX(finalOffsetX);

      // 2. 动画结束后切换数据并归位
      setTimeout(() => {
        setIsAnimating(false); // 关闭动画
        setCurrentIndex(nextIndex); // 切换数据
        setOffsetX(0); // 重置位置
      }, 300);
    } else {
      // 回弹
      setIsAnimating(true);
      setOffsetX(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // 获取可见的水晶 (改为5个以支持居中)
  const getVisibleCrystals = () => {
    const visible = [];
    const total = 5;
    const centerOffset = 2; // 0, 1, [2], 3, 4
    for (let i = 0; i < total; i++) {
      const index = (currentIndex - centerOffset + i + crystalData.length) % crystalData.length;
      visible.push({ ...crystalData[index], position: i });
    }
    return visible;
  };

  // 计算圆弧位置
  const getArcPosition = (position, offset = 0) => {
    const radius = 100; // 圆弧半径
    const arcWidth = 280; // 圆弧宽度
    const itemWidth = arcWidth / 3; // 每个槽位宽度
    
    // 计算当前位置的 x 坐标
    // position 2 为中心点
    const normalizedPos = position - 2 + (offset / itemWidth);
    const x = normalizedPos * itemWidth;
    
    // 计算 y 坐标（下凹圆弧，负值表示向下）
    const normalizedX = x / (arcWidth / 2);
    // 稍微平缓一点的圆弧，或者保持原样
    const y = -radius * (1 - Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX)));
    
    // 计算缩放（中间大，两边小）
    // 放大中间效果：1.3
    const scale = 1.3 - Math.abs(normalizedPos) * 0.3;
    
    // 计算透明度
    const opacity = Math.max(0.3, 1 - Math.abs(normalizedPos) * 0.3);
    
    return { x, y, scale, opacity };
  };

  // 计算当前水晶对应的运势分数
  const currentFortune = useMemo(() => {
    // 如果没有数据，返回默认值
    if (!fortuneData) return fortuneData;
    
    // 获取当前选中的水晶及其加成
    const selectedCrystal = crystalData[currentIndex];
    const bonuses = CRYSTAL_BONUSES[selectedCrystal.name] || { career: 0, love: 0, health: 0, finance: 0 };

    // 计算应用加成后的分数 (限制在 0-100 之间)
    const newCareer = Math.max(0, Math.min(100, fortuneData.career_score + bonuses.career));
    const newLove = Math.max(0, Math.min(100, fortuneData.love_score + bonuses.love));
    const newHealth = Math.max(0, Math.min(100, fortuneData.health_score + bonuses.health));
    const newFinance = Math.max(0, Math.min(100, fortuneData.finance_score + bonuses.finance));

    // 计算变化值：显示相对于基础运势的变化 (基础变化 + 水晶加成)
    const careerChange = fortuneData.career_score_change + bonuses.career;
    const loveChange = fortuneData.love_score_change + bonuses.love;
    const healthChange = fortuneData.health_score_change + bonuses.health;
    const financeChange = fortuneData.finance_score_change + bonuses.finance;

    return {
      ...fortuneData,
      career_score: newCareer,
      love_score: newLove,
      health_score: newHealth,
      finance_score: newFinance,
      // 更新变化值
      career_score_change: careerChange,
      love_score_change: loveChange,
      health_score_change: healthChange,
      finance_score_change: financeChange,
    };
  }, [fortuneData, currentIndex]);

  // 计算当前总体运势
  const currentOverallScore = useMemo(() => {
    if (!currentFortune) return 0;
    return Math.round(
      (currentFortune.career_score + currentFortune.finance_score + currentFortune.health_score + currentFortune.love_score) / 4
    );
  }, [currentFortune]);

  // 渲染单个运势卡片
  const renderScoreCard = (label, score, change) => {
    const isUp = change > 0;
    const isDown = change < 0;
    // 红色代表上升/正向 (符合该用户之前代码的习惯: #ff4d4f for >=0)，绿色代表下降/负向 (#52c41a/theme color)
    const colorClass = isUp ? styles['color-up'] : (isDown ? styles['color-down'] : styles['color-neutral']);
    const arrow = isUp ? '↑' : (isDown ? '↓' : '');
    // 修正：用户图示是 72 -6 (绿色) ↓。 78 +10 (红色) ↑。
    // 所以：数值本身带符号吗？API返回的是整数。
    // 如果 change > 0, 显示 +change.
    const displayChange = change > 0 ? `+${change}` : `${change}`;

    return (
      <View className={styles['score-card']}>
        <View className={styles['score-content']}>
          <View className={styles['score-top-row']}>
            <Text className={`${styles['score-main']} ${colorClass}`}>{score}</Text>
            <View className={styles['score-change-col']}>
              <Text className={`${styles['score-change-val']} ${colorClass}`}>{displayChange}</Text>
              {arrow && <Text className={`${styles['score-arrow']} ${colorClass}`}>{arrow}</Text>}
            </View>
          </View>
          <Text className={styles['score-label']}>{label}</Text>
        </View>
      </View>
    );
  };

  // 根据幸运色生成渐变背景样式 (支持模糊匹配)
  const getGradientStyle = (luckyColor) => {
    // 定义默认背景色（蓝绿色渐变）
    const defaultGradient = 'linear-gradient(90deg, #05bcaa 0%, #223654 100%)';
    const defaultTextColor = '#ffffff'; // 默认深色背景下文字为白色

    // 1. 如果值为空、undefined 或 null，直接返回默认色
    if (!luckyColor) return { backgroundImage: defaultGradient, color: defaultTextColor };

    let gradient = '';
    let textColor = defaultTextColor; // 默认文字颜色

    // 2. 类型安全处理：强制转为字符串，并去除首尾空格
    const color = String(luckyColor).trim();
    
    // 如果处理后为空字符串，也返回默认色
    if (!color) return { backgroundImage: defaultGradient, color: defaultTextColor };

    // 颜色映射规则表
    // 键为匹配的关键词，值为对应的渐变色和文字颜色
    const colorMap = [
      { keywords: ['红', '朱', '赤', '绯', '玫瑰', '胭脂'], gradient: 'linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%)', isDark: false },
      { keywords: ['橙', '橘', '杏', '柿'], gradient: 'linear-gradient(90deg, #fa8c16 0%, #ffc069 100%)', isDark: false },
      { keywords: ['金', '琥珀'], gradient: 'linear-gradient(90deg, #d4af37 0%, #f7d774 100%)', isDark: false },
      { keywords: ['黄', '柠檬', '米', '卡其'], gradient: 'linear-gradient(90deg, #fadb14 0%, #fffb8f 100%)', isDark: true }, // 浅色背景，文字用深色
      { keywords: ['橄榄'], gradient: 'linear-gradient(90deg, #808000 0%, #b3b300 100%)', isDark: false },
      { keywords: ['绿', '翠', '青', '碧', '玉', '薄荷'], gradient: 'linear-gradient(90deg, #52c41a 0%, #95de64 100%)', isDark: false },
      { keywords: ['蓝', '靛', '蔚', '海', '天'], gradient: 'linear-gradient(90deg, #1890ff 0%, #69c0ff 100%)', isDark: false },
      { keywords: ['紫', '梅', '兰', '熏衣草', '茄'], gradient: 'linear-gradient(90deg, #722ed1 0%, #b37feb 100%)', isDark: false },
      { keywords: ['粉', '桃'], gradient: 'linear-gradient(90deg, #eb2f96 0%, #ffadd2 100%)', isDark: false },
      { keywords: ['白', '雪', '霜', '乳', '银'], gradient: 'linear-gradient(90deg, #d9d9d9 0%, #f5f5f5 100%)', isDark: true }, // 浅色背景，文字用深色
      { keywords: ['黑', '墨', '玄', '灰', '炭'], gradient: 'linear-gradient(90deg, #434343 0%, #000000 100%)', isDark: false },
      { keywords: ['棕', '褐', '咖', '茶'], gradient: 'linear-gradient(90deg, #8b4513 0%, #d2691e 100%)', isDark: false },
    ];

    // 遍历规则进行模糊匹配
    for (const rule of colorMap) {
      if (rule.keywords.some(keyword => color.includes(keyword))) {
        gradient = rule.gradient;
        // 如果是浅色背景（isDark=true），文字颜色设为深灰
        if (rule.isDark) {
          textColor = '#333333';
        }
        break;
      }
    }

    // 3. 如果遍历完所有规则仍未匹配到（gradient为空），使用默认颜色
    if (!gradient) {
      gradient = defaultGradient;
      textColor = defaultTextColor;
    }

    return { backgroundImage: gradient, color: textColor };
  };

  const currentStyle = getGradientStyle(fortuneData.lucky_color);

  return (
    <View className={`flex-col ${styles['page']} ${props.className}`}>
      <View className={`flex-row justify-between items-center self-stretch ${styles['group']}`}>
        <View className={`flex-row items-end`}>
          <Text className={`${styles['text']}`}>互动</Text>
           <Image
              className={`shrink-0 ${styles['image_2']}`}
              src={getOssImageUrl('haoyun/52c16b9f21e50873186b46d7027ea544.png')}
            />
        </View>
       <Button 
            openType='share'
            className={`${styles['ml-9']}`}
            style={{
              padding: 0,
              margin: 0,
              lineHeight: 'normal',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {/* 分享按钮，暂时不用了 */}
               {/* <Image
          className={`${styles['image']}`}
          src={getOssImageUrl('haoyun/f04c3c46f4d4b3c37bc6b6bbab979bbd.png')}
        /> */}
          </Button>
      </View>
      {/* 总体运势 */}
      <View 
        className={`flex-row justify-between items-center self-stretch ${styles['section']}`}
        style={{ backgroundImage: currentStyle.backgroundImage }}
        onClick={() => {
          if (!Taro.getStorageSync('importcode')) {
            Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/My/index' });
            }, 1500);
            return;
          }
          Taro.navigateTo({ url: '/pages/yunshi/yunshi' });
        }}
      >
        <View className='flex-col'>
          <Text className={`${styles['font']} ${styles['text_2']}`} style={{ color: currentStyle.color }}>总体得分：{currentOverallScore}</Text>
          {fortuneData.lucky_color && (
            <Text className={`${styles['font_3']}`} style={{ fontSize: '24px', marginTop: '8px', color: currentStyle.color }}>
              幸运色：{fortuneData.lucky_color}
            </Text>
          )}
        </View>
        <Image
          className={`${styles['image']}`}
          src={getOssImageUrl('haoyun/6916a9ac8af2c3dfdc85e346d3065628.png')}
        />
      </View>
      {/* 得分区域 */}
      <View className={`flex-col self-stretch ${styles['group_3']}`}>
        <View className={styles['equal-division']}>
          {renderScoreCard('事业', currentFortune.career_score, currentFortune.career_score_change)}
          {renderScoreCard('爱情', currentFortune.love_score, currentFortune.love_score_change)}
          {renderScoreCard('健康', currentFortune.health_score, currentFortune.health_score_change)}
          {renderScoreCard('财运', currentFortune.finance_score, currentFortune.finance_score_change)}
        </View>
        {/* <Image
          className={`self-end ${styles['image_4']} ${styles['mt-9']}`}
          src={getOssImageUrl('haoyun/48382d8ac7714d5103fd9326a30aeda5.png')}
          onClick={handleRefresh}
          style={{
            transition: 'transform 1s ease',
            transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)'
          }}
        /> */}
      </View>
      {/* 注意：这里就是小鹿的位置了 */}
      <View 
        className={`shrink-0 self-center relative ${styles['section_3']}`}
        style={{
            backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/haoyun/xiaolu.gif)`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
          }}
        onClick={() => {
          if (!Taro.getStorageSync('importcode')) {
            Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/My/index' });
            }, 1500);
            return;
          }
          setShowPetStatus(true);
        }}
      >
        <View className={styles['deer-glow']} />
      </View>

      <View 
        className={`flex-row justify-center items-center self-center relative ${styles['group_8']}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          overflow: 'visible',
          height: '200px',
          width: '100%',
          position: 'relative'
        }}
      >
        {getVisibleCrystals().map((crystal, idx) => {
          const pos = getArcPosition(crystal.position, offsetX / 2);
          const isCenter = Math.abs(pos.x) < 50;
          
          return (
            <View
              key={`${crystal.name}-${idx}`}
              className='flex-col items-center'
              onClick={() => {
                if (!isAnimating && Math.abs(offsetX) < 10) {
                  if (isCenter) {
                    if (!Taro.getStorageSync('importcode')) {
                      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
                      setTimeout(() => {
                        Taro.switchTab({ url: '/pages/My/index' });
                      }, 1500);
                      return;
                    }
                    Taro.navigateTo({ url: crystal.url });
                  }
                }
              }}
              style={{
                position: 'absolute',
                transform: `translateX(${pos.x}rpx) translateY(${pos.y}rpx) scale(${pos.scale})`,
                opacity: pos.opacity,
                transition: isAnimating ? 'all 0.3s ease-out' : 'none',
                zIndex: Math.round((1 - Math.abs(pos.x) / 200) * 100),
              }}
            >
              <View 
                className={styles['floating']}
                style={{
                  animationDelay: `${idx * 0.5}s`
                }}
              >
                <View className={styles['crystal-inner']}>
                  <Image
                    className={styles['image_5']}
                    src={getOssImageUrl(crystal.image)}
                    style={{
                      pointerEvents: 'none'
                    }}
                  />
                  <Text 
                    className={styles['font_4']}
                    style={{
                      marginTop: '14px',
                      pointerEvents: 'none',
                      opacity: isCenter ? 1 : 0,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {crystal.name}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View className={`self-center ${styles['backimg-container']}`}
        style={{
          backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/haoyun/backimg.png)`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          width: '100%',
          height: '320px',
          marginTop: '-100px', // Pull it up a bit to overlap with crystals as seen in design often, or just to reduce space
          // filter: 'blur(10px)'
        }}
      />

{/* 灵宠属性弹窗 */}
      {showPetStatus && (
        <View className={styles['modal-overlay']} onClick={() => setShowPetStatus(false)}>
          <View className={styles['modal-content']} onClick={e => e.stopPropagation()}>
            <View className={styles['modal-title']}>灵宠属性</View>
            
            <View className={styles['pet-info-row']}>
              <Text className={styles['pet-label']}>名称</Text>
              <Text className={styles['pet-value']}>{petInfo.name}</Text>
            </View>
            
            <View className={styles['pet-info-row']}>
              <Text className={styles['pet-label']}>品质</Text>
              <Text className={styles['pet-value']}>{petInfo.rarity}</Text>
            </View>
{/* 
            <View className={styles['pet-info-row']}>
              <Text className={styles['pet-label']}>描述</Text>
              <Text className={styles['pet-value']}>常年生活在迷雾森林中，行踪诡秘。</Text>
            </View> */}

            <View className={styles['pet-info-row']}>
              <Text className={styles['pet-label']}>等级</Text>
              <Text className={styles['pet-value']}>Lv.{petInfo.level}</Text>
            </View>

            {/* <View className={styles['pet-info-row']}>
              <Text className={styles['pet-label']}>故事</Text>
              <Text className={styles['pet-value']}>听到了你内心的呼唤，决定成为你的伙伴。</Text>
            </View> */}

            
            <View className={styles['pet-info-row']}>
              <Text className={styles['pet-label']}>灵力</Text>
              <View className={styles['progress-bar']}>
                <View className={styles['progress-fill']} style={{ width: '65%' }} />
              </View>
              <Text className={`${styles['pet-value']} ml-2`}>650/1000</Text>
            </View>
            
            <View className={styles['pet-info-row']}>
              <Text className={styles['pet-label']}>亲密度</Text>
              <View className={styles['progress-bar']}>
                <View className={styles['progress-fill']} style={{ width: '82%' }} />
              </View>
              <Text className={`${styles['pet-value']} ml-2`}>820</Text>
            </View>

            <View className={styles['close-btn']} onClick={() => setShowPetStatus(false)}>
              关闭
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

Haoyun.defaultProps = { className: '' };