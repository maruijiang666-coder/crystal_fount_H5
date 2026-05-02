import { useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import styles from './index.module.css';

export default function Loading() {
  // Generate random stars only once
  const stars = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
      size: `${2 + Math.random() * 2}px`
    }));
  }, []);

  // 检查登录状态
  const checkLogin = async () => {
    try {
      const token = Taro.getStorageSync('importcode');
      const loginData = Taro.getStorageSync('loginData');
      const hasCompletedGuide = Taro.getStorageSync('hasCompletedGuide');

      // 基本字段检查
      if (!token || !loginData || !hasCompletedGuide) {
        return false;
      }

      // 验证 token 有效性
      const validateRes = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.WX_VALIDATE),
        method: 'POST',
        header: {
          'accept': 'application/json',
          'X-Login-Token': token,
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M'
        },
        data: {
          login_token: token
        }
      });

        if (validateRes.statusCode !== 200) {
          console.warn('Token 失效，状态码:', validateRes.statusCode);
          // 清除登录信息
          Taro.removeStorageSync('importcode');
          Taro.removeStorageSync('loginData');
          Taro.removeStorageSync('phoneLoginData');
          Taro.removeStorageSync('hasCompletedGuide');
          Taro.removeStorageSync('profileCheckPending');
          return false;
        }

      return true;
    } catch (e) {
      console.error('Login check failed', e);
      return false;
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        console.log('-*-*-*-*-*-*-*is loading*-*-*-*-*-*-*-*-*');

        // Android设备直接跳转到个人中心
        const systemInfo = Taro.getSystemInfoSync();
        if (systemInfo.platform === 'android') {
          console.log('Android device detected, redirecting to My page');
          Taro.switchTab({ url: '/pages/My/index' });
          return;
        }

        // 1. 先检查登录
        const isLoggedIn = await checkLogin();
        if (!isLoggedIn) {
          Taro.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 1500
          });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/My/index' });
          }, 1500);
          return;
        }

        const nfcTagId = Taro.getStorageSync('nfc_tag_id');
        const params = Taro.getCurrentInstance().router?.params || {};
        
        console.log('Loading Page Params:', params);
        console.log('Stored NFC Tag ID:', nfcTagId);

        // Construct query string to preserve parameters (e.g. sn, q, cq)
        const queryParts = [];
        for (const key in params) {
            if (Object.prototype.hasOwnProperty.call(params, key)) {
                 queryParts.push(`${key}=${params[key]}`);
            }
        }
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

        if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
          console.log('H5 environment detected, redirecting to NFCTouch');
          Taro.redirectTo({ url: `/pages/NFCTouch/index${queryString}` });
        } else if (nfcTagId) {
          console.log('Redirecting to NFCTouch');
          Taro.redirectTo({ url: `/pages/NFCTouch/index${queryString}` });
        } else {
          console.log('Redirecting to ActivateCrystal');
          Taro.redirectTo({ url: `/pages/ActivateCrystal/index${queryString}` });
        }
      } catch (error) {
        console.error('Error in Loading page logic:', error);
        // Fallback
        Taro.redirectTo({ url: '/pages/ActivateCrystal/index' });
      }
    };

    // Short delay for better UX and to show the animation
    const timer = setTimeout(checkStatus, 1500); // Increased slightly to 1.5s to let user see the cool animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className={styles.page}>
      {/* Background Particles */}
      <View className={styles.particles}>
        {stars.map((star, index) => (
          <View 
            key={index} 
            className={styles.star}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              '--duration': star.duration,
              '--delay': star.delay
            }} 
          />
        ))}
      </View>

      <View className={styles.loadingContainer}>
        <View className={styles.spinnerBox}>
          <View className={styles.magicRing} />
          <View className={styles.core} />
        </View>
        <Text className={styles.text}>正在感应水晶能量...</Text>
      </View>
    </View>
  );
}
