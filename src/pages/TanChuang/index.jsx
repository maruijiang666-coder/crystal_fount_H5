import React, { useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image, Input } from '@tarojs/components';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import styles from './index.module.css';

export default function TanChuang(props) {
  const [inputValue, setInputValue] = useState('');
  const [energyAnimation, setEnergyAnimation] = useState(null); // 'success' | 'fail' | null
  const [errorMsg, setErrorMsg] = useState('');

  const handleDivination = () => {
    // 1. API Call
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
    
    Taro.request({
      url: getApiUrl(API_ENDPOINTS.TOUCH_CRYSTAL_CONSUME_ENERGY),
      method: 'POST',
      header: {
        'accept': 'application/json',
        'X-Login-Token': Taro.getStorageSync("importcode"),
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': 'MFlroPUYKLLVTQDFPpsGv9vMrvQp8n9s'
      },
      data: {
        nfc_id: nfcId,
        amount: 40,
        reason: "tarot reading"
      },
      success: (res) => {
        if (res.statusCode === 200) {
           // Success
           setEnergyAnimation('success');
           
           // Show toast for clarity as well
           Taro.showToast({
             title: '消耗 40 灵力',
             icon: 'success',
             duration: 1500
           });

           // Wait for animation then navigate
           setTimeout(() => {
              Taro.navigateTo({ url: `/pages/TaLuo/index?question=${encodeURIComponent(inputValue)}` });
              setEnergyAnimation(null);
           }, 1500);
        } else {
           const rawDetail = res.data?.detail || ''
           let detail = rawDetail || '能量消耗失败，请稍后重试'
           
           if (detail.includes('Insufficient') || detail.includes('insufficient')) {
             detail = '能量不足，当前灵力无法完成本次占卜'
           }

           if (detail.includes('能量不足')) {
               setErrorMsg(detail);
               setEnergyAnimation('fail');
               setTimeout(() => setEnergyAnimation(null), 3000);
           } else {
               Taro.showToast({ title: detail || '能量消耗失败，请稍后重试', icon: 'none' });
           }
        }
      },
      fail: (err) => {
         Taro.showToast({ title: '网络请求失败', icon: 'none' });
         console.error(err);
      }
    });
  };

  return (
    <View className={`flex-col justify-start items-center relative ${styles['page']} ${props.className}`}>
      
      {/* Animation Overlays */}
      {energyAnimation === 'success' && (
         <View className={styles.energyFloat}>-40 灵力</View>
      )}
      {energyAnimation === 'fail' && (
         <View className={styles.energyError}>{errorMsg}</View>
      )}

      <View className={`flex-col relative ${styles['section']}`}>
        <View className={`flex-col items-start`}>
          <Text className={`${styles['font']} ${styles['text']}`}>您想了解什么？</Text>
          <Text className={`${styles['font']} ${styles['text_2']} ${styles['mt-17']}`}>Divination</Text>
        </View>
        <View className={`mt-34 flex-col`}>
          <View className={`flex-col justify-start items-start relative ${styles['text-wrapper']}`}>
            <Input 
              className={`${styles['text_3']} ${styles['input-style']}`}
              placeholder="请输入你想了解的内容"
              placeholderStyle="color: rgba(255,255,255,0.3);"
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              maxlength={100}
            />
          </View>
          <View className={`flex-col ${styles['group']} ${styles['mt-21']}`}>
            <View className={`flex-col justify-start items-center self-stretch relative ${styles['text-wrapper_2']}`}
              onClick={handleDivination}
            >
              <Text className={`${styles['text_4']}`}>提交问题</Text>
            </View>
            
            <Text className={styles.energyNotice}>本次提问将消耗 40 灵力</Text>

            <Text 
              className={`mt-10 self-center ${styles['text_5']}`}
              onClick={() => {
                Taro.navigateBack();
              }}
              style={{ cursor: 'pointer' }}
            >
              退出提问
            </Text>
          </View>
        </View>
        <Image
          className={`${styles['image']} ${styles['pos']}`}
          src="https://ide.code.fun/api/image?token=69290ea0043f1900118ee756&name=ba29a9bfea020d78cb3bf1760d2e5c28.png"
        />
      </View>
    </View>
  );
}

TanChuang.defaultProps = { className: '' };
