import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, Textarea, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.css';
import { getOssImageUrl } from '../../utils/config';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import RollingNumber from '../../components/RollingNumber';

// 故事模板
const STORY_TEMPLATES = [
  { text: "小鹿在森林深处发现了一朵发光的{noun}，它似乎在低语着关于{emotion}的秘密。", type: "wonder" },
  { text: "在追逐一只幻影蝴蝶时，小鹿不小心跌入了一个{adjective}的洞穴，却在里面发现了古代的遗迹。", type: "adventure" },
  { text: "小鹿遇到了一位神秘的老者，老者看着它，说出了那句预言：'{wish}'。", type: "mystic" },
  { text: "突然一阵狂风刮过，小鹿迷失了方向，但它记得你的嘱托：'{wish}'，这给了它力量。", type: "struggle" }
];

const DEFAULT_CSRF_TOKEN = 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s';

export default function NFCTouch() {
  const [status, setStatus] = useState('idle'); // idle, reading, success, error
  const [message, setMessage] = useState('正在准备水晶共鸣...');
  const [energy, setEnergy] = useState(0); // Total Energy (Accumulated)
  const [balance, setBalance] = useState(0); // Current Energy (Consumable)
  const [touchesUsed, setTouchesUsed] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  
  // 新增状态
  const [showMailbox, setShowMailbox] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [userWish, setUserWish] = useState('');
  const [stories, setStories] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  
  // Level Up State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [levelThreshold, setLevelThreshold] = useState(100);

  // Use Refs to access latest state in closures (callbacks/timeouts)
  const statusRef = useRef(status);
  statusRef.current = status;
  const activeCrystalIdRef = useRef('');
  const actionLockRef = useRef(false);

  const getReadyMessage = (crystalId = activeCrystalIdRef.current) =>
    crystalId
      ? '已连接当前水晶，点击下方按钮即可开始共鸣'
      : '未找到水晶信息，请先返回激活水晶页面';

  const syncActiveCrystal = (crystalId) => {
    const normalizedId = (crystalId || '').trim();
    activeCrystalIdRef.current = normalizedId;
    if (normalizedId) {
      Taro.setStorageSync('nfc_tag_id', normalizedId);
    }
  };

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    const resolvedCrystalId = `${params.sn || Taro.getStorageSync('nfc_tag_id') || ''}`.trim();
    syncActiveCrystal(resolvedCrystalId);
    setStatus('idle');
    setMessage(getReadyMessage(resolvedCrystalId));

    // 初始化数据
    const storedEnergy = Taro.getStorageSync('spirit_energy') || 0;
    const storedBalance = Taro.getStorageSync('spirit_balance') || 0;
    const storedTouches = Taro.getStorageSync('daily_touches_used');
    const storedStories = Taro.getStorageSync('deer_stories') || [];
    const lastTouchDate = Taro.getStorageSync('last_touch_date');
    const storedThreshold = Taro.getStorageSync('level_threshold') || 100;
    const today = new Date().toDateString();

    console.log('=== App Initializing ===');
    console.log('Stored Energy:', storedEnergy);
    console.log('Stored Balance:', storedBalance);
    console.log('Stored Touches Used:', storedTouches);
    console.log('Last Touch Date:', lastTouchDate);
    console.log('Stored Threshold:', storedThreshold);

    setEnergy(storedEnergy);
    setBalance(storedBalance);
    setStories(storedStories);
    setLevelThreshold(storedThreshold);
    
    // 检查未读
    const unreadCount = storedStories.filter(s => !s.read).length;
    setHasUnread(unreadCount > 0);

    // 每日重置次数
    if (lastTouchDate !== today) {
      setTouchesUsed(0);
      Taro.setStorageSync('daily_touches_used', 0);
      Taro.setStorageSync('last_touch_date', today);
    } else {
      setTouchesUsed(storedTouches !== undefined ? storedTouches : 0);
    }

  }, []);

  const animateEnergy = (start, end, duration = 1000) => {
    const range = end - start;
    const startTime = Date.now();
    
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuad)
      const ease = 1 - (1 - progress) * (1 - progress);
      
      const current = Math.floor(start + range * ease);
      setEnergy(current);
      
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setEnergy(end);
        Taro.setStorageSync('spirit_energy', end);
      }
    };
    
    tick();
  };

  const handleTouchCrystal = async (crystalId) => {
    const targetCrystalId = `${crystalId || activeCrystalIdRef.current || ''}`.trim();
    if (!targetCrystalId) {
      Taro.showToast({ title: '未找到水晶信息', icon: 'none' });
      setStatus('error');
      setMessage('未找到水晶信息，请先返回激活水晶页面');
      return;
    }

    if (actionLockRef.current) {
      return;
    }

    // Use Ref for status check to avoid stale closures
    if (statusRef.current === 'success' || statusRef.current === 'reading' || showReward || showMailbox || showInput || showLevelUp) return;
    
    // Check storage directly to ensure we respect the daily limit even if state is stale in closure
    const storedTouches = Taro.getStorageSync('daily_touches_used');
    const currentTouches = storedTouches !== undefined ? storedTouches : touchesUsed;

    // 检查剩余次数
    if (currentTouches >= 3) {
      Taro.showToast({ title: '今日感应次数已用完', icon: 'none' });
      return;
    }

    actionLockRef.current = true;
    setStatus('reading');
    setMessage('正在感应灵力波动...');
    Taro.vibrateShort({ type: 'medium' });

    try {
      await callTouchCrystalApi(targetCrystalId);
    } finally {
      actionLockRef.current = false;
    }
  };

  const callTouchCrystalApi = async (nfcId) => {
    try {
      const res = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.TOUCH_CRYSTAL),
      method: 'POST',
      header: {
        'accept': 'application/json',
        'X-Login-Token': Taro.getStorageSync("importcode"),
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': DEFAULT_CSRF_TOKEN
      },
      data: {
        nfc_tag_id: nfcId,
        touch_time: new Date().toISOString(),
        source: "nfc"
      }
      });

      if (res.statusCode === 200) {
        syncActiveCrystal(nfcId);
        handleApiResponse(res.data);
        return;
      }

      Taro.showToast({ title: '感应失败，请重试', icon: 'none' });
      setStatus('error');
      setMessage('本次共鸣未成功，请检查激活码后重试');
    } catch (err) {
      console.error('API Error:', err);
      Taro.showToast({ title: '网络连接失败', icon: 'none' });
      setStatus('error');
      setMessage('网络连接失败，请稍后重试');
    }
  };

  const handleApiResponse = (data) => {
    console.log('API Response:', data);
    const { total_energy, current_energy, points_awarded, is_critical, level_up, new_level, level_info } = data;

    console.log('Updating balance to:', current_energy);
    console.log('Writing spirit_balance to storage:', current_energy);
    
    // Update Balance
    setBalance(current_energy);
    try {
        Taro.setStorageSync('spirit_balance', current_energy);
        console.log('Storage write successful');
    } catch (e) {
        console.error('Storage write failed:', e);
    }

    // Update Threshold if available
    if (level_info && level_info.threshold) {
        setLevelThreshold(level_info.threshold);
        Taro.setStorageSync('level_threshold', level_info.threshold);
    }

    // Determine reward type for UI
    let rewardType = 'common';
    let title = '灵力共鸣';
    let desc = '灵力缓缓流入，精神稍感振奋';
    
    if (is_critical) {
      rewardType = 'critical';
      title = '完美共鸣！';
      desc = '意念通达，感受到强烈的灵力波动！';
    } else if (points_awarded > 20) {
      rewardType = 'rare';
      title = '灵犀一闪';
    }

    const reward = {
      type: rewardType,
      energy: points_awarded,
      title: title,
      desc: desc,
      isCritical: is_critical
    };

    // Update States
    // Use storage to get the base value to avoid stale closure issues
    const currentStoredTouches = Taro.getStorageSync('daily_touches_used');
    const baseTouches = currentStoredTouches !== undefined ? currentStoredTouches : touchesUsed;
    const newTouches = baseTouches + 1;
    
    setTouchesUsed(newTouches);
    Taro.setStorageSync('daily_touches_used', newTouches);

    setCurrentReward(reward);
    setStatus('success');
    setShowReward(true);
    Taro.vibrateLong();

    // Animate Energy
    animateEnergy(energy, total_energy);

    // Handle Level Up
    if (level_up) {
      setLevelUpData({
        newLevel: new_level,
        description: `恭喜！你的灵力境界已提升至 ${new_level}`
      });
      // Show level up after a short delay or when reward is closed
      // For now, we'll queue it to show after reward is closed
    }

    // Generate story if applicable (Simulated for now as API doesn't return story)
    if (userWish && Math.random() < 0.5) {
       const newStory = generateStory(userWish);
       const updatedStories = [newStory, ...stories];
       setStories(updatedStories);
       setHasUnread(true);
       Taro.setStorageSync('deer_stories', updatedStories);
       setUserWish('');
    }
  };

  const buyResetTouches = () => {
      console.log('Attempting to buy reset. Balance:', balance);
      if (balance < 30) {
          console.log('Insufficient balance. Needed: 30, Have:', balance);
          Taro.showToast({ title: '灵力不足', icon: 'none' });
          return;
      }

      Taro.showLoading({ title: '购买中...' });
      
      const storedNfcId = Taro.getStorageSync('nfc_tag_id');
      const nfcId = storedNfcId || 'NFC_003';

      Taro.request({
          url: getApiUrl(API_ENDPOINTS.TOUCH_CRYSTAL_CONSUME_ENERGY),
          method: 'POST',
          header: {
              'accept': 'application/json',
              'X-API-Key': '123quant-speed',
              'Content-Type': 'application/json',
              'X-CSRFTOKEN': 'vctw4WGifjcia4ps5NBpwB0OlErGBsoG7hj0ZsyavggQt2QA05BVtqEvMvnZ41y4'
          },
          data: {
              nfc_id: nfcId,
              amount: 30,
              reason: "buy reroll"
          },
          success: (res) => {
              Taro.hideLoading();
              if (res.statusCode === 200) {
                  // 购买成功
                  const { current_energy } = res.data;
                  setBalance(current_energy);
                  Taro.setStorageSync('spirit_balance', current_energy);
                  
                  // 重置次数
                  setTouchesUsed(0);
                  Taro.setStorageSync('daily_touches_used', 0);
                  
                  Taro.showToast({ title: '购买成功', icon: 'success' });
                  setShowShop(false);
              } else {
                  Taro.showToast({ title: '购买失败', icon: 'none' });
              }
          },
          fail: (err) => {
              Taro.hideLoading();
              console.error('API Error:', err);
              Taro.showToast({ title: '网络连接失败', icon: 'none' });
          }
      });
  };

  const generateStory = (wish) => {
    const template = STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];
    let content = template.text;
    
    // 简单的替换逻辑
    const nouns = ["水晶花", "星光石", "迷雾果", "古老符文"];
    const adjectives = ["幽暗", "璀璨", "神秘", "静谧"];
    const emotions = ["希望", "勇气", "智慧", "爱"];
    
    content = content.replace('{noun}', nouns[Math.floor(Math.random() * nouns.length)]);
    content = content.replace('{adjective}', adjectives[Math.floor(Math.random() * adjectives.length)]);
    content = content.replace('{emotion}', emotions[Math.floor(Math.random() * emotions.length)]);
    content = content.replace('{wish}', wish || "心诚则灵");
    
    return {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      title: wish ? `关于"${wish.slice(0, 4)}..."的回信` : "小鹿的奇遇",
      content: content,
      read: false,
      type: template.type
    };
  };

  const closeReward = () => {
    setShowReward(false);
    
    if (levelUpData) {
      setShowLevelUp(true);
    } else {
      setStatus('idle');
      setMessage(getReadyMessage());
    }
  };

  const closeLevelUp = () => {
    setShowLevelUp(false);
    setLevelUpData(null);
    setStatus('idle');
    setMessage(getReadyMessage());
  };
  
  const toggleMailbox = () => {
    setShowMailbox(!showMailbox);
  };

  const markAsRead = (id) => {
    const updated = stories.map(s => s.id === id ? {...s, read: true} : s);
    setStories(updated);
    Taro.setStorageSync('deer_stories', updated);
    setHasUnread(updated.some(s => !s.read));
  };

  return (
    <View className={styles.page}>
      {/* 顶部状态栏 */}
      <View className={styles.header}>
        <View className={styles.statBox}>
          <View className={styles.iconWrapper}>
             <Text className={styles.iconText}>⚡️</Text>
          </View>
          <View className={styles.statInfo}>
            <Text className={styles.statLabel}>灵力值</Text>
            <RollingNumber value={energy} height={34} fontSize={32} />
          </View>
        </View>
        
        <View className={styles.rightStats}>
            <View className={styles.statBox} onClick={() => {
                if (touchesUsed >= 3) setShowShop(true);
            }}>
              <View className={styles.iconWrapper}>
                 <Text className={styles.iconText}>🔮</Text>
              </View>
              <View className={styles.statInfo}>
                <Text className={styles.statLabel}>今日次数</Text>
                <Text className={styles.statValue}>{touchesUsed}/3</Text>
              </View>
            </View>

            <View className={styles.mailIcon} onClick={toggleMailbox}>
                <Text className={styles.mailEmoji}>✉️</Text>
                {hasUnread && <View className={styles.redDot} />}
            </View>
        </View>
      </View>

      {/* 之前为了上传loading页面的隐藏按钮。
      <View className={styles.scanRow}>
        <View className={styles.scanIcon} onClick={() => Taro.navigateTo({ url: '/pages/Loading/index' })}>
            <Text className={styles.scanEmoji}>🔧</Text>
        </View>
        <View className={styles.scanIcon} onClick={handleScanActivate}>
            <Text className={styles.scanEmoji}>📷</Text>
        </View>
      </View> */}

      {/* 中心水晶/灵宠区域 */}
      <View className={`${styles.crystalContainer} ${styles[status]}`}>
        <View className={styles.glow} />
        <View className={styles.particles} />
        <Image 
          className={styles.crystalImage}
          src={getOssImageUrl('SJSY/1e467fc804d0fd434a82a6706adadf24.png')} 
          mode="aspectFit"
        />
        {/* 悬浮文字 */}
        {status === 'reading' && (
          <Text className={styles.floatingText}>共鸣中...</Text>
        )}
        
        {/* 寄语按钮 */}
        {status !== 'reading' && (
            <View className={styles.wishBtn} onClick={() => setShowInput(true)}>
                <Text className={styles.wishText}>{userWish ? "寄语已封存" : "写下寄语"}</Text>
            </View>
        )}
      </View>
      
      <Text className={styles.mainTitle}>
        {status === 'success' ? '共鸣成功' : '触碰水晶'}
      </Text>
      <Text className={styles.subText}>{message}</Text>

      <View className={styles.actionPanel}>
        <Button
          className={`${styles.primaryAction} ${status === 'reading' ? styles.primaryActionDisabled : ''}`}
          disabled={status === 'reading'}
          onClick={() => handleTouchCrystal()}
        >
          {status === 'reading' ? '共鸣中...' : '开始共鸣'}
        </Button>
        <Text className={styles.actionTip}>
          系统会直接使用已缓存的水晶编号，与当前水晶进行共鸣
        </Text>
      </View>
      
      {/* 寄语输入弹窗 */}
      {showInput && (
        <View className={styles.overlay}>
            <View className={styles.inputCard}>
                <Text className={styles.inputTitle}>给小鹿的寄语</Text>
                <Textarea 
                    className={styles.wishInput}
                    value={userWish}
                    onInput={(e) => setUserWish(e.detail.value)}
                    placeholder="写下你的愿望或想对小鹿说的话..."
                    maxlength={50}
                />
                <View className={styles.inputActions}>
                    <View className={styles.cancelBtn} onClick={() => setShowInput(false)}>取消</View>
                    <View className={styles.sendBtn} onClick={() => {
                        Taro.showToast({ title: '寄语已封存', icon: 'success' });
                        setShowInput(false);
                    }}>封存</View>
                </View>
            </View>
        </View>
      )}
      
      {/* 信箱弹窗 */}
      {showMailbox && (
        <View className={styles.overlay}>
            <View className={styles.mailboxCard}>
                <Text className={styles.mailboxTitle}>小鹿的来信</Text>
                <ScrollView scrollY className={styles.mailList}>
                    {stories.length === 0 ? (
                        <Text className={styles.emptyMail}>暂时还没有收到来信哦~</Text>
                    ) : (
                        stories.map(story => (
                            <View key={story.id} className={`${styles.mailItem} ${!story.read ? styles.unread : ''}`} onClick={() => markAsRead(story.id)}>
                                <View className={styles.mailHeader}>
                                    <Text className={styles.mailDate}>{story.date}</Text>
                                    {!story.read && <View className={styles.newBadge}>NEW</View>}
                                </View>
                                <Text className={styles.mailSubject}>{story.title}</Text>
                                <Text className={styles.mailContent}>{story.content}</Text>
                            </View>
                        ))
                    )}
                </ScrollView>
                <View className={styles.closeMailbox} onClick={toggleMailbox}>关闭</View>
            </View>
        </View>
      )}
      
      {/* 商店弹窗 */}
      {showShop && (
        <View className={styles.overlay}>
            <View className={styles.shopCard}>
                <Text className={styles.shopTitle}>灵力商店</Text>
                
                <View className={styles.shopHeader}>
                    <View className={styles.shopStat}>
                        <Text className={styles.shopStatLabel}>可消耗灵力</Text>
                        <Text className={styles.shopStatValue}>{balance}</Text>
                    </View>
                    <View className={styles.shopStat}>
                        <Text className={styles.shopStatLabel}>总灵力</Text>
                        <Text className={styles.shopStatValue}>{energy}</Text>
                    </View>
                </View>

                <View className={styles.shopList}>
                    <View className={styles.shopItem}>
                        <View className={styles.shopItemInfo}>
                            <Text className={styles.shopItemTitle}>次数重置</Text>
                            <Text className={styles.shopItemDesc}>恢复3次今日感应次数</Text>
                            <Text className={styles.shopItemPrice}>⚡️ 30</Text>
                        </View>
                        <View 
                            className={`${styles.shopItemBuyBtn} ${balance < 30 ? styles.disabled : ''}`}
                            onClick={buyResetTouches}
                        >
                            购买
                        </View>
                    </View>
                </View>
                <View className={styles.closeShop} onClick={() => setShowShop(false)}>关闭</View>
            </View>
        </View>
      )}
      
      {/* 奖励弹窗 */}
      {showReward && currentReward && (
        <View className={styles.overlay}>
          <View className={`${styles.rewardCard} ${styles[currentReward.type]}`}>
            <View className={styles.rewardLight} />
            <Text className={styles.rewardTitle}>{currentReward.title}</Text>
            <View className={styles.rewardIcon}>
               <Image 
                 src={getOssImageUrl('SJSY/1e467fc804d0fd434a82a6706adadf24.png')}
                 className={styles.rewardImage}
               />
            </View>
            {currentReward.energy > 0 ? (
                <Text className={styles.rewardEnergy}>灵力 +{currentReward.energy}</Text>
            ) : (
                <Text className={styles.accidentText}>本次未获得灵力</Text>
            )}
            <Text className={styles.rewardDesc}>{currentReward.desc}</Text>
            
            {hasUnread && (
                <Text className={styles.mailHint}>收到了一封新的来信！✉️</Text>
            )}
            
            <View className={styles.confirmBtn} onClick={closeReward}>
              {currentReward.type === 'accident' ? '安抚小鹿' : '收入囊中'}
            </View>
          </View>
        </View>
      )}

      {/* 升级弹窗 */}
      {showLevelUp && levelUpData && (
        <View className={styles.overlay}>
          <View className={styles.levelUpCard}>
             <View className={styles.rewardLight} />
             <Text className={styles.levelUpTitle}>境界突破</Text>
             <Text className={styles.levelUpInfo}>
                {levelUpData.description}
                <Text className={styles.newLevelName}>{levelUpData.newLevel}</Text>
             </Text>
             <View className={styles.confirmBtn} onClick={closeLevelUp}>
                继续修行
             </View>
          </View>
        </View>
      )}

      {/* 底部灵力仪表盘 */}
      <View className={styles.bottomPanel}>
         <View className={styles.balanceSection}>
            <Text className={styles.balanceLabel}>可用灵力</Text>
            <RollingNumber value={balance} height={48} fontSize={48} />
         </View>
         <View className={styles.levelProgress}>
            <View className={styles.progressInfo}>
                <Text className={styles.progressLabel}>距离下一境界还需</Text>
                <Text className={styles.progressValue}>
                    {levelThreshold > 0 ? Math.max(0, levelThreshold - energy) : 0}
                </Text>
            </View>
            <View className={styles.progressBarBg}>
                <View 
                    className={styles.progressBarFill} 
                    style={{ width: `${levelThreshold > 0 ? Math.min(100, (energy / levelThreshold) * 100) : 100}%` }} 
                />
            </View>
         </View>
      </View>

      {/* 底部按钮区域 */}
      {/* 先不要删除
      <View className={styles.bottomControls}>
     
        <View className={styles.simulateBtn} onClick={handleNFCSuccess}>
          模拟触碰
        </View>
        
      
        <View style={{ display: 'flex', gap: '10px' }}>
            <View className={styles.resetBtn} onClick={resetTouches}>
            重置次数
            </View>
            <View className={styles.resetBtn} onClick={testCritical}>
            测试暴击
            </View>
            <View className={styles.resetBtn} onClick={testLevelUp}>
            测试升级
            </View>
        </View>
      </View> */}
    </View>
  );
}
