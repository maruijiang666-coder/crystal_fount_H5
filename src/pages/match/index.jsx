import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.css';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';

const MBTI_TYPES = [
  { label: 'INTJ', value: 'INTJ' },
  { label: 'INTP', value: 'INTP' },
  { label: 'ENTJ', value: 'ENTJ' },
  { label: 'ENTP', value: 'ENTP' },
  { label: 'INFJ', value: 'INFJ' },
  { label: 'INFP', value: 'INFP' },
  { label: 'ENFJ', value: 'ENFJ' },
  { label: 'ENFP', value: 'ENFP' },
  { label: 'ISTJ', value: 'ISTJ' },
  { label: 'ISFJ', value: 'ISFJ' },
  { label: 'ESTJ', value: 'ESTJ' },
  { label: 'ESFJ', value: 'ESFJ' },
  { label: 'ISTP', value: 'ISTP' },
  { label: 'ISFP', value: 'ISFP' },
  { label: 'ESTP', value: 'ESTP' },
  { label: 'ESFP', value: 'ESFP' }
];

const ZODIAC_SIGNS = [
  { label: '白羊座', value: '白羊座' },
  { label: '金牛座', value: '金牛座' },
  { label: '双子座', value: '双子座' },
  { label: '巨蟹座', value: '巨蟹座' },
  { label: '狮子座', value: '狮子座' },
  { label: '处女座', value: '处女座' },
  { label: '天秤座', value: '天秤座' },
  { label: '天蝎座', value: '天蝎座' },
  { label: '射手座', value: '射手座' },
  { label: '摩羯座', value: '摩羯座' },
  { label: '水瓶座', value: '水瓶座' },
  { label: '双鱼座', value: '双鱼座' }
];

const RELATIONSHIP_TYPES = [
  { label: '伴侣/婚姻关系', value: 'partner' },
  { label: '职场与利益关系', value: 'workplace' },
  { label: '社交与友谊关系', value: 'social' }
];

const RELATIONSHIP_TYPE_MAP = {
  partner: '伴侣/婚姻关系',
  workplace: '职场与利益关系',
  social: '社交与友谊关系'
};

