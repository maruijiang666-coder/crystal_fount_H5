import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import styles from './index.module.css';
import { getOssImageUrl } from '../../utils/config';
import NFCManager from '../../utils/NFCManager';

export default function ActivateCrystal() {
  const [status, setStatus] = useState('scanning'); // scanning, reading, success, error
  const [message, setMessage] = useState('请将手机背部NFC区域靠近水晶');
  const [currentSn, setCurrentSn] = useState(''); // Store SN to display on UI
  const [activationResult, setActivationResult] = useState(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const statusRef = useRef(status);
  // Sync ref with state on every render
  statusRef.current = status;

  // Track if we should be scanning
  const shouldScan = useRef(false);

  const [bgImage, setBgImage] = useState('');

  useDidShow(() => {
    // Reset page state when showing
    console.log('ActivateCrystal useDidShow');
    setActivationResult(null);
    setStatus('scanning');
    setMessage('请将手机背部NFC区域靠近水晶');
    setCurrentSn('');
    statusRef.current = 'scanning';
    
    // Restart NFC if it was stopped
    shouldScan.current = true;
    const storedSn = Taro.getStorageSync('latest_nfc_sn');
    if (!storedSn) {
        startNFC();
    }
  });

  useDidHide(() => {
      console.log('【ActivateCrystal】页面隐藏(useDidHide)：准备释放NFC资源');
      shouldScan.current = false;
      stopNFC();
  });

  // 增加页面卸载时的清理
  useEffect(() => {
    const initPage = async () => {
      // 登录通过后，执行原有逻辑
      const params = Taro.getCurrentInstance().router?.params || {};
      console.log('Page Params:', params);

      let targetSn = params.sn;

      // Handle case where parameters are passed via 'q' (Common in scan scenarios)
      if (!targetSn && params.q) {
          try {
              const decodedUrl = decodeURIComponent(params.q);
              console.log('Decoded Q:', decodedUrl);
              // Extract sn from URL: ...&sn=xxxxx or ?sn=xxxxx
              const match = decodedUrl.match(/[?&]sn=([^&]+)/i);
              if (match && match[1]) {
                  targetSn = match[1];
              }
          } catch (e) {
              console.error('Error parsing q param:', e);
          }
      }

      // Handle case where parameters are passed via 'cq' (WeChat Scheme Custom Parameter)
      // Doc: weixin://dl/business/?t=*TICKET*&cq=*CUSTOM PARAMETER*
      if (!targetSn && params.cq) {
          try {
              // cq might be "sn=SN_TEST_001"
              const decodedCq = decodeURIComponent(params.cq);
              console.log('Decoded CQ:', decodedCq);
              const match = decodedCq.match(/(?:^|[?&])sn=([^&]+)/i);
              if (match && match[1]) {
                  targetSn = match[1];
              } else if (!decodedCq.includes('=')) {
                  // If cq is just the value "SN_TEST_001"
                  targetSn = decodedCq;
              }
          } catch (e) {
               console.error('Error parsing cq param:', e);
          }
      }

      // Check if launched with 'sn' parameter (e.g. from iOS NFC Scheme)
      if (targetSn) {
          console.log('Received SN:', targetSn);
          // Clear global SN storage to prevent reuse
          Taro.removeStorageSync('latest_nfc_sn'); 
          shouldScan.current = false; // Don't scan if we have target
          startActivationWithId(targetSn);
      } else {
          // Fallback: Check global storage (for switchTab cases where params are lost)
          const storedSn = Taro.getStorageSync('latest_nfc_sn');
          if (storedSn) {
              console.log('Found SN in storage:', storedSn);
              Taro.removeStorageSync('latest_nfc_sn');
              setCurrentSn(storedSn);
              shouldScan.current = false;
              startActivationWithId(storedSn);
          } else {
              // Normal initialization (Android NFC or manual entry)
              // 强制清理残留的 latest_nfc_sn，防止意外的自动激活
              Taro.removeStorageSync('latest_nfc_sn');
              shouldScan.current = true;
              startNFC();
          }
      }
    };

    initPage();
    
    return () => {
      console.warn('【ActivateCrystal】组件销毁(Unmount)：释放NFC监听');
      shouldScan.current = false;
      stopNFC();
    };
  }, []);

  const startNFC = () => {
    if (!shouldScan.current) return;
    
    // 使用 NFCManager 接管监听
    NFCManager.takeOver(handleNFCDiscoveredCallback);
  };

  const handleNFCDiscoveredCallback = (res) => {
       // 日志：确认是谁在处理
       // console.log("ActivateCrystal 监听到nfc事件了:-*-", res);
       
       if (!shouldScan.current) {
           console.log('【ActivateCrystal】Ignored NFC event (page hidden/inactive)');
           // 既然使用了 NFCManager，这里只需要 release 即可，不用自己操作 adapter
           NFCManager.release();
           return;
       }
       handleNFCSuccess(res);
  };

  const stopNFC = () => {
    // 使用 NFCManager 释放监听
    NFCManager.release();
  };

  async function startActivationWithId(nfcId) {
    console.log('startActivationWithId - SN:', nfcId);
    
    if (!nfcId) {
      Taro.showToast({ title: '未识别到有效的水晶编号', icon: 'none' });
      return;
    }

    // Save SN to local storage immediately as requested
    // 无论缓存中是否有值，只要是新的识别或进入，都更新缓存
    Taro.setStorageSync('nfc_tag_id', nfcId);

    // 优化拦截逻辑：
    // 1. 如果正在读取同一个ID，防抖拦截
    if ((status === 'reading' || statusRef.current === 'reading') && currentSn === nfcId) return;

    // 2. 如果已经激活成功且弹窗正在显示，且是同一个ID，拦截（避免重复弹窗）
    if ((status === 'success' || statusRef.current === 'success' || activationResult) && currentSn === nfcId) return;

    // 更新 UI 显示
    setCurrentSn(nfcId);

    setStatus('reading');
    statusRef.current = 'reading'; // 立即更新 Ref 防止并发
    setMessage('正在读取水晶信息...');
    try {
      Taro.vibrateShort({ type: 'medium' });
    } catch (e) {}

    const isActivated = await checkUserActivation(nfcId);

    if (isActivated) {
      setStatus('success');
      setMessage('该水晶已激活');
      // 再次确认更新缓存（双重保险）
      Taro.setStorageSync('nfc_tag_id', nfcId);
      setActivationResult({ already: true });
      return;
    }

    setMessage('正在激活水晶...');
    callActivateCrystalApi(nfcId);
  }

  const handleNFCSuccess = async (res) => {
    // Check status via Ref to prevent redundant processing or error toasts during activation
    if (statusRef.current === 'reading' || statusRef.current === 'success') {
        console.log('Skipping NFC callback due to active status:', statusRef.current);
        return;
    }

    console.log('NFC Scan Result (Raw):', res);
    
    let foundUri = null;
    let detectedSn = null;

    // Try to extract ID
    if (res && res.id) {
        const idHex = Array.from(new Uint8Array(res.id))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        // Also log the messages if available (NDEF)
        if (res.messages && res.messages.length > 0) {
            res.messages.forEach((msg, index) => {
                
                // 增强的 records 提取逻辑 (同步修复：防止 records 为空时直接跳过)
                // 如果 msg.records 存在且非空，使用它。
                // 否则，如果 msg 是数组，使用它。
                // 否则（msg.records 为空或不存在，且 msg 不是数组），将 msg 本身视为 record。
                let records = [];
                if (msg.records && msg.records.length > 0) {
                    records = msg.records;
                } else if (Array.isArray(msg)) {
                    records = msg;
                } else {
                    records = [msg];
                }
                
                records.forEach((record, rIndex) => {
                    if (!record) return;

                    // 安全获取 payload 和 type
                    const payloadBytes = new Uint8Array(record.payload || []);
                    const typeBytes = new Uint8Array(record.type || []);

                    // Check for URI Record (Type 'U' = 0x55)
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
                            // uriTail is usually UTF-8
                            let rawStr = "";
                            // Avoid stack overflow with spread for large arrays
                            for(let i=0; i<uriTailBytes.length; i++) rawStr += String.fromCharCode(uriTailBytes[i]);
                            uriTail = decodeURIComponent(escape(rawStr));
                         } catch(e) {
                             uriTail = String.fromCharCode(...uriTailBytes);
                         }
                         foundUri = prefix + uriTail;
                         console.log('Found URI:', foundUri);
                    } else if (payloadBytes.length > 0) {
                         // Some tags might store the URL directly in payload without Type 'U' but with NDEF record structure
                         // Or it might be a text record containing the URL
                         // Let's be permissive and check if payload contains "weixin://" or "sn="
                         try {
                             let rawStr = "";
                             for(let i=0; i<payloadBytes.length; i++) rawStr += String.fromCharCode(payloadBytes[i]);
                             
                             // Clean up potential status bytes if it's a text record
                             // (Text Record: [Status][Lang][Content])
                             // But here we just look for the substring
                             if (rawStr.includes('weixin://') || rawStr.includes('sn=')) {
                                 console.log('Found URL-like string in payload:', rawStr);
                                 // Extract URI from the raw string if possible
                                 const urlMatch = rawStr.match(/(weixin:\/\/[^\s\x00]+)/) || rawStr.match(/(http[s]?:\/\/[^\s\x00]+)/);
                                 if (urlMatch) {
                                     foundUri = urlMatch[1];
                                 } else if (rawStr.includes('sn=')) {
                                     // Direct SN content or partial URL
                                     foundUri = rawStr; 
                                 }
                             }
                         } catch (e) {
                             console.log('Error parsing raw payload for URL:', e);
                         }
                    }

                    if (record.payload) {
                        // Try to decode NDEF Text Record
                        // Structure: [Status Byte] [Language Code] [Text]
                        if (payloadBytes.length > 0) {
                            const status = payloadBytes[0];
                            const langLen = status & 0x3F;
                            
                            if (payloadBytes.length > 1 + langLen) {
                                const textBytes = payloadBytes.slice(1 + langLen);
                                let textContent = '';
                                
                                // Try UTF-8 decode
                                try {
                                    const rawStr = String.fromCharCode(...textBytes);
                                    // Simple decode for UTF-8 bytes to string
                                    textContent = decodeURIComponent(escape(rawStr));
                                } catch (e) {
                                    // Fallback to raw char codes
                                    textContent = String.fromCharCode(...textBytes);
                                }
                                console.log(`  Payload (Decoded Text):`, textContent);
                                
                                // If we found valid text content, assume it might be the ID
                                detectedSn = textContent;
                                
                                // Try to extract SN from Text Record as well if it looks like a URL
                                if (textContent.includes('sn=')) {
                                     try {
                                        const match = textContent.match(/[?&]sn=([^&]+)/i);
                                        if (match && match[1]) {
                                            const txtSn = match[1];
                                            console.log('Extracted SN from Text Record:', txtSn);
                                            detectedSn = txtSn;
                                        }
                                     } catch(e) {}
                                }
                            }
                        }
                    }
                });
            });
        } else {
            console.log('No NFC Messages found in scan result.');
        }
    }

    if (foundUri) {
         console.log('Recognized Scheme:', foundUri);
         
         // 1. Try to extract SN from Scheme (e.g. ...&sn=xxxxx)
         let extractedSn = null;
         try {
             const match = foundUri.match(/[?&]sn=([^&]+)/i);
             if (match && match[1]) {
                 extractedSn = match[1];
                 console.log('Extracted SN from Scheme:', extractedSn);
             }
         } catch(e) {
             console.error('Error extracting SN from URI:', e);
         }

         if (extractedSn) {
             // Store SN globally before any potential jump or re-render
             // Removed to prevent auto-trigger on next visit: Taro.setStorageSync('latest_nfc_sn', extractedSn);
             startActivationWithId(extractedSn);
             return;
         } else {
             console.warn('SN not found in URI. Using URI as ID for debug.');
             setCurrentSn("URI: " + foundUri);
             // 如果从 URI 没提取到 SN，但在 NDEF 文本记录里也没提取到，
             // 我们可以尝试把 foundUri 作为 ID (如果不希望这样，可以注释掉下面这行)
             // detectedSn = foundUri; 
         }
    }

    // 如果通过上述步骤找到了 ID
    if (detectedSn) {
        startActivationWithId(detectedSn);
        return;
    }

    // 模拟点击逻辑 (res 为空或无 id)
    if (!res || !res.id) {
        const testId = 'NFC__004';
        console.log('Simulation/Test Mode: Using ID', testId);
        startActivationWithId(testId);
        return;
    }

    // 走到这里说明是真实扫描，但是没解析出有效 ID
    setStatus('error');
    setMessage('未识别到有效的NFC标签，请重新贴近水晶');
    Taro.showToast({ title: '未识别到有效的NFC标签，请重试', icon: 'none' });
  };

  const handleScanActivate = async () => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode', 'barCode']
      });
      const result = res.result || res.data;
      if (!result) {
        Taro.showToast({ title: '未识别到有效二维码', icon: 'none' });
        return;
      }
      startActivationWithId(result);
    } catch (e) {
      const msg = e && e.errMsg ? e.errMsg : '';
      if (typeof msg === 'string' && msg.indexOf('cancel') !== -1) {
        return;
      }
      console.error('Scan code failed:', e);
      Taro.showToast({ title: '扫码失败，请重试', icon: 'none' });
    }
  };

  const checkUserActivation = async (targetNfcId) => {
      try {
          const res = await Taro.request({
              url: 'https://crystal.quant-speed.com/api/activate_crystal/user_nfc_tags/',
              method: 'GET',
              header: {
                  'accept': 'application/json',
                  'X-Login-Token': Taro.getStorageSync("importcode"),
                  'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
              }
          });

          if (res.statusCode === 200 && res.data && Array.isArray(res.data.results)) {
              const activatedTags = res.data.results;
              console.log("-*-*-*-*-*-*:当前用户所有的激活"+activatedTags)
              const found = activatedTags.find(item => 
                  item.crystal_tag && item.crystal_tag.nfc_tag_id === targetNfcId
              );
               console.log("-*-*-*-*-*-*:当前用户所有的found"+JSON.stringify(found))
              return !!found;
          }
      } catch (e) {
          console.error('Check activation failed:', e);
      }
      return false;
  };

  const callActivateCrystalApi = (nfcId) => {
    const loginData = Taro.getStorageSync('loginData');
    const phoneNumber = loginData?.user?.phone_number || loginData?.data?.phone_number;

    if (!phoneNumber) {
        Taro.showToast({ title: '未找到用户手机号，请先登录', icon: 'none' });
        setStatus('error');
        setMessage('未找到用户手机号，请先登录');
        return;
    }

    Taro.request({
      url: 'https://crystal.quant-speed.com/api/activate_crystal/',
      method: 'POST',
      header: {
        'accept': 'application/json',
        'X-Login-Token': Taro.getStorageSync("importcode"),
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
      },
      data: {
        phone_number: phoneNumber,
        nfc_tag_id: nfcId 
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          setStatus('success');
          setMessage('激活成功！');
          setActivationResult(res.data);
          // Save to storage on success
          Taro.setStorageSync('nfc_tag_id', nfcId);
        } else {
          console.error('Activation failed:', res);
          const rawDetail = res.data?.detail || '';
          let detail = rawDetail || '激活失败，请重试';

          if (
            detail.includes('not found') ||
            detail.includes('Not found') ||
            detail.includes('标签不存在')
          ) {
            detail = '未找到对应的水晶标签，请确认水晶是否已绑定';
          }

          Taro.showToast({ title: detail, icon: 'none' });
          setStatus('error');
          setMessage(detail);
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

  const handleCloseOverlay = () => {
      setActivationResult(null); // 清空弹窗状态
      Taro.switchTab({ 
        url: '/pages/My/index',
        fail: (err) => {
            console.error('Switch tab failed', err);
            Taro.reLaunch({ url: '/pages/My/index' });
        }
      });
  }

  return (
    <View className={styles.page}>
      {/* Background Particles */}
      <View className={styles.particles}>
        {[...Array(20)].map((_, i) => (
            <View 
                key={i} 
                className={styles.star} 
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    '--duration': `${Math.random() * 3 + 2}s`,
                    '--delay': `${Math.random() * 2}s`
                }}
            />
        ))}
      </View>

      <View className={styles.header}>
        <View className={styles.statInfo}>
            <View className={styles.mainTitle}>激活水晶</View>
            <View className={styles.subText}>{message}</View>
            {currentSn && (
                <View className={styles.snText} style={{ marginTop: '10px', color: '#ffd700', fontSize: '14px' }}>
                    SN: {currentSn}
                </View>
            )}
        </View>
      </View>

      <View className={`${styles.crystalContainer} ${status === 'reading' ? styles.reading : ''}`}>
        <View className={styles.magicRing}></View>
        <View className={styles.glow}></View>
        <Image 
          src={getOssImageUrl('SJSY/1e467fc804d0fd434a82a6706adadf24.png')} 
          className={styles.crystalImage}
          mode="aspectFit"
        />
        {status === 'reading' && (
             <Text className={styles.floatingText}>Reading NFC...</Text>
        )}
      </View>

      {/* Visual Hint for NFC */}
      {status === 'scanning' && (
          <View className={styles.scanHintContainer}>
              <View className={styles.phoneIcon}></View>
              <Text className={styles.scanText}>将手机背部贴近水晶</Text>
          </View>
      )}

      <View className={styles.bottomControls}>
        {isIOSDevice ? (
          <View className={styles.scanBtn} onClick={handleScanActivate}>扫码激活水晶</View>
        ) : (
          <View className={styles.simulateBtn} onClick={handleNFCSuccess}>模拟NFC感应</View>
        )}
      </View>

      {/* Result Overlay */}
      {activationResult && (
        <View className={styles.overlay}>
          <View className={`${styles.rewardCard} ${styles.epic}`}>
            <View className={styles.rewardTitle}>激活成功</View>
            <View className={styles.rewardDesc}>
              {activationResult?.already ? '该水晶已激活' : '您的水晶已成功激活！'}
            </View>
             {/* Display any relevant info from activationResult if needed */}
            <Button className={styles.confirmBtn} onClick={handleCloseOverlay}>
              确定
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
