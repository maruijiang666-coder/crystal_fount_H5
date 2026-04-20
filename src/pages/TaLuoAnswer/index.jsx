import React, { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image, ScrollView, Swiper, SwiperItem, MovableArea, MovableView } from '@tarojs/components';
import { getOssImageUrl } from '../../utils/config.js';
import styles from './index.module.css';
import tarotMapping from '../TaLuo/tarot_mapping.json';

// Helper to get card image URL
const getCardImageUrl = (cardName) => {
    if (!cardName) return '';
    // Find matching card in mapping (by chinese_name or simple_chinese)
    const card = tarotMapping.find(c => 
        (c.chinese_name === cardName || c.simple_chinese === cardName || c.filename?.includes(cardName)) && c.filename
    );
    
    if (card) {
        // First item in json is the base url object
        const baseUrl = tarotMapping[0].image_url;
        return `${baseUrl}${card.filename}`;
    }
    return getOssImageUrl('TaLuo/fHUYOJaOU.png'); // Fallback
};

// Placeholder Images (Using a generic one for now, or existing ones)
const MAGIC_CIRCLE_IMG = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/TaLuo/1e734912a97ed8f162bfe0b3fe1f74f7.png';
const TABLE_MAT_IMG = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/TaLuo/1fbe7aae011497762f48152d2c0a558f.png';

const READERS = [
     { 
         id: 0, 
         name: "林清玄 (Lin Qingxuan)", 
         title: "Eastern Mystic",
         gender: "Male",
         nationality: "🇨🇳", // China
         description: "国学底蕴、温润如玉、直指人心", 
         story: "出身中医世家，后赴美攻读心理学博士。他将东方易经智慧与西方荣格心理学完美融合，擅长用最东方的温润语言，拆解你潜意识里的西方逻辑困局。",
         stats: { intuition: 92, logic: 85, empathy: 88 },
         statsTop: '12%', // Adjust position based on image
         sound: getOssImageUrl('TaLuo/lqq.mp3'),
         image: getOssImageUrl('TaLuo/lqq.png') 
     },
     { 
         id: 1, 
         name: "Elena Petrovna", 
         title: "Soul Alchemist",
         gender: "Female",
         nationality: "🇷🇺", // Russia
         description: "直觉锐利、一针见血、灵魂摆渡", 
         story: "圣彼得堡国立大学哲学系毕业，家族传承的灵媒天赋。她的目光能穿透谎言的迷雾，用近乎冷酷的慈悲，带你直面内心最深处的恐惧与渴望。",
         stats: { intuition: 98, logic: 40, empathy: 60 },
         statsTop: '10%',
         sound: getOssImageUrl('TaLuo/els.mp3'),
         image: getOssImageUrl('TaLuo/els.png') 
     },
     { 
         id: 2, 
         name: "Dr. Marcus Thorne", 
         title: "Quantum Logician",
         gender: "Male",
         nationality: "🇺🇸", // USA
         description: "严谨、客观、概率论大神", 
         story: "剑桥大学天体物理学教授，业余神秘学家。他将塔罗视为宇宙的高维算法，不谈玄虚，只用严密的逻辑和概率模型，为你计算命运的最优解。",
         stats: { intuition: 45, logic: 99, empathy: 30 },
         statsTop: '10%',
         sound: getOssImageUrl('TaLuo/yg.mp3'),
         image: getOssImageUrl('TaLuo/yg.png') 
     },
     { 
         id: 3, 
         name: "Sarah Jenkins", 
         title: "Heart Healer",
         gender: "Female",
         nationality: "🇬🇧", // UK
         description: "像妈妈一样温暖、包容、治愈", 
         story: "拥有20年临床经验的家庭治疗师。她经历过生活的破碎与重建，因此更懂得倾听。在她面前，你不需要伪装坚强，所有的眼泪都会被温柔接住。",
         stats: { intuition: 85, logic: 50, empathy: 100 },
         statsTop: '10%',
         sound: getOssImageUrl('TaLuo/mg.mp3'),
         image: getOssImageUrl('TaLuo/mg.png') 
     },
     { 
         id: 4, 
         name: "Akihiro Tanaka (田中昭宏)", 
         title: "Zen Strategist",
         gender: "Male",
         nationality: "🇯🇵", // Japan
         description: "极简、克制、断舍离大师", 
         story: "曾是东京顶尖投行高管，后隐居京都枯山水庭院。他擅长用禅宗的“空”之智慧，帮你斩断繁杂的思绪乱麻，在混乱中找到唯一的破局点。",
         stats: { intuition: 75, logic: 80, empathy: 50 },
         statsTop: '10%',
         sound: getOssImageUrl('TaLuo/rb.mp3'),
         image: getOssImageUrl('TaLuo/rb.png') 
     },
     { 
         id: 5, 
         name: "Isabella Ricci", 
         title: "Artistic Visionary",
         gender: "Female",
         nationality: "🇮🇹", // Italy
         description: "浪漫、感性、美学疗愈", 
         story: "佛罗伦萨美术学院油画系毕业。她相信美是最高的真理，能从你抽出的牌面色彩与构图中，解读出你灵魂的独特色调，为你绘制心灵的风景画。",
         stats: { intuition: 90, logic: 30, empathy: 95 },
         statsTop: '12%',
         sound: getOssImageUrl('TaLuo/xly.mp3'),
         image: getOssImageUrl('TaLuo/xly.png') 
     }
];

const TEMPLATES = [
     { type: "hybrid", name: "混合模式", description: "综合" },
     { type: "mbti", name: "MBTI", description: "性格" },
     { type: "career", name: "事业", description: "职业" },
     { type: "love", name: "情感", description: "恋爱" },
     { type: "zodiac", name: "星座", description: "占星" }
];

