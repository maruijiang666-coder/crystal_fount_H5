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

    // 直接跳转到塔罗页面，不再消耗灵力
    Taro.navigateTo({ url: `/pages/TaLuo/index?question=${encodeURIComponent(inputValue)}` });
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

      </View>
    </View>
  );
}

TanChuang.defaultProps = { className: '' };
