import React, { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Image, Input, Textarea, Picker, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js'
import styles from './index.module.css'

// MBTI Choices defined in the model
const MBTI_CHOICES = [
  { value: 'ISTJ', label: 'ISTJ (物流师)' }, { value: 'ISFJ', label: 'ISFJ (守卫者)' },
  { value: 'INFJ', label: 'INFJ (提倡者)' }, { value: 'INTJ', label: 'INTJ (建筑师)' },
  { value: 'ISTP', label: 'ISTP (鉴赏家)' }, { value: 'ISFP', label: 'ISFP (探险家)' },
  { value: 'INFP', label: 'INFP (调停者)' }, { value: 'INTP', label: 'INTP (逻辑学家)' },
  { value: 'ESTP', label: 'ESTP (企业家)' }, { value: 'ESFP', label: 'ESFP (表演者)' },
  { value: 'ENFP', label: 'ENFP (竞选者)' }, { value: 'ENTP', label: 'ENTP (辩论家)' },
  { value: 'ESTJ', label: 'ESTJ (总经理)' }, { value: 'ESFJ', label: 'ESFJ (执政官)' },
  { value: 'ENFJ', label: 'ENFJ (主人公)' }, { value: 'ENTJ', label: 'ENTJ (指挥官)' },
]

// Relationship Status Choices defined in the model
const RELATIONSHIP_STATUS_CHOICES = [
  { value: 'single', label: '单身贵族' },
  { value: 'dating', label: '暧昧接触' },
  { value: 'in_love', label: '恋爱中' },
  { value: 'married', label: '已婚' },
  { value: 'complicated', label: '关系复杂' },
  { value: 'healing', label: '疗愈期' },
]

// Focus Areas for multi-select (example)
const FOCUS_AREAS = [
  { value: 'career', label: '事业发展' },
  { value: 'love', label: '情感姻缘' },
  { value: 'wealth', label: '财富运势' },
  { value: 'health', label: '身心健康' },
  { value: 'study', label: '学业考试' },
  { value: 'family', label: '家庭关系' },
]

export default function LoginGuide() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [profileId, setProfileId] = useState(null)

  const [formData, setFormData] = useState({
    birth_date: '',
    birth_time: '',
    zodiac: '',
    mbti_type: '',
    relationship_status: 'single',
    occupation: '',
    focus_areas: [],
    avatar_url: '',
    signature: '',
    story: '',
    tags: []
  })

  const router = useRouter()

  useEffect(() => {
    const options = router.params
    if (options.mode === 'edit') {
      setIsEditMode(true)
      setShowTutorial(false)
      const storedData = Taro.getStorageSync('tempEditingProfile')
      if (storedData) {
        // Parse focus_areas from object to array if needed
        let focusAreas = []
        if (storedData.focus_areas) {
           if (Array.isArray(storedData.focus_areas)) {
             focusAreas = storedData.focus_areas
           } else if (typeof storedData.focus_areas === 'object') {
             focusAreas = Object.keys(storedData.focus_areas).filter(k => storedData.focus_areas[k])
           }
        }

        // Parse tags from object to array if needed
        let tags = []
        if (storedData.tags) {
           if (Array.isArray(storedData.tags)) {
             tags = storedData.tags
           } else if (typeof storedData.tags === 'object') {
             tags = Object.keys(storedData.tags).filter(k => storedData.tags[k])
           }
        }
 
        setFormData({
          birth_date: storedData.birth_date || '',
          birth_time: storedData.birth_time || '',
          zodiac: storedData.zodiac || '',
          mbti_type: storedData.mbti_type || '',
          relationship_status: storedData.relationship_status || 'single',
          occupation: storedData.occupation || '',
          focus_areas: focusAreas,
          avatar_url: storedData.avatar_url || '',
          signature: storedData.signature || '',
          story: storedData.story || '',
          tags: tags
        })
        setProfileId(storedData.id)
      }
    }
  }, [router.params])

  // Tutorial Data
  const tutorialSlides = [
    { 
      title: '水晶幻境', 
      desc: '探索灵性能量，开启疗愈之旅。',
      image: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/login_info1.png' 
    },
    { 
      title: '每日指引', 
      desc: '结合星盘牌阵，和不同的塔罗师解读今日运势',
      image: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/login_info2.png'
    },
    { 
      title: '专属灵宠', 
      desc: '匹配独一无二的水晶灵宠，陪伴成长。',
      image: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/login_info3.png' 
    },
      { 
      title: '塔罗抽牌', 
      desc: '通过塔罗牌，了解今日的能量状态和潜在的变化。',
      image: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/login_info4.png' 
    },
    { 
      title: '能量播客', 
      desc: '结合星盘与塔罗，解读能量流动。',
      image: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/login_info5.png' 
    },
  ]

  const [currentSwiperIndex, setCurrentSwiperIndex] = useState(0)
  const [currentFormStep, setCurrentFormStep] = useState(0)
  const todayStr = new Date().toISOString().split('T')[0]

  // Form Steps Configuration
  const formSteps = [
    {
      title: '能量起源',
      desc: '探索宇宙赋予你的初始能量',
      key: 'origin',
      render: () => (
        <>
          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>📅</Text>
              <Text className={styles.label}>出生日期</Text>
            </View>
            <Picker mode='date' onChange={handleDateChange} value={formData.birth_date} end={todayStr}>
              <View className={styles.pickerValue}>
                <Text className={styles.pickerText}>{formData.birth_date || '请选择日期'}</Text>
                <Text className={styles.arrow}>▼</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>⏰</Text>
              <Text className={styles.label}>出生时间</Text>
            </View>
            <Picker mode='time' onChange={handleTimeChange} value={formData.birth_time}>
              <View className={styles.pickerValue}>
                <Text className={styles.pickerText}>{formData.birth_time || '请选择时间 (可选)'}</Text>
                <Text className={styles.arrow}>▼</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>🌌</Text>
              <Text className={styles.label}>星座/生肖</Text>
            </View>
            <Picker 
                mode='selector' 
                range={['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']} 
                onChange={(e) => handleInputChange('zodiac', ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'][e.detail.value])}
                value={['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'].indexOf(formData.zodiac)}
            >
               <View className={styles.pickerValue}>
                <Text className={styles.pickerText}>{formData.zodiac || '请选择星座'}</Text>
                <Text className={styles.arrow}>▼</Text>
               </View>
            </Picker>
          </View>
        </>
      )
    },
    {
      title: '内在共鸣',
      desc: '了解你的性格底色与情感状态',
      key: 'inner',
      render: () => (
        <>
          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>🧩</Text>
              <Text className={styles.label}>MBTI 人格类型</Text>
            </View>
            <Picker 
                mode='selector' 
                range={MBTI_CHOICES} 
                rangeKey='label'
                onChange={(e) => handleInputChange('mbti_type', MBTI_CHOICES[e.detail.value].value)}
            >
               <View className={styles.pickerValue}>
                 <Text className={styles.pickerText}>{MBTI_CHOICES.find(c => c.value === formData.mbti_type)?.label || '请选择 MBTI'}</Text>
                 <Text className={styles.arrow}>▼</Text>
               </View>
            </Picker>
          </View>

          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>💘</Text>
              <Text className={styles.label}>当前情感状态</Text>
            </View>
             <Picker 
                mode='selector' 
                range={RELATIONSHIP_STATUS_CHOICES} 
                rangeKey='label'
                onChange={(e) => handleInputChange('relationship_status', RELATIONSHIP_STATUS_CHOICES[e.detail.value].value)}
            >
               <View className={styles.pickerValue}>
                 <Text className={styles.pickerText}>{RELATIONSHIP_STATUS_CHOICES.find(c => c.value === formData.relationship_status)?.label || '请选择状态'}</Text>
                 <Text className={styles.arrow}>▼</Text>
               </View>
            </Picker>
          </View>

          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>💼</Text>
              <Text className={styles.label}>职业/身份</Text>
            </View>
            <Input
              className={styles.input}
              placeholder='例如：设计师、学生...'
              placeholderStyle='color: rgba(255, 255, 255, 0.3);'
              value={formData.occupation}
              onInput={e => handleInputChange('occupation', e.detail.value)}
            />
          </View>
        </>
      )
    },
    {
      title: '心之所向',
      desc: '你当下最关注什么？我们将为你指引方向',
      key: 'focus',
      render: () => (
        <>
          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>🎯</Text>
              <Text className={styles.label}>重点关注领域 (多选)</Text>
            </View>
            <View className={styles.radioGroup}>
              {FOCUS_AREAS.map(item => (
                <View
                  key={item.value}
                  className={`${styles.radioTag} ${formData.focus_areas.includes(item.value) ? styles.radioTagActive : ''}`}
                  onClick={() => handleFocusAreaToggle(item.value)}
                >
                  {item.label}
                </View>
              ))}
            </View>
          </View>
        </>
      )
    },
    {
      title: '独家记忆',
      desc: '写下你的心境或故事，完成水晶档案',
      key: 'story',
      render: () => (
        <>
          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>🖋️</Text>
              <Text className={styles.label}>个性签名</Text>
            </View>
            <Input
              className={styles.input}
              placeholder='一句话描述当下的心境'
              placeholderStyle='color: rgba(255, 255, 255, 0.3);'
              value={formData.signature}
              onInput={e => handleInputChange('signature', e.detail.value)}
            />
          </View>

          <View className={styles.formGroup}>
            <View className={styles.labelWrapper}>
              <Text className={styles.formIcon}>📜</Text>
              <Text className={styles.label}>自己的小故事</Text>
            </View>
            <Textarea
              className={styles.textarea}
              style={{ height: '120px', lineHeight: '1.5' }}
              placeholder='分享一段关于你的故事...'
              placeholderStyle='color: rgba(255, 255, 255, 0.3);'
              value={formData.story}
              onInput={e => handleInputChange('story', e.detail.value)}
              maxlength={500}
            />
          </View>
        </>
      )
    }
  ]

  // Helper: Calculate Zodiac from Date
  const getZodiac = (dateStr) => {
    if (!dateStr) return ''
    const [, month, day] = dateStr.split('-').map(Number)
    
    const m = month; const d = day;
    const zodiacs = [
      { name: '摩羯座', start: [12, 22], end: [1, 19] },
      { name: '水瓶座', start: [1, 20], end: [2, 18] },
      { name: '双鱼座', start: [2, 19], end: [3, 20] },
      { name: '白羊座', start: [3, 21], end: [4, 19] },
      { name: '金牛座', start: [4, 20], end: [5, 20] },
      { name: '双子座', start: [5, 21], end: [6, 21] },
      { name: '巨蟹座', start: [6, 22], end: [7, 22] },
      { name: '狮子座', start: [7, 23], end: [8, 22] },
      { name: '处女座', start: [8, 23], end: [9, 22] },
      { name: '天秤座', start: [9, 23], end: [10, 23] },
      { name: '天蝎座', start: [10, 24], end: [11, 22] },
      { name: '射手座', start: [11, 23], end: [12, 21] },
    ];
    
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return '摩羯座';
    
    for (let z of zodiacs) {
       if (z.name === '摩羯座') continue; 
       if ((m === z.start[0] && d >= z.start[1]) || (m === z.end[0] && d <= z.end[1])) {
         return z.name;
       }
    }
    return '';
  }

  // Event Handlers
  const handleDateChange = (e) => {
    const date = e.detail.value
    const today = new Date().toISOString().split('T')[0]
    if (date > today) {
      Taro.showToast({ title: '出生日期不能超过今天', icon: 'none' })
      return
    }
    const zodiac = getZodiac(date)
    setFormData(prev => ({ ...prev, birth_date: date, zodiac: zodiac }))
  }

  const handleTimeChange = (e) => {
    setFormData(prev => ({ ...prev, birth_time: e.detail.value }))
  }

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleFocusAreaToggle = (value) => {
    setFormData(prev => {
      const areas = [...prev.focus_areas]
      if (areas.includes(value)) {
        return { ...prev, focus_areas: areas.filter(v => v !== value) }
      } else {
        return { ...prev, focus_areas: [...areas, value] }
      }
    })
  }

  const handleSubmit = async () => {
    // 收集用户填的信息为 JSON 格式
    const userInfo = {
       "birth_date": formData.birth_date || '2026-01-01',
       "birth_time": formData.birth_time || '00:00', 
       "zodiac": formData.zodiac, 
       "mbti_type": formData.mbti_type, 
       "relationship_status": formData.relationship_status, 
       "occupation": formData.occupation, 
       "focus_areas": formData.focus_areas.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}), 
       "avatar_url": formData.avatar_url, 
       "signature": formData.signature, 
       "story": formData.story, 
       "tags": formData.tags.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}) 
    }
    
    console.log('Collected User Info JSON:', JSON.stringify(userInfo, null, 2))
    console.log('Form Data:', formData)
   
    try {
      const token = Taro.getStorageSync('importcode');
      if (!token) {
        console.warn('⚠️ 未找到登录凭证 importcode，尝试使用模拟提交');
      }

      Taro.showLoading({ title: isEditMode ? '更新中...' : '保存中...' });

      const url = isEditMode && profileId
        ? getApiUrl(`${API_ENDPOINTS.PROFILES}${profileId}/`)
        : getApiUrl(API_ENDPOINTS.PROFILES);
      
      const method = isEditMode && profileId ? 'PATCH' : 'POST';

      const res = await Taro.request({
        url: url,
        method: method,
        header: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Login-Token': token || '',
          'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
        },
        data: userInfo
      });

      Taro.hideLoading();
      console.log('API Response:', res);

      if (res.statusCode === 200 || res.statusCode === 201) {
        // 标记已完成引导
        Taro.setStorageSync('hasCompletedGuide', true);
        console.log('✅ 已保存 hasCompletedGuide 标记');
        
        Taro.showToast({
          title: isEditMode ? '更新成功' : '开启旅程...',
          icon: 'success',
          duration: 1500
        })
        
        // 跳转到 My 页面
        setTimeout(() => {
          console.log('准备跳转到 My 页面');
          Taro.switchTab({ url: '/pages/My/index' })
        }, 1500)
      } else {
        Taro.showToast({
          title: (isEditMode ? '更新失败: ' : '保存失败: ') + (res.data?.detail || '请重试'),
          icon: 'none',
          duration: 2000
        });
        console.error('Save profile failed:', res.data);
      }
    } catch (error) {
      Taro.hideLoading();
      console.error('Request error:', error);
      Taro.showToast({
        title: '网络请求失败',
        icon: 'none'
      });
    }
  }

  const handleCancel = () => {
    Taro.switchTab({ url: '/pages/My/index' })
  }

  // Render Tutorial
  if (showTutorial) {
    return (
      <View className={styles.container}>
        <View className={styles.cancelBtnTop} onClick={handleCancel}>
          取消
        </View>
        <Swiper 
          className={styles.tutorialSwiper} 
          indicatorDots={false} // Custom indicators below
          previousMargin='40px'
          nextMargin='40px'
          onChange={(e) => setCurrentSwiperIndex(e.detail.current)}
        >
          {tutorialSlides.map((slide, index) => (
            <SwiperItem key={index} className={styles.swiperItem}>
              <View className={`${styles.slideCard} ${currentSwiperIndex === index ? styles.activeCard : ''}`}>
                <Image 
                  src={slide.image} 
                  className={styles.slideImage} 
                  mode='aspectFit'
                />
                <View className={styles.cardContent}>
                  <Text className={styles.slideTitle}>{slide.title}</Text>
                  <Text className={styles.slideDesc}>{slide.desc}</Text>
                </View>
              </View>
            </SwiperItem>
          ))}
        </Swiper>

        {/* Custom Indicators */}
        <View className={styles.indicators}>
          {tutorialSlides.map((_, index) => (
            <View 
              key={index} 
              className={`${styles.dot} ${currentSwiperIndex === index ? styles.activeDot : ''}`}
            />
          ))}
        </View>

        {/* Fixed Start Button */}
        {currentSwiperIndex === tutorialSlides.length - 1 && (
          <View className={styles.fixedStartBtnWrapper}>
             <View className={styles.startBtn} onClick={() => setShowTutorial(false)}>
              开启旅程
            </View>
          </View>
        )}
      </View>
    )
  }

  // Navigation Handlers
  const handleNextStep = () => {
    if (currentFormStep < formSteps.length - 1) {
      setCurrentFormStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevStep = () => {
    if (currentFormStep > 0) {
      setCurrentFormStep(prev => prev - 1)
    }
  }

  // Render Form
  return (
    <View className={styles.container}>
       <View className={styles.cancelBtnTop} onClick={handleCancel}>
         取消
       </View>
       {/* Progress Bar */}
       <View className={styles.progressContainer}>
         <View 
           className={styles.progressFill} 
           style={{ width: `${((currentFormStep + 1) / formSteps.length) * 100}%` }} 
         />
       </View>
       <Text className={styles.stepCounter}>
         {currentFormStep + 1} / {formSteps.length}
       </Text>

       {/* 改用 View 替换 Swiper，避免 Textarea 在 Swiper 中闪退的问题 */}
       <View className={styles.formSwiper}>
         {(() => {
           const step = formSteps[currentFormStep];
           const index = currentFormStep;
           return (
             <View key={step.key} className={styles.swiperItem} style={{ width: '100%', height: '100%' }}>
               <View className={`${styles.slideCard} ${styles.activeCard}`}>
                 
                 {/* Step Header */}
                 <View className={styles.stepHeader}>
                   <Text className={styles.stepTitle}>{step.title}</Text>
                   <Text className={styles.stepDesc}>{step.desc}</Text>
                 </View>

                 {/* Form Content */}
                 <ScrollView className={styles.formScrollArea} scrollY>
                   {step.render()}
                 </ScrollView>

                 {/* Navigation Buttons */}
                 <View className={styles.navButtons}>
                   {index > 0 ? (
                     <View className={`${styles.navBtn} ${styles.prevBtn}`} onClick={handlePrevStep}>
                       上一步
                     </View>
                   ) : (
                     <View className={`${styles.navBtn} ${styles.nextBtnDisabled}`}>
                       {/* Placeholder for layout balance */}
                     </View>
                   )}

                   <View className={`${styles.navBtn} ${styles.nextBtn}`} onClick={handleNextStep}>
                    {index === formSteps.length - 1 ? (isEditMode ? '保存修改' : '开启水晶之旅') : '下一步'}
                  </View>
                 </View>

               </View>
             </View>
           );
         })()}
       </View>
    </View>
  )
}