export default function Match() {
  const [myMbti, setMyMbti] = useState('');
  const [myZodiac, setMyZodiac] = useState('');
  const [partnerMbti, setPartnerMbti] = useState('');
  const [partnerZodiac, setPartnerZodiac] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [generating, setGenerating] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasExistingReport, setHasExistingReport] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = Taro.getStorageSync('importcode');
      if (!token) {
        useFallbackProfile();
        return;
      }

      const res = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.PROFILES),
        method: 'GET',
        header: {
          'accept': 'application/json',
          'X-Login-Token': token,
          'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
        }
      });

      if (res.statusCode === 200 && res.data?.results?.length > 0) {
        const profile = res.data.results[0];
        setMyMbti(profile.mbti_type || '');
        setMyZodiac(profile.zodiac || '');
      } else {
        useFallbackProfile();
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      useFallbackProfile();
    }
    setProfileLoaded(true);
    fetchExistingReport();
  };

  const useFallbackProfile = () => {
    const userProfile = Taro.getStorageSync('userprofile') || {};
    setMyMbti(userProfile.mbti_type || '');
    setMyZodiac(userProfile.zodiac || '');
  };

  const fetchExistingReport = async () => {
    try {
      const token = Taro.getStorageSync('importcode');
      if (!token) return;
      const res = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.YUNSHI_MATCH_REPORT),
        method: 'GET',
        header: {
          'accept': 'application/json',
          'X-Login-Token': token
        }
      });
      if (res.statusCode === 200 && res.data) {
        console.log('[fetchExistingReport] data:', JSON.stringify(res.data));
        const data = res.data.report || res.data;
        const meta = res.data.meta || {};
        if (data.partner_mbti) setPartnerMbti(data.partner_mbti);
        if (data.partner_zodiac) setPartnerZodiac(data.partner_zodiac);
        if (data.relationship_type) setRelationshipType(data.relationship_type);
        if (meta.relationship_type && !data.relationship_type) setRelationshipType(meta.relationship_type);
        if (data.overall_score !== undefined) {
          Taro.setStorageSync('match_report_data', data);
          setHasExistingReport(true);
        }
      }
    } catch (e) {
      // 无已有报告，忽略
    }
  };

  const pollReport = async () => {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const res = await Taro.request({
          url: getApiUrl(API_ENDPOINTS.YUNSHI_MATCH_REPORT),
          method: 'GET',
          header: {
            'accept': 'application/json',
            'X-Login-Token': Taro.getStorageSync('importcode')
          }
        });
        console.log('[pollReport] response:', res.statusCode, JSON.stringify(res.data));
        const reportData = res.data?.report;
        if (res.statusCode === 200 && reportData && reportData.overall_score !== undefined) {
          Taro.setStorageSync('match_report_data', reportData);
          return;
        }
      } catch (e) {
        // 继续轮询
      }
    }
    Taro.showToast({ title: '报告生成超时，请重试', icon: 'none' });
  };

  const handleViewReport = () => {
    Taro.navigateTo({ url: '/pages/matchReport/index' });
  };

  const handleSubmit = async () => {
    if (!partnerMbti) {
      Taro.showToast({ title: '请选择对方的MBTI', icon: 'none' });
      return;
    }
    if (!partnerZodiac) {
      Taro.showToast({ title: '请选择对方的星座', icon: 'none' });
      return;
    }
    if (!relationshipType) {
      Taro.showToast({ title: '请选择双方关系', icon: 'none' });
      return;
    }

    // 检查是否已激活水晶
    const nfcId = Taro.getStorageSync('nfc_tag_id');
    if (!nfcId) {
      Taro.showModal({
        title: '提示',
        content: '您尚未激活水晶，请先去激活',
        confirmText: '去激活',
        confirmColor: '#d6a207',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/ActivateCrystal/index' });
          }
        }
      });
      return;
    }

    const loginToken = Taro.getStorageSync('importcode');
    if (!loginToken) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/My/index' });
      }, 1500);
      return;
    }

    // 防重复提交
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    Taro.showLoading({ title: '正在消耗灵力...' });

    try {
      // 消耗灵力
      const consumeRes = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.TOUCH_CRYSTAL_CONSUME_ENERGY),
        method: 'POST',
        header: {
          'accept': 'application/json',
          'X-Login-Token': loginToken,
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
        },
        data: {
          nfc_id: nfcId,
          amount: 30,
          reason: "match analysis"
        }
      });

      if (consumeRes.statusCode !== 200) {
        const rawDetail = consumeRes.data?.detail || '';
        let detail = rawDetail || '能量消耗失败，请稍后重试';
        if (detail.includes('Insufficient') || detail.includes('insufficient') || detail.includes('能量不足') || detail.includes('灵力不足')) {
          detail = '能量不足，当前灵力无法完成本次匹配分析';
        }
        throw new Error(detail);
      }

      const { current_energy } = consumeRes.data;
      Taro.setStorageSync('spirit_balance', current_energy);

      // 灵力消耗成功，关闭 loading，显示报告生成遮罩
      Taro.hideLoading();
      setGenerating(true);

      // 继续提交匹配请求
      const res = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.YUNSHI_MATCH_REPORT),
        method: 'POST',
        header: {
          'accept': 'application/json',
          'X-Login-Token': Taro.getStorageSync('importcode'),
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
        },
        data: {
          my_mbti: myMbti,
          my_zodiac: myZodiac,
          partner_mbti: partnerMbti,
          partner_zodiac: partnerZodiac,
          relationship_type: relationshipType
        }
      });

      if (res.statusCode === 200 || res.statusCode === 202) {
        // POST 成功，轮询 GET 获取报告
        await pollReport();
        setGenerating(false);
        Taro.navigateTo({ url: '/pages/matchReport/index' });
      } else {
        Taro.showToast({ title: '请求失败，请重试', icon: 'none' });
      }
    } catch (error) {
      Taro.hideLoading();
      console.error('匹配度请求失败:', error);
      Taro.showToast({ title: error.message || '网络错误，请重试', icon: 'none' });
    } finally {
      setGenerating(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <View className={`flex-col ${styles['page']}`}>
      <ScrollView scrollY className={styles['scroll-container']}>
        {/* 查看上次报告按钮 */}
        {hasExistingReport && (
          <View className={`flex-col justify-center items-center ${styles['view-report-btn']}`}
            onClick={handleViewReport}>
            <Text className={styles['view-report-text']}>查看上次报告</Text>
          </View>
        )}

        {/* 用户信息卡片 */}
        <View className={`flex-col ${styles['section']}`}>
          <Text className={styles['section-title']}>我的信息</Text>
          <View className={`flex-row ${styles['info-row']}`}>
            <View className={`flex-col items-center ${styles['info-item']}`}>
              <Text className={styles['info-label']}>MBTI</Text>
              <Text className={styles['info-value']}>{myMbti || '加载中...'}</Text>
            </View>
            <View className={`flex-col items-center ${styles['info-item']}`}>
              <Text className={styles['info-label']}>星座</Text>
              <Text className={styles['info-value']}>{myZodiac || '加载中...'}</Text>
            </View>
          </View>
        </View>

        {/* 对方 MBTI 选择 */}
        <View className={`flex-col ${styles['section']}`}>
          <Text className={styles['section-title']}>对方的 MBTI</Text>
          <Picker mode='selector' range={MBTI_TYPES} rangeKey='label'
            onChange={(e) => setPartnerMbti(MBTI_TYPES[e.detail.value].value)}>
            <View className={styles['picker-trigger']}>
              <Text className={styles['picker-text']}>{partnerMbti || '请选择对方 MBTI'}</Text>
              <Text className={styles['picker-arrow']}>▼</Text>
            </View>
          </Picker>
        </View>

        {/* 对方星座选择 */}
        <View className={`flex-col ${styles['section']}`}>
          <Text className={styles['section-title']}>对方的星座</Text>
          <Picker mode='selector' range={ZODIAC_SIGNS} rangeKey='label'
            onChange={(e) => setPartnerZodiac(ZODIAC_SIGNS[e.detail.value].value)}>
            <View className={styles['picker-trigger']}>
              <Text className={styles['picker-text']}>{partnerZodiac || '请选择对方星座'}</Text>
              <Text className={styles['picker-arrow']}>▼</Text>
            </View>
          </Picker>
        </View>

        {/* 关系选择 */}
        <View className={`flex-col ${styles['section']}`}>
          <Text className={styles['section-title']}>双方关系</Text>
          <Picker mode='selector' range={RELATIONSHIP_TYPES} rangeKey='label'
            onChange={(e) => setRelationshipType(RELATIONSHIP_TYPES[e.detail.value].value)}>
            <View className={styles['picker-trigger']}>
              <Text className={styles['picker-text']}>
                {RELATIONSHIP_TYPE_MAP[relationshipType] || '请选择双方关系'}
              </Text>
              <Text className={styles['picker-arrow']}>▼</Text>
            </View>
          </Picker>
        </View>

        {/* 提交按钮 */}
        <View
          className={`flex-col justify-center items-center ${styles['submit-btn']}`}
          onClick={handleSubmit}
          style={{ opacity: generating ? 0.6 : 1 }}
        >
          <Text className={styles['submit-text']}>
            {generating ? '分析中...' : '开始匹配分析'}
          </Text>
        </View>

        <View className={styles['powered-by-ai']}>
          本服务由人工智能提供技术支持
        </View>
      </ScrollView>

      {/* 报告生成中 遮罩层 */}
      {generating && (
        <View className={`flex-col justify-center items-center ${styles['loading-overlay']}`}>
          <View className={`flex-col items-center ${styles['loading-card']}`}>
            <View className={styles['loading-spinner']} />
            <Text className={styles['loading-title']}>报告生成中</Text>
            <Text className={styles['loading-desc']}>AI 正在为您分析匹配报告，请稍候…</Text>
          </View>
        </View>
      )}
    </View>
  );
}
