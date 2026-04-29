import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './SJShouYe.module.css';
import { getOssImageUrl } from '../../utils/config.js';
import { checkCrystalActivation } from '../../utils/auth.js';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';

export default function SJShouYe(props) {
  const [pressedCard, setPressedCard] = useState(null);
  const [crystalData, setCrystalData] = useState(null);
  const [activateDateStr, setActivateDateStr] = useState('');
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [touchCountStr, setTouchCountStr] = useState('');
  const [showTouchTooltip, setShowTouchTooltip] = useState(false);
  const [levelStr, setLevelStr] = useState('');
  const [showLevelTooltip, setShowLevelTooltip] = useState(false);
  const [deerLevelStr, setDeerLevelStr] = useState('');
  const [showDeerTooltip, setShowDeerTooltip] = useState(false);
  const isWebEnv = Taro.getEnv() === Taro.ENV_TYPE.WEB;

  const ensureLoginForTouch = () => {
    if (Taro.getStorageSync('importcode')) {
      return true;
    }

    Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/My/index' });
    }, 1500);
    return false;
  };

  const handleTouchCrystalClick = () => {
    if (isWebEnv) {
      if (!ensureLoginForTouch()) return;
      Taro.navigateTo({ url: '/pages/NFCTouch/index' });
      return;
    }

    if (checkCrystalActivation()) {
      Taro.navigateTo({ url: '/pages/NFCTouch/index' });
    }
  };

  useDidShow(() => {
    // 检查是否有播客生成提示
    const showPodcastToast = Taro.getStorageSync('showPodcastToast');
    if (showPodcastToast) {
      Taro.showModal({
        title: '播客生成中',
        content: '播客预计2-3分钟生成，请稍后查看。',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#D4AF37'
      });
      Taro.removeStorageSync('showPodcastToast');
    }

    const fetchData = async () => {
      const nfcId = Taro.getStorageSync('nfc_tag_id');
      const token = Taro.getStorageSync('importcode');

      if (!nfcId) {
        console.log('[SJShouYe] skip touch_crystal request because nfc_tag_id is missing');
        return;
      }

      if (!token) {
        console.log('[SJShouYe] skip touch_crystal request because importcode is missing');
        return;
      }

      try {
        const res = await Taro.request({
          url: getApiUrl(API_ENDPOINTS.TOUCH_CRYSTAL),
          method: 'GET',
          data: { nfc_tag_id: nfcId },
          header: {
            'accept': 'application/json',
            'X-Login-Token': Taro.getStorageSync("importcode"),
            'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
          }
        });
        if (res.statusCode === 200) {
          setCrystalData(res.data);
        }
      } catch (err) {
        console.error('Fetch crystal data error:', err);
      }
    };
    fetchData();

    // 拿到当前用户所激活的所有水晶，然后对比缓存中的nfc id，找到缓存中nfcid 对应的信息。
    const fetchUserTags = () => {
      const token = Taro.getStorageSync('importcode');

      if (!token) {
        console.log('[SJShouYe] skip user_nfc_tags request because importcode is missing');
        return;
      }

      Taro.request({
        url: getApiUrl(API_ENDPOINTS.ACTIVATE_CRYSTAL_USER_TAGS),
        method: 'GET',
        header: {
          'accept': 'application/json',
          'X-Login-Token': token,
          'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            // Find touch count for current NFC tag
            const currentNfcTagId = Taro.getStorageSync('nfc_tag_id');
            console.log('debugSJSY: currentNfcTagId:', currentNfcTagId);
            if (currentNfcTagId && Array.isArray(res.data.results)) {
              // Note: nfc_tag_id is inside crystal_tag object based on the user provided response structure
              // Structure: item.crystal_tag.nfc_tag_id
              const currentTag = res.data.results.find(item => {
                const tagId = item.crystal_tag && item.crystal_tag.nfc_tag_id;
                // Compare as strings to avoid type mismatch
                return String(tagId) === String(currentNfcTagId);
              });
              console.log('debugSJSY: currentTag found:', currentTag);

              if (currentTag) {
                Taro.setStorageSync('bindBrad', currentTag);
              }
            }
          }
        },
        fail: (err) => {
          console.error('Fetch user tags error:', err);
        }
      });
    };
    fetchUserTags();
  });

  const showActivateDate = () => {
    if (!Taro.getStorageSync('importcode')) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/My/index' });
      }, 1500);
      return;
    }
    const bindBrad = Taro.getStorageSync('bindBrad');
    if (bindBrad && bindBrad.crystal_tag && bindBrad.crystal_tag.created_at) {
      const dateStr = bindBrad.crystal_tag.created_at.split('T')[0];
      setActivateDateStr(dateStr);
      setTimeout(() => {
        setShowDateTooltip(true);
        setTimeout(() => {
          setShowDateTooltip(false);
        }, 1500);
      }, 200);
    } else {
      Taro.showToast({
        title: '暂无激活日期',
        icon: 'none',
        duration: 1500
      });
    }
  };

  const showTouchCount = () => {
    if (!Taro.getStorageSync('importcode')) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/My/index' });
      }, 1500);
      return;
    }
    const bindBrad = Taro.getStorageSync('bindBrad');
    if (bindBrad && bindBrad.touch_count !== undefined) {
      setTouchCountStr(`${bindBrad.touch_count} 次`);
      setTimeout(() => {
        setShowTouchTooltip(true);
        setTimeout(() => {
          setShowTouchTooltip(false);
        }, 1500);
      }, 200);
    } else {
      Taro.showToast({
        title: '暂无触碰数据',
        icon: 'none',
        duration: 1500
      });
    }
  };

  const showFortuneLevel = () => {
    if (!Taro.getStorageSync('importcode')) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/My/index' });
      }, 1500);
      return;
    }
    const bindBrad = Taro.getStorageSync('bindBrad');
    if (bindBrad && bindBrad.level) {
      const levelMap = {
        'raw': '原石·沉睡',
        'glimmer': '微光·觉醒',
        'luster': '焕彩·聚能',
        'radiance': '璀璨·共鸣',
        'ether': '幻界·飞升'
      };
      const levelText = levelMap[bindBrad.level] || bindBrad.level;
      setLevelStr(levelText);
      setTimeout(() => {
        setShowLevelTooltip(true);
        setTimeout(() => {
          setShowLevelTooltip(false);
        }, 1500);
      }, 200);
    } else {
      Taro.showToast({
        title: '暂无等级信息',
        icon: 'none',
        duration: 1500
      });
    }
  };

  const showDeerLevel = () => {
    if (!Taro.getStorageSync('importcode')) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/My/index' });
      }, 1500);
      return;
    }
    const bindBrad = Taro.getStorageSync('bindBrad');
    if (bindBrad && bindBrad.ip_image_state) {
      const deerMap = {
        'infant': '幼鹿',
        'teen': '少年鹿',
        'adult': '成年鹿'
      };
      const deerText = deerMap[bindBrad.ip_image_state] || bindBrad.ip_image_state;
      setDeerLevelStr(deerText);
      setTimeout(() => {
        setShowDeerTooltip(true);
        setTimeout(() => {
          setShowDeerTooltip(false);
        }, 1500);
      }, 200);
    } else {
      Taro.showToast({
        title: '暂无小鹿信息',
        icon: 'none',
        duration: 1500
      });
    }
  };

  const handleEntertainmentReferenceClick = () => {
    if (!checkCrystalActivation()) return;
    Taro.navigateTo({ url: '/pages/yunshi/yunshi?source=entertainment' });
  };

  // 分享给朋友
  Taro.useShareAppMessage(() => {
    return {
      title: '快来体验水晶运势，开启你的能量之旅！',
      path: '/pages/SJShouYe/SJShouYe',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    }
  })

  // 分享到朋友圈
  Taro.useShareTimeline(() => {
    return {
      title: '快来体验水晶运势，开启你的能量之旅！',
      query: '',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    }
  })

  return (
    <View className={`flex-col ${styles['page']} ${props.className}`}>
      <View
        className={`flex-row ${styles['section']}`}
        style={{ backgroundImage: `url(${getOssImageUrl('SJSY/2ef0ed71548c576fd256d13e2f016096.png')})` }}
      >
        <Text className={`self-start ${styles['deerTitle']} ${styles['ml-11']}`} style={{ fontFamily: 'HanyiXuejunFanti', letterSpacing: '4px' }}>遣山小鹿</Text>
        <Text className={`self-start ${styles['text']} ${styles['ml-11']}`} style={{ fontFamily: 'HanyiXuejunFanti', fontSize: '24px', letterSpacing: '2px' }}>运势金</Text>
        <Image
          mode="aspectFit"
          className={`flex-1 ${styles['image']} ${styles['ml-11']}`}
          src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/onlyxiaolu.png"
        />

      </View>
      <View className={`flex-col ${styles['group']} ${styles['mt-3']}`}>
        <View className={`flex-col`}>
          <View
            className={`flex-col ${styles['section_2']}`}
            style={{ backgroundImage: `url(${getOssImageUrl('SJSY/b006026aece6a0992802b69125015c60.png')})` }}
          >
            <View className={styles.statsRow}>
              <View className={`flex-col items-center ${styles['section_3']} ${styles['equal-division-item']}`}
                onClick={showActivateDate}
                onTouchStart={() => setPressedCard('activateDate')}
                onTouchEnd={() => setPressedCard(null)}
                onTouchCancel={() => setPressedCard(null)}
                style={{
                  position: 'relative',
                  transform: pressedCard === 'activateDate' ? 'scale(0.95)' : 'scale(1)',
                  opacity: pressedCard === 'activateDate' ? 0.8 : 1,
                  transition: 'all 0.1s ease'
                }}
              >
                <Image
                  className={`${styles['image_3']}`}
                  src={getOssImageUrl('SJSY/02e9c80f98203eea1bf0746e95d7f428.png')}
                />
                <Text className={`${styles['font_2']} ${styles['mt-9']}`}>激活日期</Text>
                {showDateTooltip && (
                  <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3d6650',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    marginTop: '8px',
                    zIndex: 100,
                    border: '1px solid #d6a207',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: '24px',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold'
                    }}>{activateDateStr}</Text>
                  </View>
                )}
              </View>

              <View className={`flex-col items-center ${styles['section_3']} ${styles['equal-division-item']}`}
                onClick={showDeerLevel}
                onTouchStart={() => setPressedCard('deerLevel')}
                onTouchEnd={() => setPressedCard(null)}
                onTouchCancel={() => setPressedCard(null)}
                style={{
                  position: 'relative',
                  transform: pressedCard === 'deerLevel' ? 'scale(0.95)' : 'scale(1)',
                  opacity: pressedCard === 'deerLevel' ? 0.8 : 1,
                  transition: 'all 0.1s ease'
                }}
              >
                <Image
                  className={`${styles['image_3']}`}
                  src={getOssImageUrl('SJSY/e25e6c729266e1ac6481cbd895ad5fc7.png')}
                />
                <Text className={`${styles['font_2']} ${styles['mt-9']}`}>小鹿等级</Text>
                {showDeerTooltip && (
                  <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3d6650',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    marginTop: '8px',
                    zIndex: 100,
                    border: '1px solid #d6a207',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: '24px',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold'
                    }}>{deerLevelStr}</Text>
                  </View>
                )}
              </View>
              {/* 触碰次数 */}
              <View className={`flex-col items-center ${styles['section_3']} ${styles['equal-division-item']}`}
                onClick={showTouchCount}
                onTouchStart={() => setPressedCard('touchCount')}
                onTouchEnd={() => setPressedCard(null)}
                onTouchCancel={() => setPressedCard(null)}
                style={{
                  position: 'relative',
                  transform: pressedCard === 'touchCount' ? 'scale(0.95)' : 'scale(1)',
                  opacity: pressedCard === 'touchCount' ? 0.8 : 1,
                  transition: 'all 0.1s ease'
                }}
              >
                <Image
                  className={`${styles['image_3']}`}
                  src={getOssImageUrl('SJSY/ffac6ba2752fb07ef4a07435206f090e.png')}
                />
                <Text className={`${styles['font_2']} ${styles['mt-9']}`}>触碰次数</Text>
                {showTouchTooltip && (
                  <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3d6650',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    marginTop: '8px',
                    zIndex: 100,
                    border: '1px solid #d6a207',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: '24px',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold'
                    }}>{touchCountStr}</Text>
                  </View>
                )}
              </View>
              <View className={`flex-col items-center ${styles['section_3']} ${styles['equal-division-item']}`}
                onClick={showFortuneLevel}
                onTouchStart={() => setPressedCard('fortuneLevel')}
                onTouchEnd={() => setPressedCard(null)}
                onTouchCancel={() => setPressedCard(null)}
                style={{
                  position: 'relative',
                  transform: pressedCard === 'fortuneLevel' ? 'scale(0.95)' : 'scale(1)',
                  opacity: pressedCard === 'fortuneLevel' ? 0.8 : 1,
                  transition: 'all 0.1s ease'
                }}
              >
                <Image
                  className={`${styles['image_3']}`}
                  src={getOssImageUrl('SJSY/ead67d44471a35351c08028a582d825b.png')}
                />
                <Text className={`${styles['font_2']} ${styles['mt-9']}`}>水晶等级</Text>
                {showLevelTooltip && (
                  <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3d6650',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    marginTop: '8px',
                    zIndex: 100,
                    border: '1px solid #d6a207',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: '24px',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold'
                    }}>{levelStr}</Text>
                  </View>
                )}
              </View>
            </View>
            <View className={`mt-12 flex-row justify-between items-center ${styles['section_4']}`}>
              <View className={`flex-col items-start`}>
                <Text className={`${styles['font_3']} ${styles['text_2']}`}>了解我的水晶</Text>
                <Text className={`mt-20 ${styles['font_4']} ${styles['text_4']}`}>揭开水晶的神秘面纱</Text>
              </View>
              <View className={`flex-col justify-start items-center ${styles['text-wrapper']}`}
                onClick={() => {
                  Taro.switchTab({ url: `/pages/xiangxi/xiangxi` })
                }}
              >
                <Text className={`${styles['font_3']} ${styles['text_3']}`}>去查看</Text>
              </View>
            </View>
          </View>
          <View className={`flex-col ${styles['group_2']}`}>
            <Text className={`self-start ${styles['font_5']} ${styles['text_5']}`}>我的守护兽</Text>
            <View className={`flex-col self-stretch ${styles['section_5']} ${styles['mt-5']}`}
              style={{
                backgroundImage: `url(${getOssImageUrl('SJSY/222.png')})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat'
              }}>
              <View className={`flex-row justify-between items-center`}>
                <Image
                  className={`${styles['image_4']}`}
                  src={getOssImageUrl('SJSY/1e467fc804d0fd434a82a6706adadf24.png')}
                />
                <View
                  className={`flex-col items-start ${styles['group_3']}`}>
                  <Text className={`${styles['font_5']} ${styles['text_6']}`}>迷你鹿</Text>
                  <Text className={`mt-14 ${styles['font_3']} ${styles['text_7']}`}>
                    {crystalData ? crystalData.level : '期待你长大的样子'}
                  </Text>
                </View>
              </View>
              <View className={`mt-22 ${styles['progress_container']}`}>
                {/* Total Energy Bar (Grey) */}
                <View
                  className={`${styles['section_6']}`}
                  style={{
                    width: crystalData ? `${Math.min((crystalData.total_energy / crystalData.level_info.threshold) * 100, 100)}%` : '50%'
                  }}
                >
                  {/* Current Energy Bar (Yellow) */}
                  <View
                    className={`${styles['section_7']}`}
                    style={{
                      width: crystalData && crystalData.total_energy > 0 ? `${Math.min((crystalData.current_energy / crystalData.total_energy) * 100, 100)}%` : '0%',
                      backgroundColor: '#d6a207'
                    }}
                  ></View>
                </View>

                {/* Left Text */}
                <Text className={`${styles['font_3']} ${styles['text_8']}`}>进化完成度</Text>

                {/* Right Text */}
                <View className={`flex-1 flex-row justify-end items-center`} style={{ zIndex: 3 }}>
                  <Text className={`${styles['font_2']} ${styles['text_9']}`}>
                    {crystalData ? `${crystalData.current_energy}/${crystalData.total_energy}/${crystalData.level_info.threshold}` : '666/1500/2000'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View className={`flex-col ${styles['group_4']} ${styles['mt-29']}`}>
          <View className={`flex-row justify-between items-baseline self-stretch`}>
            <Text className={`${styles['font_5']} ${styles['text_10']}`}>更多推荐</Text>
            <Text className={`${styles['font_6']} ${styles['text_11']}`} onClick={() => {
              Taro.navigateTo({ url: '/pages/AllRecommendations/index' });
            }}>全部</Text>
          </View>
          <Text className={`self-start ${styles['font_4']} ${styles['text_12']}`}>暂未开放线上调节</Text>
          <ScrollView
            scrollX
            enableFlex
            showScrollbar={false}
            className={`flex-row ${styles['equal-division']}`}
          >
            <View
              className={`flex-col items-start ${styles['equal-division-item_2']} ${styles['section_8']}`}
              onTouchStart={() => setPressedCard('card1')}
              onTouchEnd={() => setPressedCard(null)}
              onTouchCancel={() => setPressedCard(null)}
              onClick={() => {
                handleTouchCrystalClick();
              }}
              style={{
                backgroundImage: `url(${getOssImageUrl('SJSY/sjsy_bc1.png')})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                transform: pressedCard === 'card1' ? 'translateY(4px) scale(0.98)' : 'translateY(0) scale(1)',
                transition: 'all 0.1s ease',
                opacity: pressedCard === 'card1' ? 0.9 : 1
              }}>
              <Text className={`${styles['font']} ${styles['text_13']}`}>触碰水晶</Text>
              <Text className={`${styles['font_7']} ${styles['text_14']} ${styles['mt-13']}`}>
                触碰睡觉可以加速宠物的进化
              </Text>
            </View>
            <View
              className={`ml-14 flex-col items-start ${styles['equal-division-item_3']} ${styles['section_9']}`}
              onTouchStart={() => setPressedCard('card2')}
              onTouchEnd={() => setPressedCard(null)}
              onTouchCancel={() => setPressedCard(null)}
              onClick={handleEntertainmentReferenceClick}
              style={{
                backgroundImage: `url(${getOssImageUrl('SJSY/sjsy_bc2.png')})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                transform: pressedCard === 'card2' ? 'translateY(4px) scale(0.98)' : 'translateY(0) scale(1)',
                transition: 'all 0.1s ease',
                opacity: pressedCard === 'card2' ? 0.9 : 1
              }}
            >
              <Text className={`${styles['font']}`}>运势</Text>
              <Text className={`${styles['font_7']} ${styles['text_14']} ${styles['mt-13']}`}>
                运势解读
              </Text>
            </View>
            <View
              className={`ml-14 flex-col items-start ${styles['equal-division-item_2']} ${styles['section_10']}`}
              onTouchStart={() => setPressedCard('card3')}
              onTouchEnd={() => setPressedCard(null)}
              onTouchCancel={() => setPressedCard(null)}
              onClick={() => {
                if (checkCrystalActivation()) {
                  Taro.navigateTo({ url: '/pages/TanChuang/index' });
                }
              }}
              style={{
                backgroundImage: `url(${getOssImageUrl('SJSY/sjsy_bc3.png')})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                transform: pressedCard === 'card3' ? 'translateY(4px) scale(0.98)' : 'translateY(0) scale(1)',
                transition: 'all 0.1s ease',
                opacity: pressedCard === 'card3' ? 0.9 : 1
              }}
            >
              <Text className={`${styles['font']}`}>抽牌</Text>
              <Text className={`${styles['font_7']} ${styles['text_14']} ${styles['mt-11']}`}>
                塔罗牌占卜，探索内心答案
              </Text>
            </View>
            <View
              className={`ml-14 flex-col items-start ${styles['equal-division-item_2']} ${styles['section_8']}`}
              onTouchStart={() => setPressedCard('card4')}
              onTouchEnd={() => setPressedCard(null)}
              onTouchCancel={() => setPressedCard(null)}
              onClick={() => {
                if (checkCrystalActivation()) {
                  // Check podcast status
                  const token = Taro.getStorageSync("importcode");
                  if (!token) {
                    Taro.showToast({ title: '请先登录', icon: 'none' });
                    setTimeout(() => Taro.switchTab({ url: '/pages/My/index' }), 1500);
                    return;
                  }

                  Taro.showLoading({ title: '检查播客状态...' });
                  Taro.request({
                    url: getApiUrl(API_ENDPOINTS.YUNSHI_PODCAST),
                    method: 'GET',
                    header: {
                      'accept': 'application/json',
                      'X-Login-Token': token,
                      'X-CSRFTOKEN': 'fS8jFu61Kent0PmzjTSw7UpYtWCRW7Lk'
                    },
                    success: (res) => {
                      Taro.hideLoading();
                      console.log('Podcast Check Res:', res.data);
                      if (res.statusCode === 200) {
                        const { audio_url, subtitle_url, status } = res.data;

                        if (status === 'finish' && audio_url && audio_url.startsWith('https')) {
                          // Podcast ready
                          const reportDate = res.data.report_date || '';
                          let url = `/pages/Podcast/index?audio_url=${encodeURIComponent(audio_url)}&report_date=${encodeURIComponent(reportDate)}`;
                          if (subtitle_url) {
                            url += `&subtitle_url=${encodeURIComponent(subtitle_url)}`;
                          }
                          Taro.navigateTo({ url });
                        } else {
                          // Generating or not started
                          Taro.showModal({
                            title: '播客生成中',
                            content: '您的专属运势播客正在后台生成，预计需要2-3分钟，请稍后再试。',
                            showCancel: false,
                            confirmText: '我知道了',
                            confirmColor: '#D4AF37'
                          });
                        }
                      } else {
                        // Handle other statuses (e.g. 404 not found -> maybe user never generated one)
                        // Assuming if not found or error, we might guide user to generate or show empty state
                        // For now, simple error toast or navigate to empty podcast page
                        Taro.navigateTo({ url: '/pages/Podcast/index' });
                      }
                    },
                    fail: (err) => {
                      Taro.hideLoading();
                      console.error('Podcast Check Error:', err);
                      Taro.showToast({ title: '网络错误', icon: 'none' });
                    }
                  });
                }
              }}
              style={{
                backgroundImage: `url(${getOssImageUrl('SJSY/sjsy_bc1.png')})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                transform: pressedCard === 'card4' ? 'translateY(4px) scale(0.98)' : 'translateY(0) scale(1)',
                transition: 'all 0.1s ease',
                opacity: pressedCard === 'card4' ? 0.9 : 1
              }}
            >
              <Text className={`${styles['font']}`}>播客</Text>
              <Text className={`${styles['font_7']} ${styles['text_14']} ${styles['mt-11']}`}>
                运势解析播客
              </Text>
            </View>
          </ScrollView>
          <View className={`flex-row justify-between items-baseline self-stretch ${styles['group_5']}`}>
            <Text className={`${styles['font_5']}`}>里程碑</Text>
            <Text className={`${styles['font_6']} ${styles['text_15']}`}>全部</Text>
          </View>
          <View className={`flex-col self-stretch ${styles['section_11']}`}
            onClick={() => {
              if (!Taro.getStorageSync('importcode')) {
                Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
                setTimeout(() => {
                  Taro.switchTab({ url: '/pages/My/index' });
                }, 1500);
                return;
              }
              Taro.navigateTo({ url: '/pages/Pokedex/index' });
            }}
            style={{
              backgroundImage: `url(${getOssImageUrl('SJSY/9f808516bfacf14b34bcd1380c11ab36.png')})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}>
            <View className={`flex-col justify-start items-center self-start ${styles['text-wrapper_3']}`}>
              <Text className={`${styles['font_3']} ${styles['text_16']}`}>图鉴</Text>
            </View>
            <View className={`flex-row ${styles['equal-division_2']} ${styles['group_6']} ${styles['mt-17']}`}>
              <View className={`flex-col ${styles['group_7']} ${styles['group_4']}`}>
                <Image
                  className={`self-start ${styles['image_5']}`}
                  src={getOssImageUrl('SJSY/4847668f063c0997763f6e4c249ad33b.png')}
                />
                <View className={`flex-col items-start self-stretch ${styles['section_12']} ${styles['mt-3']}`}>
                  <View className={`flex-col justify-start items-center ${styles['text-wrapper_4']}`}>
                    <Text className={`${styles['font_8']} ${styles['text_17']}`}>已获得</Text>
                  </View>
                  <Text className={`${styles['font_3']} ${styles['text_18']} ${styles['mt-7']}`}>初级小鹿</Text>
                </View>
              </View>
              <View className={`flex-col ${styles['group_7']} ${styles['group_4']} ${styles['ml-1']}`}>
                <Image
                  className={`self-start ${styles['image_5']}`}
                  src={getOssImageUrl('SJSY/b91b938179b31a6bcfe934515b7ec608.png')}
                />
                <View className={`flex-col items-start self-stretch ${styles['section_12']} ${styles['mt-3']}`}>
                  <View className={`flex-col justify-start items-center ${styles['text-wrapper_4']}`}>
                    <Text className={`${styles['font_8']} ${styles['text_17']}`}>未获得</Text>
                  </View>
                  <Text className={`${styles['font_3']} ${styles['text_18']} ${styles['mt-7']}`}>中级小鹿</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

SJShouYe.defaultProps = { className: '' };