const getUserData = () => {
    const loginData = Taro.getStorageSync('loginData') || {};
    const userProfile = Taro.getStorageSync('userprofile') || {};
    
    // Extract nickname from loginData (compatible with multiple structures)
    const nickname = loginData.user?.nickname || loginData.data?.nickname || "水晶用户";
    
    return {
        name: nickname,
        birth_date: userProfile.birth_date || "1996-11-19",
        zodiac: userProfile.zodiac || "天蝎",
        mbti: userProfile.mbti_type || "ENTJ",
        relationship_status: userProfile.relationship_status || "in_love",
        occupation: userProfile.occupation || "企业家",
        signature: userProfile.signature || "我是一个超人",
        story: userProfile.story || "我终将成为我自己"
    };
};

// Spread Configuration
const SPREAD_CONFIG = {
    decision: {
        name: '三选一牌阵',
        positions: ['Option 1', 'Option 2', 'Option 3'],
        styleClass: 'spreadDecision'
    },
    holy_triangle: {
        name: '圣三角牌阵',
        positions: ['Past', 'Present', 'Future'],
        styleClass: 'spreadHolyTriangle'
    },
    issue_focus: {
        name: '三牌问题导向阵',
        positions: ['Situation', 'Challenge', 'Advice'],
        styleClass: 'spreadIssueFocus'
    }
};

const CHANTS = [
    "连接宇宙意识...",
    "星辰轨迹正在显现...",
    "聆听灵魂深处的回响...",
    "古老的智慧正在苏醒...",
    "命运的迷雾逐渐散去..."
];

const normalizeCardLabel = (card) => {
  if (!card) return 'Unknown';
  if (typeof card === 'string') {
    return card && card.trim() ? card : 'Unknown';
  }
  return card.simple_chinese || card.chinese_name || card.filename?.replace(/\.[^.]+$/, '') || 'Unknown';
};

const normalizeReadingCards = (cards = []) => {
  return cards.map((card) => normalizeCardLabel(card));
};

const FORTUNE_TASK_ID_STORAGE_KEY = 'TaLuoAnswer_fortune_task_id';
const FORTUNE_REPORT_STORAGE_KEY = 'TaLuoAnswer';
const FORTUNE_POLL_INTERVAL_MS = 3000;
const FORTUNE_POLL_MAX_ATTEMPTS = 60;

const normalizeTaskStatus = (status) => {
  if (!status) return '';
  return String(status).trim().toUpperCase();
};

const extractFortuneReport = (payload) => {
  if (!payload || typeof payload !== 'object') return null;

  if (payload.report && typeof payload.report === 'object') {
    return payload.report;
  }

  if (payload.result && typeof payload.result === 'object') {
    return payload.result;
  }

  if (payload.data && typeof payload.data === 'object') {
    const nested = extractFortuneReport(payload.data);
    if (nested) return nested;
  }

  const reportLikeKeys = [
    'spread_analysis',
    'career_score',
    'career_fortune',
    'love_score',
    'love_fortune',
    'finance_score',
    'finance_fortune',
    'lucky_color',
    'lucky_number',
    'crystal_advice'
  ];

  if (reportLikeKeys.some((key) => Object.prototype.hasOwnProperty.call(payload, key))) {
    return payload;
  }

  return null;
};

const normalizeRequestPayload = (response) => {
  if (!response) return {};
  if (response.data && typeof response.data === 'object') {
    return response.data;
  }
  if (response.data && typeof response.data === 'string') {
    try {
      return JSON.parse(response.data);
    } catch (e) {
      return { raw: response.data };
    }
  }
  if (typeof response === 'object') {
    return response;
  }
  return {};
};

const pickFortuneReportObject = (payload, depth = 0) => {
  if (!payload || typeof payload !== 'object' || depth > 6) return null;

  const nestedCandidates = [payload.result, payload.data, payload.report].filter(
    (candidate) => candidate && typeof candidate === 'object'
  );

  for (const candidate of nestedCandidates) {
    const nested = pickFortuneReportObject(candidate, depth + 1);
    if (nested) return nested;
  }

  const reportLikeKeys = [
    'direct_answer',
    'spread_analysis',
    'career_score',
    'career_fortune',
    'love_score',
    'love_fortune',
    'finance_score',
    'finance_fortune',
    'lucky_color',
    'lucky_number',
    'crystal_advice'
  ];

  if (reportLikeKeys.some((key) => Object.prototype.hasOwnProperty.call(payload, key))) {
    return payload;
  }

  return null;
};

const getReportAnalysisText = (reportData) => {
  if (!reportData || typeof reportData !== 'object') return '';

  const analysis = reportData.spread_analysis;
  if (typeof analysis === 'string' && analysis.trim()) {
    return analysis;
  }
  if (Array.isArray(analysis)) {
    const joined = analysis.filter(Boolean).join('\n');
    if (joined.trim()) return joined;
  }

  const directAnswer = reportData.direct_answer;
  if (typeof directAnswer === 'string' && directAnswer.trim()) {
    return directAnswer;
  }
  if (Array.isArray(directAnswer)) {
    const joined = directAnswer.filter(Boolean).join('\n');
    if (joined.trim()) return joined;
  }

  const nestedReport = reportData.report;
  if (nestedReport && nestedReport !== reportData) {
    const nested = getReportAnalysisText(nestedReport);
    if (nested) return nested;
  }

  const result = reportData.result;
  if (result && result !== reportData) {
    const nested = getReportAnalysisText(result);
    if (nested) return nested;
  }

  return '';
};

const getFortuneSectionText = (reportData, key) => {
  if (!reportData || typeof reportData !== 'object') return '';

  const value = reportData[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join('\n');
    if (joined.trim()) return joined;
  }

  const nestedReport = reportData.report;
  if (nestedReport && nestedReport !== reportData) {
    const nested = getFortuneSectionText(nestedReport, key);
    if (nested) return nested;
  }

  const result = reportData.result;
  if (result && result !== reportData) {
    const nested = getFortuneSectionText(result, key);
    if (nested) return nested;
  }

  return '';
};

const getFortuneScoreText = (reportData, key) => {
  if (!reportData || typeof reportData !== 'object') return '--';

  const value = reportData[key];
  if (value === 0) return '0';
  if (typeof value === 'number' || typeof value === 'string') return String(value);

  const nestedReport = reportData.report;
  if (nestedReport && nestedReport !== reportData) {
    const nested = getFortuneScoreText(nestedReport, key);
    if (nested !== '--') return nested;
  }

  const result = reportData.result;
  if (result && result !== reportData) {
    const nested = getFortuneScoreText(result, key);
    if (nested !== '--') return nested;
  }

  return '--';
};

