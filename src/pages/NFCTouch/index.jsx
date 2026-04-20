import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import styles from './index.module.css';
import { getOssImageUrl } from '../../utils/config';
import RollingNumber from '../../components/RollingNumber';
import NFCManager from '../../utils/NFCManager';

// 故事模板
const STORY_TEMPLATES = [
  { text: "小鹿在森林深处发现了一朵发光的{noun}，它似乎在低语着关于{emotion}的秘密。", type: "wonder" },
  { text: "在追逐一只幻影蝴蝶时，小鹿不小心跌入了一个{adjective}的洞穴，却在里面发现了古代的遗迹。", type: "adventure" },
  { text: "小鹿遇到了一位神秘的老者，老者看着它，说出了那句预言：'{wish}'。", type: "mystic" },
  { text: "突然一阵狂风刮过，小鹿迷失了方向，但它记得你的嘱托：'{wish}'，这给了它力量。", type: "struggle" }
];

export default function NFCTouch() {
  const [status, setStatus] = useState('scanning'); // scanning, reading, success, error
  const [message, setMessage] = useState('请将手机背部NFC区域靠近水晶');
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

  // Track if we should be scanning
  const shouldScan = useRef(false);
  // Ref to hold the active listener function
  // const activeListenerRef = useRef(null); // Deprecated

  useDidShow(() => {
    console.log('NFCTouch useDidShow');
    shouldScan.current = true;
    startNFC();
  });

  useDidHide(() => {
    console.log('NFCTouch useDidHide');
    shouldScan.current = false;
    stopNFC();
  });

  useEffect(() => {
    // Check for params passed from ActivateCrystal
    const params = Taro.getCurrentInstance().router?.params || {};
    if (params.sn) {
        console.log('NFCTouch initialized with SN:', params.sn);
        Taro.setStorageSync('nfc_tag_id', params.sn);
        
        // Trigger touch logic automatically if SN is present
        shouldScan.current = false;
        // Use a slight delay to ensure state is ready
        setTimeout(() => {
            handleNFCSuccess();
        }, 500);
    }

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

    // Initial start handled by useDidShow
    return () => {
      shouldScan.current = false;
      stopNFC();
    };
  }, []);

  const handleNFCDiscovered = (res) => {
    console.log('NFC Scan Result (Raw):', res);
    if (res) {
        // Log additional debug info
        console.log('Res Keys:', Object.keys(res));
        if (res.id) console.log('Res ID:', res.id);
        if (res.messages) console.log('Res Messages Length:', res.messages.length);
        if (res.techs) console.log('Res Techs:', res.techs);
    }
    let scannedSn = null;
    let foundUri = null;
    let detectedSn = null;

    // Try to extract ID from NDEF messages
    if (res && res.messages && res.messages.length > 0) {
        res.messages.forEach((msg, index) => {
            console.log(`Processing Message ${index}:`, msg);
            try {
                console.log(`Message ${index} JSON:`, JSON.stringify(msg));
            } catch(e) {}
            
            // 增强的 records 提取逻辑：
            // 如果 msg.records 存在且非空，使用它。
            // 否则，如果 msg 是数组，使用它。
            // 否则（msg.records 为空或不存在，且 msg 不是数组），将 msg 本身视为 record。
            // 这可以解决 msg 被错误包装成 {records: []} 但自身包含 payload 的情况。
            let records = [];
            if (msg.records && msg.records.length > 0) {
                records = msg.records;
            } else if (Array.isArray(msg)) {
                records = msg;
            } else {
                // Fallback: 即使 msg.records 存在但为空，我们也尝试检查 msg 本身是否有 payload
                // 如果 msg 只是 {records: []} 且无其他数据，后续 payload 处理会安全跳过
                records = [msg];
            }
            
            console.log(`Records determined: ${records.length}`, records);

            records.forEach((record, rIndex) => {
                if (!record) return;

                // Debug: 打印 record 的所有键值，寻找 payload
                console.log(`Record ${rIndex} Keys:`, Object.keys(record));

                // 安全获取 payload 和 type，防止崩溃
                // 有些情况下 payload 可能是 number[] 而不是 Uint8Array，需要兼容
                let payloadRaw = record.payload || [];
                let typeRaw = record.type || [];
                
                // 如果 payload 为空，尝试查找其它可能存放数据的字段 (兼容部分奇怪的实现)
                if ((!payloadRaw || payloadRaw.length === 0) && record.id) {
                     console.log('Payload empty, checking record.id as potential payload source...');
                     // 注意：record.id 通常是记录 ID，但有些非标实现可能会混淆
                }

                const payloadBytes = new Uint8Array(payloadRaw);
                const typeBytes = new Uint8Array(typeRaw);

                console.log(`Record ${rIndex} Type:`, typeBytes.join(','));
                console.log(`Record ${rIndex} Payload Len:`, payloadBytes.length);
                if (payloadBytes.length > 0) {
                    console.log(`Record ${rIndex} Payload Hex:`, Array.from(payloadBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
                }

                // 1. Check for URI Record (Type 'U' = 0x55)
                if (typeBytes.length === 1 && typeBytes[0] === 0x55) {
                    const prefixMap = {
                        0x01: 'http://www.',
                        0x02: 'https://www.',
                        0x03: 'http://',
                        0x04: 'https://',
                        0x00: '',
                    };
                    const identifierCode = payloadBytes[0];
                    const prefix = prefixMap[identifierCode] || '';
                    const uriTailBytes = payloadBytes.slice(1);
                    let uriTail = '';
                    try {
                        let rawStr = "";
                        for(let i=0; i<uriTailBytes.length; i++) rawStr += String.fromCharCode(uriTailBytes[i]);
                        uriTail = decodeURIComponent(escape(rawStr));
                    } catch(e) {
                        uriTail = String.fromCharCode(...uriTailBytes);
                    }
                    foundUri = prefix + uriTail;
                    console.log('Found URI:', foundUri);
                } else if (payloadBytes.length > 0) {
                     // 2. Raw Payload / Text Check (Permissive) - Fallback if not URI record
                     // Some tags might store the URL directly in payload without Type 'U'
                     try {
                         let rawStr = "";
                         for(let i=0; i<payloadBytes.length; i++) rawStr += String.fromCharCode(payloadBytes[i]);
                         
                         if (rawStr.includes('weixin://') || rawStr.includes('sn=')) {
                             console.log('Found URL-like string in payload:', rawStr);
                             const urlMatch = rawStr.match(/(weixin:\/\/[^\s\x00]+)/) || rawStr.match(/(http[s]?:\/\/[^\s\x00]+)/);
                             if (urlMatch) {
                                 foundUri = urlMatch[1];
                             } else if (rawStr.includes('sn=')) {
                                 foundUri = rawStr; 
                             }
                         }
                     } catch (e) {
                         console.log('Error parsing raw payload for URL:', e);
                     }
                }

                if (record.payload) {
                    // Try to decode NDEF Text Record
                    if (payloadBytes.length > 0) {
                        const status = payloadBytes[0];
                        const langLen = status & 0x3F;
                        
                        if (payloadBytes.length > 1 + langLen) {
                            const textBytes = payloadBytes.slice(1 + langLen);
                            let textContent = '';
                            try {
                                const rawStr = String.fromCharCode(...textBytes);
                                textContent = decodeURIComponent(escape(rawStr));
                            } catch (e) {
                                textContent = String.fromCharCode(...textBytes);
                            }
                            console.log(`  Payload (Decoded Text):`, textContent);
                            detectedSn = textContent; // Default to text content
                            
                            if (textContent.includes('sn=')) {
                                 try {
                                    const match = textContent.match(/[?&]sn=([^&]+)/i);
                                    if (match && match[1]) {
                                        detectedSn = match[1];
                                    }
                                 } catch(e) {}
                            }
                        }
                    }
                }
            });
        });
    }

    // Extract SN from found URI if available
    if (foundUri) {
        console.log('Recognized Scheme:', foundUri);
        try {
             const match = foundUri.match(/[?&]sn=([^&]+)/i);
             if (match && match[1]) {
                 scannedSn = match[1];
                 console.log('Extracted SN from URI:', scannedSn);
             }
        } catch(e) {
             console.error('Error extracting SN from URI:', e);
        }
    }
    
    // Use detectedSn if scannedSn is still null
    if (!scannedSn && detectedSn) {
        scannedSn = detectedSn;
        console.log('Using Detected SN from Text Record:', scannedSn);
    }

    // Fallback: If no SN found from NDEF/URI, use UID
    if (!scannedSn && res && res.id) {
         const idHex = Array.from(new Uint8Array(res.id))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
         // Only use UID if we really didn't find anything else
         console.log('No NDEF SN found. Using Tag ID (UID) as SN:', idHex);
         scannedSn = idHex;
    }

    if (scannedSn) {
        const currentSn = Taro.getStorageSync('nfc_tag_id');
        // If currentSn exists and is different, we might want to prompt or redirect
        // For now, adhering to existing logic: redirect to activation if mismatch
        if (currentSn && currentSn !== scannedSn) {
            console.log(`SN Mismatch: Current ${currentSn} != Scanned ${scannedSn}. Redirecting to Activation.`);
            Taro.redirectTo({ url: `/pages/ActivateCrystal/index?sn=${scannedSn}` });
            return false;
        }
        
        // Match or New -> Update storage and proceed
        Taro.setStorageSync('nfc_tag_id', scannedSn);
        
        // 确保 SN 被设置后再返回 true，以便触发 handleNFCSuccess
        console.log('SN Matched/Updated:', scannedSn);
        return true;
    }

    // 走到这里说明是真实扫描，但是没解析出有效 ID
    if (res && res.id) {
         const idHex = Array.from(new Uint8Array(res.id))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
         console.warn('Failed to parse SN from NDEF. Tag ID:', idHex);
    }

    setStatus('error');
    return false;
   };

  const startNFC = () => {
    if (!shouldScan.current) return;
    
    // 使用 NFCManager 接管监听
    NFCManager.takeOver(handleNFCDiscoveredCallback);
  };

  const handleNFCDiscoveredCallback = (res) => {
       console.log("NFCTouch 监听到nfc事件了:-*-", res);
       if (!shouldScan.current) {
           console.log('NFCTouch: Ignored NFC event (page hidden/inactive)');
           // 既然使用了 NFCManager，这里只需要 release 即可
           NFCManager.release();
           return;
       }
       
       const shouldContinue = handleNFCDiscovered(res);
       if (shouldContinue) {
           handleNFCSuccess();
       }
  };

  const stopNFC = () => {
    // 使用 NFCManager 释放监听
    NFCManager.release();
  };

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

  const handleNFCSuccess = () => {
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

    setStatus('reading');
    setMessage('正在感应灵力波动...');
    Taro.vibrateShort({ type: 'medium' });

    // Call Real API
    callTouchCrystalApi();
  };

  const callTouchCrystalApi = () => {
    const storedNfcId = Taro.getStorageSync('nfc_tag_id');
    const nfcId = storedNfcId || 'NFC__004';
    Taro.request({
      url: 'https://crystal.quant-speed.com/api/touch_crystal/',
      method: 'POST',
      header: {
        'accept': 'application/json',
        'X-Login-Token': Taro.getStorageSync("importcode"),
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
      },
      data: {
        nfc_tag_id: nfcId,
        touch_time: new Date().toISOString(),
        source: "nfc"
      },
      success: (res) => {
        if (res.statusCode === 200) {
          handleApiResponse(res.data);
        } else {
          Taro.showToast({ title: '感应失败，请重试', icon: 'none' });
          setStatus('scanning');
          setMessage('请将手机背部NFC区域靠近水晶');
        }
      },
      fail: (err) => {
        console.error('API Error:', err);
        Taro.showToast({ title: '网络连接失败', icon: 'none' });
        setStatus('scanning');
        setMessage('请将手机背部NFC区域靠近水晶');
      }
    });
  };

  const handleScanActivate = async () => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode', 'barCode']
      });
      const nfcId = res.result || res.data;
      if (!nfcId) {
        Taro.showToast({ title: '未识别到有效二维码', icon: 'none' });
        return;
      }

      Taro.showLoading({ title: '激活中...' });

      const loginData = Taro.getStorageSync('loginData');
      const phoneNumber = loginData?.user?.phone_number || loginData?.data?.phone_number;

      if (!phoneNumber) {
        Taro.hideLoading();
        Taro.showToast({ title: '未找到用户手机号，请先登录', icon: 'none' });
        return;
      }

      Taro.request({
        url: 'https://crystal.quant-speed.com/api/activate_crystal/',
        method: 'POST',
        header: {
          accept: 'application/json',
          'X-Login-Token': Taro.getStorageSync('importcode'),
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
        },
        data: {
          phone_number: phoneNumber,
          nfc_tag_id: nfcId
        },
        success: (resp) => {
          Taro.hideLoading();
          if (resp.statusCode === 200 || resp.statusCode === 201) {
            Taro.setStorageSync('nfc_tag_id', nfcId);
            Taro.showToast({ title: '激活成功', icon: 'success' });
          } else {
            const rawDetail = resp.data?.detail || '';
            let detail = rawDetail || '激活失败，请重试';
            if (
              detail.indexOf('not found') !== -1 ||
              detail.indexOf('Not found') !== -1 ||
              detail.indexOf('标签不存在') !== -1
            ) {
              detail = '未找到对应的水晶标签，请确认水晶是否已绑定';
            }
            Taro.showToast({ title: detail, icon: 'none' });
          }
        },
        fail: (err) => {
          Taro.hideLoading();
          console.error('Activate API Error:', err);
          Taro.showToast({ title: '网络连接失败', icon: 'none' });
        }
      });
    } catch (e) {
      const msg = e && e.errMsg ? e.errMsg : '';
      if (typeof msg === 'string' && msg.indexOf('cancel') !== -1) {
        return;
      }
      console.error('Scan activate failed:', e);
      Taro.showToast({ title: '扫码失败，请重试', icon: 'none' });
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
          url: 'https://crystal.quant-speed.com/api/touch_crystal/consume_energy/',
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
      setStatus('scanning');
      setMessage('请将手机背部NFC区域靠近水晶');
    }
  };

  const closeLevelUp = () => {
    setShowLevelUp(false);
    setLevelUpData(null);
    setStatus('scanning');
    setMessage('请将手机背部NFC区域靠近水晶');
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

  // 测试功能
  const testCritical = () => {
    handleApiResponse({
        total_energy: energy + 100,
        points_awarded: 100,
        is_critical: true,
        level_up: false
    });
  };

  const testLevelUp = () => {
      handleApiResponse({
          total_energy: energy + 50,
          points_awarded: 50,
          is_critical: false,
          level_up: true,
          new_level: '星光·启示',
          level_info: { description: '感知到了星辰的低语' }
      });
  };

  // 测试功能：重置次数
  const resetTouches = () => {
    setTouchesUsed(0);
    Taro.setStorageSync('daily_touches_used', 0);
    Taro.showToast({ title: '次数已重置', icon: 'success' });
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
            {/* <Text className={styles.statValue}>{energy}</Text> */}
            <RollingNumber value={energy} height={20} />
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
        {status === 'scanning' && (
            <View className={styles.wishBtn} onClick={() => setShowInput(true)}>
                <Text className={styles.wishText}>{userWish ? "寄语已封存" : "写下寄语"}</Text>
            </View>
        )}
      </View>
      
      <Text className={styles.mainTitle}>
        {status === 'success' ? '共鸣成功' : '触碰水晶'}
      </Text>
      <Text className={styles.subText}>{message}</Text>
      
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
            <RollingNumber value={balance} height={40} fontSize={36} />
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
