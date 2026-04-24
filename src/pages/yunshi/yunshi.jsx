import { useState, useEffect, useRef } from 'react';
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import { getOssImageUrl } from '../../utils/config.js';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import styles from './yunshi.module.css';
import ShiYeCard from '../../components/Cards/ShiYeCard/index.jsx'
import CaiFuCard from '../../components/Cards/CaiFuCard/index.jsx';
import GanQingCard from '../../components/Cards/GanQingCard/index.jsx';
import JiangKangCard from '../../components/Cards/JiangKangCard/index.jsx';
// import YueYunCard from '../../components/yunshicards/YueYunCard/index.jsx';

export default function Yunshi(props) {
  const router = Taro.useRouter();
  const [selectedDate, setSelectedDate] = useState(null);
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [screenWidth, setScreenWidth] = useState(375);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [fortuneData, setFortuneData] = useState(null); // 运势数据
  const [overallScore, setOverallScore] = useState(0); // 综合得分
  const [crystalData, setCrystalData] = useState(null); // 水晶数据
  
  const scrollTimer = useRef(null);
  const isScrolling = useRef(false);
  const isInitialized = useRef(false);
  const shouldSnap = useRef(false);

  useEffect(() => {
    // 计算综合得分
    const calculateOverallScore = (data) => {
      if (!data) return 0;
      const { career_score, finance_score, health_score, love_score } = data;
      // 确保数值有效
      const scores = [career_score, finance_score, health_score, love_score].map(s => Number(s) || 0);
      const total = scores.reduce((a, b) => a + b, 0);
      return Math.round(total / 4);
    };

    // 获取运势数据
    const fetchFortuneData = async () => {
      // 1. 优先尝试从本地缓存获取 TaLuoAnswer 数据
      const taLuoAnswer = Taro.getStorageSync('TaLuoAnswer');
      
      if (taLuoAnswer) {
        console.log('使用本地缓存的 TaLuoAnswer 数据');
        const formattedData = {
            career_score: taLuoAnswer.career_score || 0,
            finance_score: taLuoAnswer.finance_score || 0,
            health_score: taLuoAnswer.health_score || 0,
            love_score: taLuoAnswer.love_score || 0,
            lucky_number: taLuoAnswer.lucky_number || 0,
            
            career_fortune: taLuoAnswer.career_fortune || "暂无",
            finance_fortune: taLuoAnswer.finance_fortune || "暂无",
            love_fortune: taLuoAnswer.love_fortune || "暂无",
            health_fortune: taLuoAnswer.health_fortune || "暂无",
            
            ai_data: {
                spread_analysis: taLuoAnswer.overall_analysis || taLuoAnswer.spread_analysis || "暂无详细报告"
            }
        };

        setFortuneData(formattedData);
        setOverallScore(calculateOverallScore(formattedData));
        return; // 成功获取 TaLuoAnswer 后直接返回，不再请求 API
      }

      // 2. 其次尝试从本地缓存获取 fortune_report_data (原逻辑)
      const cachedDataWrapper = Taro.getStorageSync('fortune_report_data');
      const now = Date.now();
      const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2小时缓存

      // 检查缓存是否存在且未过期（2小时内）
      if (cachedDataWrapper && cachedDataWrapper.timestamp && (now - cachedDataWrapper.timestamp < CACHE_DURATION) && cachedDataWrapper.data) {
        console.log('使用本地缓存的运势数据');
        const cachedData = cachedDataWrapper.data;
        setFortuneData(cachedData);
        setOverallScore(calculateOverallScore(cachedData));
        return;
      }

      // 3. 最后尝试请求 API
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
          const data = res.data;
          setFortuneData(data);
          
          // 保存数据到本地缓存，包含时间戳
          Taro.setStorageSync('fortune_report_data', {
            timestamp: Date.now(),
            data: data
          });

          setOverallScore(calculateOverallScore(data));
        }
      } catch (error) {
        console.error('Fetch fortune data failed:', error);
      }
    };

    fetchFortuneData();

    // 获取水晶数据
    const fetchCrystalData = async () => {
      try {
        const nfcId = Taro.getStorageSync('nfc_tag_id') || 'NFC__004';
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
    fetchCrystalData();

    // 获取今天的日期
    const today = new Date().getDate();
    
    // 获取当前月份的天数
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    
    // 生成日期数组
    const dateArray = Array.from({ length: days }, (_, i) => i + 1);
    setDaysInMonth(dateArray);
    
    // 设置今天为选中日期
    setSelectedDate(today);
    console.log('今天日期:', today);

    // 获取屏幕宽度
    Taro.getSystemInfo({
      success: (res) => {
        setScreenWidth(res.windowWidth);
        
        // 计算初始滚动位置
        const rpxToPx = res.windowWidth / 750;
        const itemWidth = 80 * rpxToPx;
        const gap = 24 * rpxToPx;
        const totalItemWidth = itemWidth + gap;
        
        // 计算今天日期应该滚动到的位置
        const targetIndex = today - 1;
        const initialScroll = targetIndex * totalItemWidth;
        
        // 延迟设置滚动位置，确保视图渲染完成
        setTimeout(() => {
          setScrollLeft(initialScroll);
          isInitialized.current = true;
        }, 200);
      }
    });
  }, []);

  const handleDateSelect = (day) => {
    setSelectedDate(day);
    console.log('选中日期:', day);
  };

  const handleScroll = (e) => {
    // 如果正在吸附，不处理滚动事件
    if (shouldSnap.current) {
      return;
    }
    
    isScrolling.current = true;
    
    // 清除之前的定时器
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }

    // 设置新的定时器，在滚动停止后执行
    scrollTimer.current = setTimeout(() => {
      const currentScrollLeft = e.detail.scrollLeft;
      
      // rpx 转 px: 1px = screenWidth / 750
      const rpxToPx = screenWidth / 750;
      const itemWidth = 80 * rpxToPx; // 80px
      const gap = 24 * rpxToPx; // 24px gap
      const totalItemWidth = itemWidth + gap;
      
      // 计算中心位置相对于列表开始的偏移
      const centerOffset = currentScrollLeft + screenWidth / 2;
      
      // 减去左侧 padding (50% - 40px)
      const leftPadding = screenWidth / 2 - 40 * rpxToPx;
      const adjustedOffset = centerOffset - leftPadding;
      
      // 计算最接近中心的日期索引
      const nearestIndex = Math.max(0, Math.min(Math.round(adjustedOffset / totalItemWidth), daysInMonth.length - 1));
      const nearestDay = daysInMonth[nearestIndex];
      
      if (nearestDay) {
        // 计算该日期应该在的精确位置
        const targetScrollLeft = nearestIndex * totalItemWidth;
        
        // 设置吸附标志
        shouldSnap.current = true;
        
        // 更新 scrollLeft 状态，触发吸附
        setScrollLeft(targetScrollLeft);
        
        // 延迟重置标志
        setTimeout(() => {
          shouldSnap.current = false;
          isScrolling.current = false;
        }, 300);
        
        if (nearestDay !== selectedDate) {
          setSelectedDate(nearestDay);
          console.log('选中日期:', nearestDay);
        }
      } else {
        isScrolling.current = false;
      }
    }, 150);
  };

  useShareAppMessage(() => {
    return {
      title: '我的专属解读报告，快来看看你的吧！',
      path: '/pages/yunshi/yunshi',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    };
  });

  useShareTimeline(() => {
    return {
      title: '我的专属解读报告',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    };
  });

  return (
    <View className={`flex-col ${styles['page']} ${props.className}`}>

    {/* 不要删除  这里有时间组件，还有月运，年运 */}
      {/* <View className={`flex-row justify-center self-stretch relative ${styles['group']}`}>
        <Text className={`${styles['font']} ${styles['text']} ${styles['pos']}`}>日运</Text>
        <Text className={`${styles['font_2']} ${styles['text_2']}`}>月运</Text>
        <Text className={`${styles['font_2']} ${styles['text_2']} ${styles['text_3']} ${styles['pos_2']}`}>年运</Text>
      </View>
      <View className={`self-start ${styles['section']}`}></View>
      <View className={`self-stretch ${styles['date-scroll-container']}`}>
        
        <View className={styles['date-selector-bg']}></View>
        
        <ScrollView
          scrollX
          scrollLeft={scrollLeft}
          scrollWithAnimation
          className={styles['date-scroll']}
          onScroll={handleScroll}
        >
          <View className={`flex-row items-center ${styles['date-list']}`}>
            {daysInMonth.map((day) => (
              <View
                key={day}
                id={`date-${day}`}
                className={`flex-col justify-start items-center ${styles['date-item']}`}
                onClick={() => handleDateSelect(day)}
              >
                <Text className={`${styles['font_3']} ${day === selectedDate ? styles['text_4'] : ''}`}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View> */}


      {/* 今日运势 */}
      <View className={`flex-col self-stretch ${styles['section_2']}`}          
       style={{
            backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/b006026aece6a0992802b69125015c60.png)`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
          }}>
        <View className={`flex-row items-center ${styles['group_3']}`} >
          {/* <Text className={`${styles['font']} ${styles['text_8']}`}>66</Text> */}
          {/* <View className={`${styles['section_3']} ${styles['ml-5']}`}></View> */}
          <Text className={`${styles['font']} ${styles['text_7']} ${styles['ml-5']}`}>今日得分</Text>
        </View>
        <View className={`flex-row items-center ${styles['mt-15']}`}>
          <View className={`flex-col items-center shrink-0 relative ${styles['section_4']}`}>
            <Text className={`${styles['text_10']}`}>{overallScore || '--'}</Text>
            <Text className={`${styles['font_5']} ${styles['text_13']} ${styles['mt-11']}`}>综合得分</Text>
          </View>
          <View className={`ml-20 flex-col flex-1`}>
            <View className={`flex-row items-center`}>
              <Text className={`${styles['font_4']} ${styles['text_9']}`}>事业</Text>
              <View className={`ml-4 flex-col justify-start items-start flex-1 ${styles['section_5']}`}>
                <View className={`${styles['section_6']}`} style={{ width: `${fortuneData ? fortuneData.career_score : 0}%` }}></View>
              </View>
              <Text className={`ml-4 ${styles['font_4']}`}>{fortuneData ? fortuneData.career_score : '--'}</Text>
            </View>
            <View className={`flex-row items-center ${styles['mt-11']}`}>
              <Text className={`${styles['font_4']} ${styles['text_11']}`}>财富</Text>
              <View className={`ml-4 flex-col justify-start items-start flex-1 ${styles['section_5']}`}>
                <View className={`${styles['section_7']}`} style={{ width: `${fortuneData ? fortuneData.finance_score : 0}%` }}></View>
              </View>
              <Text className={`ml-4 ${styles['font_4']}`}>{fortuneData ? fortuneData.finance_score : '--'}</Text>
            </View>
            <View className={`flex-row items-center ${styles['mt-11']}`}>
              <Text className={`${styles['font_4']} ${styles['text_12']}`}>感情</Text>
              <View className={`ml-4 flex-col justify-start items-start flex-1 ${styles['section_5']}`}>
                <View className={`${styles['section_8']}`} style={{ width: `${fortuneData ? fortuneData.love_score : 0}%` }}></View>
              </View>
              <Text className={`ml-4 ${styles['font_4']}`}>{fortuneData ? fortuneData.love_score : '--'}</Text>
            </View>
            <View className={`flex-row items-center ${styles['mt-11']}`}>
              <Text className={`${styles['font_4']} ${styles['text_14']}`}>健康</Text>
              <View className={`ml-4 flex-col justify-start items-start flex-1 ${styles['section_5']}`}>
                <View className={`${styles['section_9']}`} style={{ width: `${fortuneData ? fortuneData.health_score : 0}%` }}></View>
              </View>
              <Text className={`ml-4 ${styles['font_4']}`}>{fortuneData ? fortuneData.health_score : '--'}</Text>
            </View>
            <View className={`flex-row items-center ${styles['mt-11']}`}>
              <Text className={`${styles['font_4']} ${styles['text_14']}`}>幸运</Text>
              <View className={`ml-4 flex-col justify-start items-start flex-1 ${styles['section_5']}`}>
                <View className={`${styles['section_lucky']}`} style={{ width: `${fortuneData ? Math.min(fortuneData.lucky_number, 100) : 0}%` }}></View>
              </View>
              <Text className={`ml-4 ${styles['font_4']}`}>{fortuneData ? fortuneData.lucky_number : '--'}</Text>
            </View>
          </View>
        </View>
      </View>
      <View className={`flex-row ${styles['equal-division']}`}>
        <View className={`flex-col items-start ${styles['section_10']} ${styles['equal-division-item']}`}
                    style={{
            backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/b006026aece6a0992802b69125015c60.png)`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <Text className={`${styles['font_3']} ${styles['text_15']}`}>
            {crystalData ? crystalData.touch_count : '9'}
          </Text>
          <Text className={`mt-8 ${styles['font_6']} ${styles['text_16']}`}>触碰次数</Text>
        </View>
        <View 
          className={`ml-12 flex-col items-start ${styles['section_10']} ${styles['equal-division-item']}`}
          style={{
            backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/b006026aece6a0992802b69125015c60.png)`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <Text className={`${styles['font_3']} ${styles['text_15']}`}
          >
            {crystalData ? crystalData.level_info.needed : '紫水晶'}
          </Text>
          <Text className={`${styles['font_6']} ${styles['text_16']} ${styles['mt-7']}`}>距离升级所需能量</Text>
        </View>
        <View className={`ml-12 flex-col items-start ${styles['section_10']} ${styles['equal-division-item']}`}
                    style={{
            backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/b006026aece6a0992802b69125015c60.png)`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <Text className={`${styles['font_3']} ${styles['text_15']}`}>
            {crystalData ? `${crystalData.current_energy}/${crystalData.total_energy}` : '25/90'}
          </Text>
          <Text className={`mt-8 ${styles['font_6']} ${styles['text_16']}`}>能量值</Text>
        </View>
      </View>

    <Text className={`self-start ${styles['yunshi-title']}`} >卡牌推理</Text>

    <View> </View>



     <ShiYeCard
        className="self-stretch"
        style={{ marginRight: '6px' }}
        content={fortuneData ? fortuneData.career_fortune : "正在获取事业解读..."}
      />

      <CaiFuCard
        className="self-stretch"
        style={{ marginRight: '6px' }}
        content={fortuneData ? fortuneData.finance_fortune : "正在获取财富解读..."}
      />
      <GanQingCard
        className="self-stretch"
        style={{ marginRight: '6px' }}
        content={fortuneData ? fortuneData.love_fortune : "正在获取感情解读..."}
      />
      <JiangKangCard
        className="self-stretch"
        style={{ marginRight: '6px' }}
        content={fortuneData ? fortuneData.health_fortune : "正在获取健康解读..."}
      />

      {/* <YueYunCard 
        title="11月运势报告"
        content="财运亨通，事业有成，感情稳定..."
        className="custom-style"
        onClick={() => console.log('卡片被点击')}
      /> */}



      <View className={`flex-col self-stretch ${styles['group_4']}`}>
        {/* <View className={`flex-col ${styles['section_11']}`}>
          <Text className={`self-start ${styles['font_7']} ${styles['text_17']}`}>健康</Text>
          <Text className={`mt-22 self-stretch ${styles['font_5']} ${styles['text_18']}`}>
            桃花窗口仍在，但“质量”比“数量”更值得评估。白羊、天秤、射手会遇到多位示好对象，却可能因自己标准模糊而错过最佳互动时机；慢下来、先观察兴趣价值观是否合拍，再决定要不要深入
          </Text>
        </View>
        <View className={`flex-col ${styles['section_12']}`}>
          <Text className={`self-start ${styles['font_7']} ${styles['text_19']}`}>财富</Text>
          <Text className={`mt-22 self-stretch ${styles['font_5']} ${styles['text_20']}`}>
            桃花窗口仍在，但“质量”比“数量”更值得评估。白羊、天秤、射手会遇到多位示好对象，却可能因自己标准模糊而错过最佳互动时机；慢下来、先观察兴趣价值观是否合拍，再决定要不要深入
          </Text>
        </View> */}
        <View className={`flex-col ${styles['section_13']}`}>
          <Text className={`self-center ${styles['font_7']} ${styles['text_21']}`}>总体解读报告</Text>
          <View className={`flex-col self-stretch ${styles['section_14']} ${styles['mt-15']}`}>
            <Text className={`self-stretch ${styles['font_5']} ${styles['text_22']}`}>
              {fortuneData ? (fortuneData.ai_data?.spread_analysis || fortuneData.ai_data?.spread_analysis || "暂无详细报告") : "正在生成您的专解读报告..."}
            </Text>
            <Button
              className={`mt-24 flex-row justify-between items-center self-center ${styles['section_15']}`}
              openType="share"
              style={{ backgroundColor: 'transparent', lineHeight: 'normal' }}
            >
              <Image
                className={`${styles['image']}`}
                src={getOssImageUrl('yunshi/8b13466b98784cfedb057839952e943e.png')}
              />
              <Text className={`${styles['font_4']} ${styles['text_23']}`}>分享</Text>
            </Button>
          </View>
        </View>
      </View>

      <View className={styles['powered-by-ai']}>
        本服务由人工智能提供技术支持
      </View>
 



    </View>
  );
}

Yunshi.defaultProps = { className: '' };
