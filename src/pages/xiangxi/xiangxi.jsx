import React, { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import { getOssImageUrl } from '../../utils/config.js';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import GLBViewer from '../../components/GLBViewer';
import styles from './xiangxi.module.css';

const MODELS = [
  {
    url: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/3Dmodule/bracelet.glb',
    useWhiteMaterial: false,
    positionOffsetX: 0.6, // 向右移动
    positionOffsetY: 0.5, // 向上移动
    positionOffsetZ: 0,
    lightIntensityMultiplier: 1.2,
    exposureMultiplier: 1.2,
    name: '水晶手串'
  },
  {
    url: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/3Dmodule/people.glb',
    useWhiteMaterial: true,
    positionOffsetX: 0,
    positionOffsetY: -1.5,
    positionOffsetZ: 0,
    lightIntensityMultiplier: 1.0,
    exposureMultiplier: 1.0,
    name: '守护者'
  },
  {
    url: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/3Dmodule/tougu.glb',
    useWhiteMaterial: false,
    positionOffsetX: 0,
    positionOffsetY: 0,
    positionOffsetZ: 0,
    lightIntensityMultiplier: 1.0,
    exposureMultiplier: 1.0,
    name: '灵动之光'
  }
];

export default function Xiangxi(props) {
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('product'); // product, type, meaning, advice
  const [crystalCount, setCrystalCount] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [crystalName, setCrystalName] = useState('紫水晶');
  const [crystalDescription, setCrystalDescription] = useState('紫水晶的心愿加上绿松石可以缓解你的焦虑');
  const [recommendedCrystal, setRecommendedCrystal] = useState('绿松石'); // Default value
  const [wearingAdvice, setWearingAdvice] = useState(''); // New state for wearing advice
  
  // New state for dynamic crystal details
  const [crystalDetails, setCrystalDetails] = useState({
    description: '',
    category: '',
    symbolic_meaning: ''
  });

  const [currentModelIndex, setCurrentModelIndex] = useState(0);

  const handlePrevModel = () => {
    setCurrentModelIndex((prev) => (prev - 1 + MODELS.length) % MODELS.length);
  };

  const handleNextModel = () => {
    setCurrentModelIndex((prev) => (prev + 1) % MODELS.length);
  };

  useEffect(() => {
    // Moved logic to useDidShow
  }, []);

  Taro.useShareAppMessage(() => {
    return {
      title: `我的守护水晶 · ${crystalName}`,
      path: '/pages/xiangxi/xiangxi',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    };
  });

  Taro.useShareTimeline(() => {
    return {
      title: `我的守护水晶 · ${crystalName}`,
      query: '',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    };
  });


  // Helper function to process fortune advice
  const processFortuneAdvice = (advice) => {
    console.log('Parsed advice string:', advice);

    if (advice) {
      // 1. Extract Recommended Crystal
      // Pattern: Look for "推荐佩戴" followed by parentheses
      const crystalRegex = /推荐佩戴\s*[（\(](.*?)[）\)]/;
      const crystalMatch = advice.match(crystalRegex);
      
      if (crystalMatch) {
        // Remove * and parentheses and trim
        const recName = crystalMatch[1].replace(/[（）()\*＊]/g, '').trim();
        console.log('Found recommended crystal:', recName);
        if (recName) {
          setRecommendedCrystal(recName);
        }
      }

      // 2. Extract Reason and Wearing Advice
      const splitKey = '适合佩戴';
      const parts = advice.split(splitKey);
      if (parts.length > 0) {
        // Remove * and parentheses from reason
        const reason = parts[0].replace(/[（）()\*＊]/g, '').trim();
        setCrystalDescription(reason);
        console.log('crystalDescription:', reason);

        if (parts.length > 1) {
          const remainder = parts[1];
          const punctuationRegex = /[，。,.]/;
          const pMatch = remainder.match(punctuationRegex);
          let locationPhrase = remainder;
          if (pMatch) {
            locationPhrase = remainder.substring(0, pMatch.index);
          }
          const adviceText = splitKey + locationPhrase;
          setWearingAdvice(adviceText);
          console.log('wearingAdvice:', adviceText);
        }
      }
    } else {
      console.log('Advice string is empty');
    }
  };

  useDidShow(() => {
    fetchCrystalCount();
    
    // Always fetch fortune report data from API to ensure fresh data
    const fetchFortuneData = async () => {
      try {
        const res = await Taro.request({
           url: getApiUrl(API_ENDPOINTS.FORTUNE_REPORT),
          method: 'GET',
          header: {
            'accept': 'application/json',
            'X-Login-Token': Taro.getStorageSync('importcode'),
            'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
          }
        });

        if (res.statusCode === 200 && res.data) {
          console.log('API fortune_report data:', res.data);
          
          // Save data to storage (optional, to keep it in sync)
          Taro.setStorageSync('fortune_report_data', {
            timestamp: Date.now(),
            data: res.data
          });

          let advice = '';
          // Handle different data structures
          if (res.data.data && res.data.data.crystal_advice) {
            advice = res.data.data.crystal_advice;
          } else if (res.data.crystal_advice) {
            advice = res.data.crystal_advice;
          }

          processFortuneAdvice(advice);

        } else {
          console.error('API fortune_report failed:', res);
          // Fallback to storage if API fails
          const req1 = Taro.getStorage({
            key: 'fortune_report_data',
            success: (res) => {
              console.log('Fallback to storage fortune_report_data:', res.data);
              let advice = '';
              if (res.data && res.data.data && res.data.data.crystal_advice) {
                advice = res.data.data.crystal_advice;
              } else if (res.data && res.data.crystal_advice) {
                advice = res.data.crystal_advice;
              }
              processFortuneAdvice(advice);
            },
            fail: () => {
              console.log('Fallback storage also empty, no fortune data available.');
            }
          });
          if (req1 && req1.catch) req1.catch(() => {});
        }
      } catch (error) {
        console.error('Fetch fortune data failed:', error);
        // Fallback to storage on error
        const req2 = Taro.getStorage({
          key: 'fortune_report_data',
          success: (res) => {
             console.log('Fallback to storage due to error:', res.data);
             let advice = '';
             if (res.data && res.data.data && res.data.data.crystal_advice) {
               advice = res.data.data.crystal_advice;
             } else if (res.data && res.data.crystal_advice) {
               advice = res.data.crystal_advice;
             }
             processFortuneAdvice(advice);
          },
          fail: () => {
            console.log('Fallback storage also empty (on error), no fortune data available.');
          }
        });
        if (req2 && req2.catch) req2.catch(() => {});
      }
    };

    fetchFortuneData();
  });

  const fetchCrystalCount = () => {
    const req = Taro.request({
       url: getApiUrl(API_ENDPOINTS.ACTIVATE_CRYSTAL_USER_TAGS),
      method: 'GET',
      header: {
        'accept': 'application/json',
        'X-Login-Token': Taro.getStorageSync("importcode"),
        'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          // Set total crystal count
          setCrystalCount(res.data.count || 0);

          // Display the first activated crystal from the list as per new logic
          if (Array.isArray(res.data.results) && res.data.results.length > 0) {
            const currentTag = res.data.results[0];

            // Set crystal name from the first result
            if (currentTag.crystal_tag && currentTag.crystal_tag.crystal_type) {
              setCrystalName(currentTag.crystal_tag.crystal_type.name);
            }

            // Extract and set crystal details from the currentTag
            if (currentTag.crystal_tag && currentTag.crystal_tag.crystal_type) {
              const { description, category, symbolic_meaning } = currentTag.crystal_tag.crystal_type;
              setCrystalDetails({
                description: description || '',
                category: category || '',
                symbolic_meaning: symbolic_meaning || ''
              });
            }

            setTouchCount(currentTag.touch_count || 0);
            // Optional: Update bindBrad or other storage if needed, assuming first one is the "active" one for now
            Taro.setStorageSync('bindBrad', currentTag);
          }
        } else {
          console.error('Failed to fetch crystal count:', res);
        }
      },
      fail: (err) => {
        console.error('API Error:', err);
      }
    });
    // H5 模式 Taro.request 返回 Promise，需 catch 避免 unhandledrejection
    if (req && req.catch) req.catch(() => {});
  };

  const handleCouponClick = () => {
    if (!Taro.getStorageSync('importcode')) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/My/index' });
      }, 1500);
    } else {
       Taro.showToast({ title: '优惠券功能开发中', icon: 'none' });
    }
  };

  return (
    <View className={`flex-col ${styles['page']} ${props.className}`}>
      <View className={`flex-col self-stretch ${styles['group']}`}>
        <View className={`flex-col self-stretch`}>
          <View className={`flex-row justify-center relative`}>
            <Text className={`self-start ${styles['font']} ${styles['text']} ${styles['pos']}`}>鉴赏</Text>
          </View>
          {/* 3D模型显示区域 */}
          <View className={`${styles['model-container']} flex-row items-center justify-between`}>
            {/* Left Button */}
            <View 
              onClick={handlePrevModel}
              className={styles['nav-btn']}
            >
              <Text className={styles['nav-icon']}>❮</Text>
            </View>

            <View className={styles['model-viewer-wrapper']}>
              <GLBViewer
                key={MODELS[currentModelIndex].url}
                modelUrl={MODELS[currentModelIndex].url}
                width="100%"
                height="100%"
                autoRotate={true}
                rotationSpeed={0.01}
                backgroundColor={null}
                useWhiteMaterial={MODELS[currentModelIndex].useWhiteMaterial}
                positionOffsetX={MODELS[currentModelIndex].positionOffsetX || 0}
                positionOffsetY={MODELS[currentModelIndex].positionOffsetY || 0}
                positionOffsetZ={MODELS[currentModelIndex].positionOffsetZ || 0}
                lightIntensityMultiplier={MODELS[currentModelIndex].lightIntensityMultiplier || 1.0}
                exposureMultiplier={MODELS[currentModelIndex].exposureMultiplier || 1.0}
                debug={false}
                onLoad={(gltf) => {
                  console.log('GLB模型加载成功:', MODELS[currentModelIndex].name, gltf);
                }}
                onError={(error) => console.error('GLB模型加载失败:', error)}
              />
            </View>

            {/* Right Button */}
            <View 
              onClick={handleNextModel}
              className={styles['nav-btn']}
            >
              <Text className={styles['nav-icon']}>❯</Text>
            </View>
          </View>
        </View>
        
        <Text className={`mt-14 self-center ${styles['font']} ${styles['text_2']}`}>{crystalName}手串</Text>
      </View>
      <View className={`mt-28 flex-col self-stretch`}>
        <Text className={`self-start ${styles['font_2']} ${styles['text_3']}`}>了解更多</Text>
        <View 
          className={`flex-col self-stretch ${styles['section']} ${styles['mt-19']}`}
          style={{backgroundImage: `url(${getOssImageUrl('xiangxi/d3e8b819ce408b2a8c598e611e0d4423.png')})`}}
        >
          <View className={`flex-col ${styles['section_2']}`}>
            <View className={`flex-row justify-around self-stretch ${styles['group_2']}`}>
              <Text 
                className={`${styles['font_3']} ${styles['text_4']} ${activeTab === 'product' ? styles['active-tab'] : ''}`}
                onClick={() => setActiveTab('product')}
                style={{cursor: 'pointer', textAlign: 'center', flex: 1}}
              >产品介绍</Text>
              <Text 
                className={`${styles['font_3']} ${styles['text_5']} ${activeTab === 'type' ? styles['active-tab'] : ''}`}
                onClick={() => setActiveTab('type')}
                style={{cursor: 'pointer', textAlign: 'center', flex: 1}}
              >类型</Text>
              <Text 
                className={`${styles['font_3']} ${styles['text_6']} ${activeTab === 'meaning' ? styles['active-tab'] : ''}`}
                onClick={() => setActiveTab('meaning')}
                style={{cursor: 'pointer', textAlign: 'center', flex: 1}}
              >象征意义</Text>
              <Text 
                className={`${styles['font_3']} ${styles['text_7']} ${activeTab === 'advice' ? styles['active-tab'] : ''}`}
                onClick={() => setActiveTab('advice')}
                style={{cursor: 'pointer', textAlign: 'center', flex: 1}}
              >佩戴建议</Text>
            </View>
            {/* <View className={`self-start ${styles['section_3']}`}></View> */}
          </View>
          <View className={`flex-col ${styles['group_3']}`}>
            {activeTab === 'product' && (
              <View className={`flex-col ${styles['tab-content']}`}>
                <Text className={`self-start ${styles['font_2']} ${styles['text_8']}`}>{crystalName}</Text>
                <View className={`flex-col self-stretch ${styles['group_4']} ${styles['mt-15']}`}>
                  <Text className={`self-stretch ${styles['font_4']} ${styles['paragraph-text']}`}>
                    {crystalDetails.description || '在古希腊，Amethyst一词源自methystos，意为“不醉”。传说它能帮助人保持清醒，因此常被镶嵌在酒杯或饰品上，寓意抵御诱惑。欧洲中世纪，紫水晶被教士用作权杖和戒指，象征纯洁与智慧。中国文化中，紫色自古就是尊贵的颜色，“紫气东来”代表祥瑞，紫水晶也因此被看作吉祥、静心之石。紫水晶不仅是一块石头，它更像是一种“提醒”：让人学会在喧嚣里保持宁静，在欲望前保持清醒。'}
                  </Text>
                </View>
              </View>
            )}
            {activeTab === 'type' && (
              <View className={`flex-col ${styles['tab-content']}`}>
                <Text className={`self-start ${styles['font_2']} ${styles['text_8']}`}>水晶类型</Text>
                <View className={`flex-col self-stretch ${styles['group_4']} ${styles['mt-15']}`}>
                  <Text className={`self-stretch ${styles['font_4']} ${styles['paragraph-text']}`}>
                    {crystalDetails.category || '紫水晶属于石英家族，是水晶的一种珍贵变种。其主要成分为二氧化硅(SiO₂)，因含有微量的铁元素而呈现紫色。按照颜色深浅可分为淡紫、中紫、深紫等等级。优质的紫水晶颜色均匀，透明度高，无明显杂质。这款手串选用的是巴西产的天然紫水晶，经过精心打磨，每一颗珠子都散发着迷人的紫色光芒。'}
                  </Text>
                </View>
              </View>
            )}
            {activeTab === 'meaning' && (
              <View className={`flex-col ${styles['tab-content']}`}>
                <Text className={`self-start ${styles['font_2']} ${styles['text_8']}`}>象征意义</Text>
                <View className={`flex-col self-stretch ${styles['group_4']} ${styles['mt-15']}`}>
                  <Text className={`self-stretch ${styles['font_4']} ${styles['paragraph-text']}`}>
                    {crystalDetails.symbolic_meaning || '紫水晶象征着高贵、神秘、智慧和灵性。在东西方文化中都被视为具有特殊能量的宝石。它代表着：<br/>• 高贵与尊贵：紫色自古就是皇室专用色彩<br/>• 精神觉醒：帮助提升灵性和直觉力<br/>• 情绪平衡：缓解压力，带来内心平静<br/>• 保护作用：抵御负面能量，形成保护屏障<br/>佩戴紫水晶不仅是装饰，更是一种精神寄托。'}
                  </Text>
                </View>
              </View>
            )}
            {activeTab === 'advice' && (
              <View className={`flex-col ${styles['tab-content']}`}>
                <Text className={`self-start ${styles['font_2']} ${styles['text_8']}`}>佩戴建议</Text>
                <View className={`flex-col self-stretch ${styles['group_4']} ${styles['mt-15']}`}>
                <Text className={`self-stretch ${styles['font_4']} ${styles['paragraph-text']}`}>
                    {crystalDescription}
                    {wearingAdvice ? `\n${wearingAdvice}` : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
      <Text className={`mt-28 self-start ${styles['font_2']} ${styles['text_15']}`}>搭配建议</Text>
      <View 
        className={`mt-28 flex-col self-stretch ${styles['section_4']}`}
        style={{backgroundImage: `url(${getOssImageUrl('xiangxi/03929a1ca928e63394985ec8a440b3b5.png')})`}}
      >
        <View className={`flex-row justify-between items-center ${styles['group_5']}`}>
          <View className={`flex-col items-start relative ${styles['section_5']}`}>
            <Image
              className={`${styles['image_3']}`}
              src={getOssImageUrl('xiangxi/eedfcd62d1b4188ab1dacfd9dabf6f02.png')}
            />
            <Text className={`${styles['font_5']} ${styles['mt-9']}`}>{crystalName}</Text>
          </View>
          <Image
            className={`${styles['image_4']}`}
            src={getOssImageUrl('xiangxi/3fce5e0b8203890a679292b8a6ddc986.png')}
          />
          <View className={`flex-col items-start ${styles['section_5']} ${styles['view']}`}>
            <Image
              className={`${styles['image_3']}`}
              src={getOssImageUrl('xiangxi/eedfcd62d1b4188ab1dacfd9dabf6f02.png')}
            />
            <Text className={`${styles['font_5']} ${styles['mt-9']}`}>{recommendedCrystal}</Text>
          </View>
        </View>
        <View className={`flex-col justify-start items-center ${styles['text-wrapper']}`}>
          <Text className={`${styles['font_4']} ${styles['text_16']}`}>{crystalDescription}</Text>
        </View>
      </View>
      <Text className={`mt-28 self-start ${styles['font_2']} ${styles['text_17']}`}>其他</Text>
      <View className={`mt-28 flex-col self-stretch ${styles['group_6']}`}>
        <View className={`flex-row items-center ${styles['waterfall']}`}>
          <View className={`flex-col justify-start ${styles['group_7']}`}>
            <View 
              className={`flex-col items-start ${styles['waterfall-item']} ${styles['section_6']}`}
              onClick={handleCouponClick}
            >
              <Text className={`${styles['font_6']} ${styles['text_19']}`}>专属祝福</Text>
              <Text className={`${styles['font_8']} ${styles['text_21']}`}>10%的折扣券</Text>
              <Text className={`${styles['font_8']} ${styles['text_22']}`}>您购买时候可</Text>
              <Text className={`${styles['font_8']} ${styles['text_23']}`}>使用</Text>
              <Image
                className={`${styles['image_6']} ${styles['pos_2']}`}
                src={getOssImageUrl('xiangxi/f642607a77003c3990565c96f583f704.png')}
              />
            </View>
          </View>
          <View className={`flex-col ${styles['group_8']} ${styles['ml-33']}`}>
            <View className={`flex-row justify-between items-center ${styles['waterfall-item_2']}`}>
              <View className={`flex-col items-start ${styles['group_9']}`}>
                {/* 上文字 */}
                <Text className={`${styles['font_6']} ${styles['text_18']}`}>触碰次数</Text>
                {/* 下文字 */}
                <View className={`flex-row items-center mt-30`}>
                  <Image
                    className={`${styles['image_5']}`}
                    style={{width: '50px', height: '50px', marginRight: '10px'}}
                    src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/xiangxi/ChuPengCiShu.png"
                    mode="aspectFit"
                  />
                  <Text className={`${styles['font_7']} ${styles['text_20']}`}>{touchCount}</Text>
                </View>
              </View>
              <View className={`flex-col items-end`}>
                <Image
                  className={`${styles['image_5']}`}
                  src={getOssImageUrl('xiangxi/6905bd2070a87082767a39d7fc1f49ed.png')}
                />
              </View>
            </View>

            
            <View className={`flex-row justify-center items-center ${styles['waterfall-item_3']} ${styles['mt-7']}`}>
              <Image
                className={`${styles['image_5']}`}
                src={getOssImageUrl('xiangxi/6905bd2070a87082767a39d7fc1f49ed.png')}
              />
              <View className={`flex-col items-start ${styles['group_10']}`}>
                <Text className={`${styles['font_6']} ${styles['text_24']}`}>水晶数量</Text>
                <View className={`flex-row items-center mt-30`}>
                  <Image
                    className={`${styles['image_5']}`}
                    style={{width: '50px', height: '50px', marginRight: '10px'}}
                    src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/xiangxi/ShuiJingQiu.png"
                    mode="aspectFit"
                  />
                  <Text className={`${styles['font_7']} ${styles['text_25']}`}>{crystalCount}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View 
          className={`flex-col ${styles['section_7']}`}
          style={{
            backgroundImage: `url(${getOssImageUrl('xiangxi/143ec245a2bae3214b1506f1f3b2c285.png')})`,
            height: 'auto',
            minHeight: '200px',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <View className={`flex-col ${styles['group_11']}`}>
            <View className={`flex-row items-center self-stretch`}>
              <Text className={`${styles['font_6']} ${styles['text_26']}`}>触碰说明</Text>
              <Image
                className={`${styles['image_7']} ${styles['ml-97']}`}
                src={getOssImageUrl('xiangxi/044bcef08aca0ee9332cd4f81b1d405e.png')}
              />
            </View>
            <Text className={`mt-4 self-start ${styles['font_8']} ${styles['text_27']}`}>
              了解NFC标签位置和使用方法
            </Text>
            {isExpanded && (
              <View style={{ marginTop: '40px', paddingRight: '20px' }}>
                <Text className={`${styles['font_8']}`} style={{ color: '#ffffff', lineHeight: '1.6' }}>
                  在“我的”页面中，点击“激活水晶”，确保您的手机NFC功能开启的情况下，用手机贴近手串从而激活水晶。
                </Text>
              </View>
            )}
          </View>
          <View className={`flex-col justify-start items-end ${styles['text-wrapper_2']}`}>
            <Text className={`${styles['font_8']} ${styles['text_28']}`}>
              {isExpanded ? '点击收起' : '点击展开'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

Xiangxi.defaultProps = { className: '' };