export default function TaLuoAnswer(props) {
  const router = Taro.useRouter();
  const skipPlacement = router.params.skipPlacement === '1' || router.params.skipPlacement === 'true';
  const [readingData, setReadingData] = useState(null);
  const [step, setStep] = useState(skipPlacement ? 'selecting' : 'preview'); // preview -> selecting -> loading -> result
  const [selectedReaderId, setSelectedReaderId] = useState(0);
  const [currentReaderIndex, setCurrentReaderIndex] = useState(0); // For Swiper
  const [selectedTemplateType, setSelectedTemplateType] = useState('hybrid');
  const [report, setReport] = useState(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [energyAnimation, setEnergyAnimation] = useState(null);
  
  // Game State for Preview/Placement
  const [cardsState, setCardsState] = useState([]); // [{id, x, y, rotation, isPlaced, slotIndex}]
  const [slotLayouts, setSlotLayouts] = useState({}); // { slotIndex: { left, right, top, bottom } }
  const [activeCardId, setActiveCardId] = useState(null);
  const activeCardIdRef = useRef(null); // Ref to track active card ID synchronously
  const [isDragActive, setIsDragActive] = useState(false);

  // Audio Context Ref
  const audioContext = useRef(null);

  // Loading Animation State
  const [chantIndex, setChantIndex] = useState(0);
  const pollTimerRef = useRef(null);
  const pollAttemptRef = useRef(0);
  const activeTaskIdRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // Try to get data from storage first
    const storedData = Taro.getStorageSync('last_tarot_reading');
    if (storedData) {
        setReadingData({
            ...storedData,
            cards: normalizeReadingCards(storedData.cards),
        });
    } else {
        // Fallback / Dev Mode
        const question = decodeURIComponent(router.params.question || '');
        setReadingData({
            question: question,
            spread_type: 'holy_triangle', // Default fallback
            cards: ['愚人', '圣杯3', '宝剑10']
        });
    }

    // Initialize Audio Context
    const context = Taro.createInnerAudioContext();
    context.obeyMuteSwitch = false;
    
    context.onPlay(() => {
        console.log('Audio started playing');
    });
    
    context.onError((res) => {
        console.error('Audio play error:', res.errMsg, res.errCode);
    });

    audioContext.current = context;

    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (audioContext.current) {
        audioContext.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (skipPlacement) {
      setStep('selecting');
    }
  }, [skipPlacement]);

  // Chanting Animation Effect
  useEffect(() => {
      let interval;
      if (step === 'loading') {
          interval = setInterval(() => {
              setChantIndex(prev => (prev + 1) % CHANTS.length);
          }, 2500); // Change text every 2.5s
      }
      return () => clearInterval(interval);
  }, [step]);

  // Auto-play sound when entering selection screen
  useEffect(() => {
    if (step === 'selecting') {
      const reader = READERS[currentReaderIndex];
          console.log('Entering selection, playing sound for:', reader.name);
          if (reader && reader.sound && audioContext.current) {
              const ctx = audioContext.current;
              ctx.stop();
              setTimeout(() => {
                  ctx.src = reader.sound;
                  ctx.play();
              }, 500); // Delay to ensure transition completes
          }
      } else {
          // Stop sound when leaving selection (e.g. going to loading)
          if (audioContext.current) {
              audioContext.current.stop();
          }
      }
  }, [step]);

  useEffect(() => {
    const cachedTaskId = Taro.getStorageSync(FORTUNE_TASK_ID_STORAGE_KEY);

    if (cachedTaskId) {
      activeTaskIdRef.current = cachedTaskId;
      setStep('loading');
      pollFortuneTask(cachedTaskId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure slots for Game Mode and Calculate Deck Position
  useEffect(() => {
      if (step === 'preview') {
          // Calculate Random Positions for Cards
          const sys = Taro.getSystemInfoSync();
          const rpxRatio = sys.windowWidth / 750;
          const cardW = 120 * rpxRatio;
          const cardH = 180 * rpxRatio;
          
          // Define a "Safe Zone" for scattering (Bottom 40% of screen)
          const safeTop = sys.windowHeight * 0.6;
          const safeBottom = sys.windowHeight - cardH - 20; // Margin from bottom
          const safeLeft = 20;
          const safeRight = sys.windowWidth - cardW - 20;

          // Initialize Cards State
          const cards = readingData?.cards || ['愚人', '圣杯3', '宝剑10'];
          const newCardsState = cards.map((_, index) => {
              // Random Position
              const randX = Math.random() * (safeRight - safeLeft) + safeLeft;
              const randY = Math.random() * (safeBottom - safeTop) + safeTop;
              // Random Rotation (-15 to 15 deg)
              const randRot = (Math.random() - 0.5) * 30;

              return {
                  id: index,
                  x: randX,
                  y: randY,
                  initialX: randX,
                  initialY: randY,
                  rotation: randRot,
                  isPlaced: false,
                  slotIndex: null
              };
          });
          
          setCardsState(newCardsState);

          setTimeout(() => {
              const query = Taro.createSelectorQuery();
              query.selectAll('.slot-target').boundingClientRect();
              query.exec((res) => {
                  if (res[0]) {
                      const layouts = {};
                      res[0].forEach((rect) => {
                          let idx = rect.dataset?.index;
                          // Fallback to ID if dataset is missing
                          if (idx === undefined && rect.id && rect.id.startsWith('slot-')) {
                              idx = rect.id.split('-')[1];
                          }
                          if (idx !== undefined) {
                              layouts[idx] = rect;
                          }
                      });
                      console.log('Slot Layouts:', layouts);
                      setSlotLayouts(layouts);
                  }
              });
          }, 800); // Wait for transition and render
      }
  }, [step]);

  const lastDragPos = useRef({}); // Map { id: {x, y} }

  const clearFortuneTaskCache = () => {
      activeTaskIdRef.current = null;
      pollAttemptRef.current = 0;
      Taro.removeStorageSync(FORTUNE_TASK_ID_STORAGE_KEY);
  };

  const scheduleFortuneTaskPoll = (taskId) => {
      if (!isMountedRef.current) return;

      if (pollTimerRef.current) {
          clearTimeout(pollTimerRef.current);
      }

      pollTimerRef.current = setTimeout(() => {
          pollFortuneTask(taskId);
      }, FORTUNE_POLL_INTERVAL_MS);
  };

  const pollFortuneTask = async (taskId) => {
      if (!taskId || !isMountedRef.current) return;

      activeTaskIdRef.current = taskId;

      if (pollAttemptRef.current >= FORTUNE_POLL_MAX_ATTEMPTS) {
          clearFortuneTaskCache();
          Taro.showToast({ title: '报告生成超时，请重试', icon: 'none' });
          if (isMountedRef.current) {
              setStep('selecting');
          }
          return;
      }

      pollAttemptRef.current += 1;

      try {
          const res = await Taro.request({
              url: `https://crystal.quant-speed.com/api/yunshi/fortune/tasks/${taskId}/`,
              method: 'GET',
              header: {
                  'accept': 'application/json',
                  'X-Login-Token': Taro.getStorageSync("importcode"),
                  'Content-Type': 'application/json',
                  'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
              }
          });

          if (!isMountedRef.current) return;

          const data = normalizeRequestPayload(res);
          const statusCode = typeof res?.statusCode === 'number' ? res.statusCode : (data.status ? 200 : 0);

          if (!data || (statusCode && statusCode >= 400)) {
              scheduleFortuneTaskPoll(taskId);
              return;
          }

          const status = normalizeTaskStatus(data.status);

          if (status === 'PENDING' || status === 'STARTED' || status === 'RUNNING' || status === 'PROCESSING' || status === 'RETRY') {
              scheduleFortuneTaskPoll(taskId);
              return;
          }

          if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'FINISHED' || status === 'DONE') {
          const finalReport = pickFortuneReportObject(data);

          if (finalReport) {
              setReport(finalReport);
              setStep('result');
              Taro.setStorageSync(FORTUNE_REPORT_STORAGE_KEY, finalReport);
              clearFortuneTaskCache();
              return;
          }

              scheduleFortuneTaskPoll(taskId);
              return;
          }

          if (status === 'FAILURE' || status === 'FAILED' || status === 'ERROR') {
              clearFortuneTaskCache();
              Taro.showToast({ title: data.detail || '报告生成失败', icon: 'none' });
              setStep('selecting');
              return;
          }

          const finalReport = pickFortuneReportObject(data);
          if (finalReport) {
              setReport(finalReport);
              setStep('result');
              Taro.setStorageSync(FORTUNE_REPORT_STORAGE_KEY, finalReport);
              clearFortuneTaskCache();
              return;
          }

          scheduleFortuneTaskPoll(taskId);
      } catch (err) {
          console.error('Poll fortune task failed:', err);
          if (!isMountedRef.current) return;
          scheduleFortuneTaskPoll(taskId);
      }
  };

  const handleDragChange = (e) => {
      // e.detail.x and y are absolute coordinates within MovableArea
      
      // Try to get ID from dataset first (most robust)
      let id = e.currentTarget.dataset.id;
      // Fallback to ref if dataset is missing or undefined (e.g. some environments)
      if (id === undefined && activeCardIdRef.current !== null) {
          id = activeCardIdRef.current;
      }
      
      // Ensure ID is a number if that's how we store it
      if (id !== undefined) {
          id = parseInt(id, 10);
          lastDragPos.current[id] = { x: e.detail.x, y: e.detail.y };
          // console.log('Drag Move:', id, e.detail.x, e.detail.y);
      }
  };
  
  const handleTouchStart = (id) => {
      console.log('Touch Start:', id);
      setActiveCardId(id);
      activeCardIdRef.current = id;
      setIsDragActive(true);
  };

  const handleDragEnd = (e) => {
      // Get ID from ref (synced in TouchStart)
      // Or try to recover from event if possible (rarely works in TouchEnd for Taro)
      let currentId = activeCardIdRef.current;
      
      console.log('Drag End. Active ID:', currentId);

      if (currentId === null) {
          // Try to recover from dataset if event has it (unlikely for touchEnd)
           if (e.currentTarget && e.currentTarget.dataset.id !== undefined) {
               currentId = parseInt(e.currentTarget.dataset.id, 10);
           }
      }

      if (currentId === null) {
          console.warn('Drag End failed: No active card ID found.');
          return;
      }
      
      const currentPos = lastDragPos.current[currentId];
      if (!currentPos) {
           console.warn('Drag End failed: No position data for ID:', currentId);
           setIsDragActive(false);
           setActiveCardId(null);
           activeCardIdRef.current = null;
           return;
      }

      const { x, y } = currentPos;
      const sys = Taro.getSystemInfoSync();
      const rpxRatio = sys.windowWidth / 750;
      const cardW = 120 * rpxRatio;
      const cardH = 180 * rpxRatio;

      // Calculate Center of the dragged card
      const cardCenterX = x + (cardW / 2); 
      const cardCenterY = y + (cardH / 2);
      
      console.log('Drop Check:', cardCenterX, cardCenterY);

      let matchedSlot = null;
      let matchedRect = null;
      let minDistance = Number.MAX_VALUE;
      const SNAP_THRESHOLD = 150; // Increased threshold for easier dropping

      Object.keys(slotLayouts).forEach(key => {
          const rect = slotLayouts[key];
          if (!rect) return;
          
          const slotCenterX = rect.left + rect.width / 2;
          const slotCenterY = rect.top + rect.height / 2;
          
          const dist = Math.sqrt(
              Math.pow(cardCenterX - slotCenterX, 2) + 
              Math.pow(cardCenterY - slotCenterY, 2)
          );

          if (dist < SNAP_THRESHOLD && dist < minDistance) {
              minDistance = dist;
              matchedSlot = key;
              matchedRect = rect;
          }
      });
      
      console.log('Matched Slot:', matchedSlot);

      // Check if slot is already occupied by ANOTHER card
      // Note: use loose comparison for slotIndex vs matchedSlot (string vs string/number)
      const isSlotOccupied = cardsState.some(c => c.isPlaced && c.slotIndex == matchedSlot && c.id !== currentId);
      
      // STRICT CHECK: The card ID must match the slot index (0->0, 1->1, 2->2)
      const isCorrectSlot = matchedSlot !== null && parseInt(matchedSlot) === currentId;

      if (matchedSlot !== null && !isSlotOccupied && isCorrectSlot) {
          // Snap to slot
          Taro.vibrateShort({ type: 'light' });
          console.log('Snapping to slot:', matchedSlot);
          
          // Calculate centered position in slot
          const snapX = matchedRect.left + (matchedRect.width - cardW) / 2;
          const snapY = matchedRect.top + (matchedRect.height - cardH) / 2;

          setCardsState(prev => prev.map(c => {
              if (c.id === currentId) {
                  return { 
                      ...c, 
                      x: snapX, 
                      y: snapY, 
                      rotation: 0, // Straighten up
                      isPlaced: true, 
                      slotIndex: matchedSlot 
                  };
              }
              return c;
          }));
      } else {
          console.log('Drop failed or occupied. Returning to start.');
          setCardsState(prev => prev.map(c => {
              if (c.id === currentId) {
                  return { 
                      ...c, 
                      x: c.initialX, 
                      y: c.initialY,
                      isPlaced: false,
                      slotIndex: null
                  };
              }
              return c;
          }));
      }
      
      setIsDragActive(false);
      setActiveCardId(null);
      activeCardIdRef.current = null;
  };


  const handleToSelection = () => {
      setStep('selecting');
  };

  const handleStart = async () => {
    setStep('loading');
    setReport(null);
    Taro.removeStorageSync(FORTUNE_REPORT_STORAGE_KEY);
    
    // Construct Request Body
    const requestBody = {
        ...getUserData(),
        focus_area: "事业", // Default
        user_question: readingData?.question || "我的运势如何？",
        spread_type: readingData?.spread_type || 'holy_triangle',
        cards: normalizeReadingCards(readingData?.cards || []),
        prompt_id: selectedReaderId,
        template_type: selectedTemplateType,
        temperature: 1
    };


    
    // Adjust focus area based on template
    if (selectedTemplateType === 'career') requestBody.focus_area = '事业';
    if (selectedTemplateType === 'love') requestBody.focus_area = '情感';

    if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
    }
    pollAttemptRef.current = 0;

    try {
        const res = await Taro.request({
            url: 'https://crystal.quant-speed.com/api/yunshi/fortune/report/?async=1',
            method: 'POST',
            header: {
                'accept': 'application/json',
                'X-Login-Token': Taro.getStorageSync("importcode"),
                'Content-Type': 'application/json',
                'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
            },
            data: requestBody
        });

        const data = normalizeRequestPayload(res);
        const statusCode = typeof res?.statusCode === 'number' ? res.statusCode : (data.status ? 200 : 0);
        const taskId = data.task_id;
        const immediateReport = pickFortuneReportObject(data);

        if (!data || (!taskId && !immediateReport && !data.status) || (statusCode && statusCode >= 400)) {
            console.error('API Error:', res);
            Taro.showToast({ title: 'AI 连接失败，请重试', icon: 'none' });
            setStep('selecting');
            return;
        }

        if (taskId) {
            Taro.setStorageSync(FORTUNE_TASK_ID_STORAGE_KEY, taskId);
        }

        if (immediateReport) {
            setReport(immediateReport);
            setStep('result');
            Taro.setStorageSync(FORTUNE_REPORT_STORAGE_KEY, immediateReport);
            if (taskId) {
                clearFortuneTaskCache();
            }
            return;
        }

        if (taskId) {
            activeTaskIdRef.current = taskId;
            pollFortuneTask(taskId);
            return;
        }

        console.error('API Error:', res);
        Taro.showToast({ title: '任务创建失败，请重试', icon: 'none' });
        setStep('selecting');
    } catch (err) {
        console.error('Network Error:', err);
        Taro.showToast({ title: '网络错误', icon: 'none' });
        setStep('selecting');
    }
  };

  const handleGeneratePodcast = () => {
      if (isGeneratingPodcast) return;
      setShowConfirmModal(true);
  };

  const confirmGeneratePodcast = () => {
      setShowConfirmModal(false);
      setIsGeneratingPodcast(true);
      // Taro.showLoading({ title: '能量消耗中...' });

      const token = Taro.getStorageSync('login_token');
      const headers = {
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'vctw4WGifjcia4ps5NBpwB0OlErGBsoG7hj0ZsyavggQt2QA05BVtqEvMvnZ41y4'
      };
      if (token) {
          headers['X-Login-Token'] = token;
      } else {
          headers['X-API-Key'] = '123quant-speed';
      }

      // 1. Consume Energy
      Taro.request({
          url: 'https://crystal.quant-speed.com/api/touch_crystal/consume_energy/',
          method: 'POST',
          header: headers,
          data: {
              nfc_id: Taro.getStorageSync('nfc_tag_id') || "NFC_003", // 优先读取缓存的nfc_tag_id，没有则用默认值
              amount: 20,
              reason: "tarot podcasting"
          },
          success: (res) => {
              if (res.statusCode === 200) {
                  // Trigger Animation
                  setEnergyAnimation('-20');
                  setTimeout(() => setEnergyAnimation(null), 2000);

                  Taro.showLoading({ title: '生成播客中...' });
                  // 2. Generate Podcast
                  setTimeout(() => {
                      Taro.request({
                          url: 'https://crystal.quant-speed.com/api/yunshi/fortune/podcast/',
                          method: 'GET',
                          header: headers,
                          success: (podcastRes) => {
                              if (podcastRes.statusCode === 200) {
                                  Taro.hideLoading();
                                  console.log('Podcast API Response:', podcastRes.data);
                                  const { audio_url, subtitle_url, report_date, status } = podcastRes.data;

                                  if (status === 'generating' || status === 'finish') {
                                      Taro.setStorageSync('showPodcastToast', true);
                                      Taro.switchTab({ url: '/pages/SJShouYe/SJShouYe' });
                                  } else {
                                      let url = '/pages/Podcast/index';
                                      const params = [];
                                      if (audio_url) params.push(`audio_url=${encodeURIComponent(audio_url)}`);
                                      if (subtitle_url) params.push(`subtitle_url=${encodeURIComponent(subtitle_url)}`);
                                      if (report_date) params.push(`report_date=${encodeURIComponent(report_date)}`);
                                      
                                      if (params.length > 0) {
                                          url += `?${params.join('&')}`;
                                      }
                                      Taro.navigateTo({ url });
                                  }
                              } else {
                                  console.error('Podcast Gen Error:', podcastRes);
                                  Taro.hideLoading();
                                  Taro.showToast({ title: '播客生成失败', icon: 'none' });
                              }
                          },
                          fail: (err) => {
                              console.error('Podcast Gen Network Error:', err);
                              Taro.hideLoading();
                              Taro.showToast({ title: '网络错误', icon: 'none' });
                          },
                          complete: () => setIsGeneratingPodcast(false)
                      });
                  }, 800);
              } else {
                  console.error('Consume Energy Error:', res);
                  // Taro.hideLoading();
                  Taro.showToast({ title: '能量不足或扣除失败', icon: 'none' });
                  setIsGeneratingPodcast(false);
              }
          },
          fail: (err) => {
              console.error('Consume Energy Network Error:', err);
              // Taro.hideLoading();
              Taro.showToast({ title: '网络错误', icon: 'none' });
              setIsGeneratingPodcast(false);
          }
      });
  };

  const handleSwiperChange = (e) => {
      const index = e.detail.current;
      console.log('Swiper Change:', index);
      
      setCurrentReaderIndex(index);
      setSelectedReaderId(READERS[index].id);

      // Play Character Sound
      const reader = READERS[index];
      console.log('Try to play sound:', reader.sound);

      if (reader.sound && audioContext.current) {
          const ctx = audioContext.current;
          
          // Stop strictly before changing src
          ctx.stop();
          
          // Small delay to ensure state reset (sometimes helps in mini-programs)
          setTimeout(() => {
              ctx.src = reader.sound;
              ctx.play();
          }, 50);
      }
  };

  // --- Render Functions ---

  const renderSelection = () => {
      const currentReader = READERS[currentReaderIndex];

      return (
        <View 
            className={`${styles.selectionContainer} ${styles.page}`} 
            style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}
        >
            {/* Base Background Image */}
            <Image 
                className={styles.bgImage}
                src={getOssImageUrl('TaLuo/1fbe7aae011497762f48152d2c0a558f.png')} 
                mode="aspectFill"
            />

            {/* Global Ambient Effects (Mystic Atmosphere) */}
            <View className={styles.ambientContainer}>
                <View className={styles.nebulaLayer}></View>
                <View className={styles.starsLayer}></View>
                <View className={styles.floatingParticles}></View>
            </View>

            <View className={styles.characterStage}>
                {/* Magic Circle on Floor (Perspective) */}
                <View className={styles.floorMagicCircle}>
                    <Image src={MAGIC_CIRCLE_IMG} className={styles.magicCircleImage} mode="aspectFit" />
                </View>

                <Swiper
                    className={styles.characterSwiper}
                    current={currentReaderIndex}
                    onChange={handleSwiperChange}
                    circular
                    indicatorDots={false}
                    autoplay={false}
                    duration={500}
                >
                    {READERS.map((reader) => (
                        <SwiperItem key={reader.id} className={styles.characterSwiperItem}>
                             <Image
                                className={styles.characterImage}
                                src={reader.image} 
                                mode="aspectFit"
                            />
                        </SwiperItem>
                    ))}
                </Swiper>

                {/* Stats Panel - Moved to Top Left */}
                <View 
                    className={styles.readerStatsContainer}
                    style={{ top: currentReader.statsTop || '12%' }}
                >
                    <View className={styles.readerStats} key={currentReader.id}>
                        <View className={styles.statRow}>
                            <Text className={styles.statLabel}>直觉 🔮</Text>
                            <View className={styles.statBar}>
                                <View className={`${styles.statFill} ${styles.statFillIntuition}`} style={{ width: `${currentReader.stats.intuition}%` }}></View>
                            </View>
                        </View>
                        <View className={styles.statRow}>
                            <Text className={styles.statLabel}>逻辑 🧠</Text>
                            <View className={styles.statBar}>
                                <View className={`${styles.statFill} ${styles.statFillLogic}`} style={{ width: `${currentReader.stats.logic}%` }}></View>
                            </View>
                        </View>
                        <View className={styles.statRow}>
                            <Text className={styles.statLabel}>共情 ❤️</Text>
                            <View className={styles.statBar}>
                                <View className={`${styles.statFill} ${styles.statFillEmpathy}`} style={{ width: `${currentReader.stats.empathy}%` }}></View>
                            </View>
                        </View>
                    </View>
                </View>

                <View className={styles.infoOverlay}>
                    <Text className={styles.readerName}>{currentReader.name}</Text>
                    <View className={styles.readerMetaRow}>
                        {/* Changed to Flag Emoji */}
                        <Text className={styles.readerFlag}>{currentReader.nationality}</Text>
                        <Text className={styles.readerTitle}>{currentReader.title}</Text>
                    </View>
                    <Text className={styles.readerStory}>{currentReader.story}</Text>
                </View>
            </View>

            <View className={styles.bottomPanel}>
                <View className={styles.modeSelector}>
                    {TEMPLATES.map(t => (
                        <View 
                            key={t.type} 
                            className={`${styles.modeCard} ${selectedTemplateType === t.type ? styles.flipped : ''}`}
                            onClick={() => setSelectedTemplateType(t.type)}
                        >
                            <View className={styles.cardInner}>
                                <View className={styles.cardFront}>
                                    <Text className={styles.cardText}>{t.name}</Text>
                                </View>
                                <View className={styles.cardBack}>
                                    <Text className={styles.cardTextActive}>{t.name}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <Swiper
                    className={styles.avatarSwiper}
                    current={currentReaderIndex}
                    onChange={handleSwiperChange}
                    previousMargin="280px"
                    nextMargin="280px"
                    circular
                >
                    {READERS.map((reader, index) => (
                        <SwiperItem key={reader.id} className={styles.avatarItem}>
                            <View className={`${styles.avatarWrapper} ${index === currentReaderIndex ? styles.active : ''}`}>
                                <Image 
                                    className={styles.avatarImg}
                                    src={reader.image} 
                                    mode="aspectFill"
                                />
                            </View>
                        </SwiperItem>
                    ))}
                </Swiper>

                <View className={styles.confirmBtn} onClick={handleStart}>
                    <Text className={styles.confirmText}>塔罗师就位</Text>
                </View>
            </View>
        </View>
      );
  };

  const renderPreview = () => {
      const cards = readingData?.cards || ['愚人', '圣杯3', '宝剑10'];
      const spreadType = readingData?.spread_type || 'holy_triangle';
      const spreadConfig = SPREAD_CONFIG[spreadType] || SPREAD_CONFIG.holy_triangle;
      
      // Check completion based on cardsState
      const placedCount = cardsState.filter(c => c.isPlaced).length;
      const totalCards = cards.length; // Should be 3
      const allPlaced = placedCount === totalCards;

      return (
          <MovableArea className={`${styles.previewContainer} ${styles.page}`}>
              {/* Table Mat Background */}
               <Image 
                className={styles.tableMatBg}
                src={TABLE_MAT_IMG} 
                mode="aspectFill"
               />
               
               <View className={styles.previewContent}>
                    <View className={styles.previewHeader}>
                        <Text className={styles.previewTitle}>
                            {allPlaced ? '已放到对应卡槽' : '请放到对应的卡槽'}
                        </Text>
                        <Text className={styles.previewSubtitle}>{spreadConfig.name}</Text>
                    </View>
                    
                    {/* Dynamic Spread Display - Slots Only */}
                    <View className={`${styles.spreadDisplay} ${styles[spreadConfig.styleClass]}`}>
                        {[0, 1, 2].map((index) => {
                            const positionLabel = spreadConfig.positions[index];
                            
                            // Check if this slot is occupied
                            const occupiedCard = cardsState.find(c => c.isPlaced && c.slotIndex === index.toString());
                            const isOccupied = !!occupiedCard;

                            return (
                                <View 
                                    key={index} 
                                    id={`slot-${index}`}
                                    className={`${styles.cardSlot} ${styles[`slot${index}`]} slot-target`}
                                    data-index={index}
                                >
                                    {/* Slot Background / Label */}
                                    <View 
                                        className={`${styles.cardBackStatic} ${isOccupied ? styles.slotActive : ''}`} 
                                        style={{ 
                                            border: isOccupied ? 'none' : '1px dashed rgba(212, 175, 55, 0.5)', 
                                            opacity: isOccupied ? 1 : 0.3 
                                        }}
                                    >
                                        {!isOccupied && (
                                            <Text className={styles.cardLabel} style={{ opacity: 0.8 }}>
                                                {positionLabel}
                                            </Text>
                                        )}
                                    </View>
                                    
                                    {/* We don't render the card INSIDE the slot div anymore. 
                                        The MovableView will overlay on top of it when placed. */}
                                    
                                    <View className={styles.cardLabelBox} style={{ opacity: isOccupied ? 1 : 0.5 }}>
                                        <Text className={styles.cardLabel}>{positionLabel}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Disclaimer below spread */}
                    <Text className={styles.aiDisclaimer}>本服务由人工智能提供技术支持</Text>

                    <View className={styles.bottomAction} style={{ visibility: allPlaced ? 'visible' : 'hidden', opacity: allPlaced ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                        <View className={`${styles.confirmBtn} ${styles.hexagramBtn}`} onClick={handleToSelection}>
                            <Text className={styles.confirmText}>Ask AI</Text>
                        </View>
                        <Text className={styles.hintText}>点击选择你的专属解牌人</Text>
                    </View>
               </View>

               {/* Render All Cards (Placed or Scattered) */}
               {cardsState.map((cardState) => {
                   const cardName = cards[cardState.id] || 'Unknown';
                   const cardImg = getCardImageUrl(cardName);
                   
                   return (
                       <MovableView
                            key={cardState.id}
                            data-id={cardState.id}
                            direction="all"
                            className={styles.draggableCard}
                            x={cardState.x}
                            y={cardState.y}
                            outOfBounds={true}
                            damping={40}
                            friction={2}
                            onTouchStart={() => handleTouchStart(cardState.id)}
                            onChange={handleDragChange}
                            onTouchEnd={handleDragEnd}
                            style={{ 
                                zIndex: activeCardId === cardState.id ? 1000 : (cardState.isPlaced ? 50 : 100),
                                transform: `rotate(${cardState.rotation}deg)`
                                // Note: MovableView handles transform translate. 
                                // We add rotation manually.
                            }}
                        >
                            <View className={styles.cardBackDraggable}>
                                <Image 
                                    src={cardImg} 
                                    className={styles.realCardImg}
                                    mode="aspectFit"
                                />
                            </View>
                        </MovableView>
                   );
               })}
          </MovableArea>
      );
  };

  const renderLoading = () => (
    <View className={`flex-col items-center justify-center ${styles.page}`}>
        <Image
          className={styles.loadingBg}
          src={TABLE_MAT_IMG}
          mode="aspectFill"
        />
        
        {/* Magic Circle Spinning */}
        <View className={styles.loadingCircleWrapper}>
            <Image
                src={getOssImageUrl('TaLuo/1d881dc64fec01ef45d4c25684c5ef1f.png')} 
                className={styles.spinner}
            />
            <View className={styles.pulsingCore}></View>
        </View>
        
        {/* Chanting Text Animation */}
        <View className={styles.chantingContainer}>
            <Text className={`${styles.chantText} ${styles.fadeAnimation}`}>
                "{CHANTS[chantIndex]}"
            </Text>
        </View>

        <View className={styles.readerStatus}>
            <Text className={styles.loadingTextMain}>
                {READERS.find(r => r.id === selectedReaderId)?.name.split(' ')[0]} 正在感应...
            </Text>
        </View>
    </View>
  );

  const renderResult = () => {
      const r = report || {};
      
      return (
        <ScrollView scrollY className={`flex-col ${styles.resultPage}`}>
            {/* Energy Animation */}
            {energyAnimation && (
                <View className={styles.energyFloat}>{energyAnimation} 能量</View>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <View className={styles.modalOverlay}>
                    <View className={styles.modalContent}>
                        <Text className={styles.modalTitle}>确认生成播客</Text>
                        <Text className={styles.modalText}>
                            将消耗 20 能量生成您的专属运势播客。
                            是否继续？
                        </Text>
                        <View className={styles.modalActions}>
                            <View 
                                className={`${styles.modalBtn} ${styles.cancelBtn}`}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                取消
                            </View>
                            <View 
                                className={`${styles.modalBtn} ${styles.confirmModalBtn}`}
                                onClick={confirmGeneratePodcast}
                            >
                                确认支付
                            </View>
                        </View>
                    </View>
                </View>
            )}

            <Image
              className={styles.resultBg}
              src={TABLE_MAT_IMG}
              mode="aspectFill"
            />
            <Image
                className={styles.zodiacWheel}
                src={getOssImageUrl('TaLuo/907bf205889bf3b23767a6f25e084bab.png')}
                mode="widthFix"
            />

            <View className={styles.resultContent}>
                
                <Text className={styles.aiDisclaimer} style={{ marginBottom: '30px', fontSize: '26px', color: 'rgba(212, 175, 55, 0.8)' }}>
                    -- 本服务由人工智能提供技术支持 --
                </Text>

                <View className={styles.questionBox}>
                    <Text className={styles.questionLabel}>咨询问题：</Text>
                    <Text className={styles.questionText}>
                        &quot;{readingData?.question || '未输入问题'}&quot;
                    </Text>
                </View>

                <View className={styles.sectionContainer}>
                    <View className={styles.sectionHeader}>
                        <View className={styles.diamondIcon}></View>
                        <Text className={styles.sectionTitle}>牌阵深度解析</Text>
                    </View>
                    <Text className={styles.analysisText}>
                {getReportAnalysisText(r) || '解析生成中...'}
                    </Text>
                </View>

                <View className={styles.sectionContainer}>
                    <View className={styles.sectionHeader}>
                        <View className={styles.diamondIcon}></View>
                        <Text className={styles.sectionTitle}>一句话建议</Text>
                    </View>
                    <Text className={styles.analysisText}>
                        {getFortuneSectionText(r, 'direct_answer') || '建议生成中...'}
                    </Text>
                </View>

                <View className={styles.sectionContainer}>
                    <View className={styles.sectionHeader}>
                        <View className={styles.diamondIcon}></View>
                        <Text className={styles.sectionTitle}>运势指引</Text>
                    </View>
                    
                    <View className={styles.fortuneItem}>
                        <Text className={styles.fortuneLabel}>
                            事业 <Text className={styles.score}>({getFortuneScoreText(r, 'career_score')}分)</Text>:
                        </Text>
                        <Text className={styles.fortuneText}>{getFortuneSectionText(r, 'career_fortune') || '暂无事业建议'}</Text>
                    </View>

                    <View className={styles.fortuneItem}>
                        <Text className={styles.fortuneLabel}>
                            爱情 <Text className={styles.score}>({getFortuneScoreText(r, 'love_score')}分)</Text>:
                        </Text>
                        <Text className={styles.fortuneText}>{getFortuneSectionText(r, 'love_fortune') || '暂无爱情建议'}</Text>
                    </View>

                    <View className={styles.fortuneItem}>
                        <Text className={styles.fortuneLabel}>
                            财运 <Text className={styles.score}>({getFortuneScoreText(r, 'finance_score')}分)</Text>:
                        </Text>
                        <Text className={styles.fortuneText}>{getFortuneSectionText(r, 'finance_fortune') || '暂无财运建议'}</Text>
                    </View>
                </View>

                <View className={styles.sectionContainer} style={{ marginBottom: '40px' }}>
                    <View className={styles.sectionHeader}>
                        <View className={styles.diamondIcon}></View>
                        <Text className={styles.sectionTitle}>水晶推荐</Text>
                    </View>
                    
                    <View className={styles.crystalBox}>
                        <Text className={styles.luckyInfo}>
                            幸运色：<Text style={{color: '#FFD700'}}>{getFortuneSectionText(r, 'lucky_color') || '暂无'}</Text> | 幸运数字：<Text style={{color: '#FFD700'}}>{getFortuneSectionText(r, 'lucky_number') || '暂无'}</Text>
                        </Text>
                        <Text className={styles.crystalText}>
                            今日专属水晶：{getFortuneSectionText(r, 'crystal_advice') || '暂无水晶推荐'}
                        </Text>
                    </View>
                </View>

                <View className={styles.podcastBtnContainer}>
                    <View className={styles.podcastBtn} onClick={handleGeneratePodcast}>
                        <View className={styles.podcastIcon}>
                            <Image 
                                src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/Podcsat/icon1.png"
                                className={styles.iconImg}
                            />
                        </View>
                        <View className={styles.podcastInfo}>
                            <Text className={styles.podcastTitle}>生成运势播客</Text>
                            <Text className={styles.podcastCost}>消耗 20 能量</Text>
                        </View>
                        <View className={styles.arrowIcon}>→</View>
                    </View>
                </View>
                
                <View style={{ height: '100px' }}></View>

            </View>
        </ScrollView>
      );
  };

  if (step === 'selecting') return renderSelection();
  if (step === 'preview') return renderPreview();
  if (step === 'loading') return renderLoading();
  return renderResult();
}

TaLuoAnswer.defaultProps = { className: '' };
