import { useEffect, useRef, useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Button, Input } from '@tarojs/components';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import styles from './index.module.css';

const DEFAULT_CSRF_TOKEN = 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M';

const getApiErrorMessage = (payload, fallback = '请求异常') => {
  if (!payload) return fallback;
  return (
    payload?.data?.message ||
    payload?.response?.data?.message ||
    payload?.message ||
    payload?.errMsg ||
    fallback
  );
};

export default function Login() {
  const [isAgreed, setIsAgreed] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [focusSmsCodeInput, setFocusSmsCodeInput] = useState(false);
  const smsTimerRef = useRef(null);

  const clearSmsTimer = () => {
    if (smsTimerRef.current) {
      clearInterval(smsTimerRef.current);
      smsTimerRef.current = null;
    }
  };

  const startSmsCountdown = () => {
    clearSmsTimer();
    setSmsCountdown(60);
    const timer = setInterval(() => {
      setSmsCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          smsTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    smsTimerRef.current = timer;
  };

  const checkUserProfileAndContinue = async (loginToken) => {
    try {
      const profileRes = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.PROFILES),
        method: 'GET',
        header: {
          accept: 'application/json',
          'X-Login-Token': loginToken,
          'X-CSRFTOKEN': DEFAULT_CSRF_TOKEN
        }
      });

      const results = profileRes.data.results || profileRes.data;
      const hasProfile = Array.isArray(results)
        ? results.length > 0
        : !!(results && typeof results === 'object' && Object.keys(results).length > 0 && results.id);

      if (profileRes.statusCode === 200 && hasProfile) {
        Taro.setStorageSync('hasCompletedGuide', true);
        setTimeout(() => {
          Taro.navigateBack();
        }, 1200);
        return;
      }
    } catch (error) {
      console.error('Fetch profile after login failed:', error);
    }

    setTimeout(() => {
      Taro.navigateTo({ url: '/pages/LoginGuide/index' });
    }, 1200);
  };

  const handleSubmitLogin = async () => {
    if (!isAgreed) {
      Taro.showToast({ title: '请先阅读并同意协议', icon: 'none' });
      return;
    }

    if (!/^1\d{10}$/.test(phoneNumber)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!smsCode.trim()) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    try {
      Taro.showLoading({
        title: '登录中...',
        mask: true
      });

      const response = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.H5_SMS_LOGIN),
        method: 'POST',
        header: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': DEFAULT_CSRF_TOKEN
        },
        data: {
          phone_number: phoneNumber,
          app_type: 'crystal',
          sms_code: smsCode.trim()
        }
      });

      const responseData = response.data?.data || response.data || {};
      const loginToken = responseData.login_token || response.data?.login_token;
      const user = responseData.user || {};

      if (response.statusCode < 200 || response.statusCode >= 300 || !loginToken) {
        const errorMsg = getApiErrorMessage(response, '登录失败');
        Taro.hideLoading();
        Taro.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
        return;
      }

      Taro.setStorageSync('user', user);
      Taro.setStorageSync('openid', user.openid || '');
      Taro.setStorageSync('loginData', responseData);
      Taro.setStorageSync('importcode', loginToken);
      Taro.setStorageSync('phoneLoginData', {
        user: {
          phone_number: user.phone_number || phoneNumber
        },
        data: {
          phone_number: user.phone_number || phoneNumber
        }
      });

      setShowLoginModal(false);
      Taro.hideLoading();
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1200
      });

      await checkUserProfileAndContinue(loginToken);
    } catch (error) {
      Taro.hideLoading();
      console.error('H5 sms login failed:', error);
      Taro.showToast({
        title: getApiErrorMessage(error, '登录请求异常'),
        icon: 'none',
        duration: 3000
      });
    }
  };

  const handleSendSmsCode = async () => {
    if (isSendingSms || smsCountdown > 0) return;

    if (!/^1\d{10}$/.test(phoneNumber)) {
      Taro.showToast({ title: '请先输入正确的手机号', icon: 'none' });
      return;
    }

    try {
      setIsSendingSms(true);

      const response = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.H5_SMS_SEND_CODE),
        method: 'POST',
        header: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': DEFAULT_CSRF_TOKEN
        },
        data: {
          phone_number: phoneNumber,
          app_type: 'crystal'
        }
      });

      if (response.statusCode === 200 && (response.data?.code === 0 || response.data?.message)) {
        Taro.showToast({ title: response.data?.message || '验证码已发送', icon: 'success', duration: 1200 });
        setFocusSmsCodeInput(true);
        startSmsCountdown();
        return;
      }

      const errorMsg = getApiErrorMessage(response, '发送验证码失败');
      Taro.showToast({ title: errorMsg, icon: 'none', duration: 3000 });
    } catch (error) {
      console.error('Send sms code failed:', error);
      Taro.showToast({
        title: getApiErrorMessage(error, '发送验证码请求异常'),
        icon: 'none',
        duration: 3000
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  useEffect(() => {
    return () => clearSmsTimer();
  }, []);

  return (
    <View className={styles.page}>

      {showLoginModal && (
        <View className={styles['modal-overlay']}>
          <View className={styles['modal-content']}>
            <View className={styles['modal-header']}>
              <View className={styles['modal-title']}>
                <Text>谴山国际水晶 登录</Text>
              </View>
              <Text className={styles['modal-subtitle']}>请输入手机号和验证码</Text>
              <Text className={styles['modal-desc']}>当前为 H5 短信验证码登录</Text>
            </View>

            <View className={styles['modal-form']}>
              <View className={styles['form-item']}>
                <Text className={styles['form-label']}>手机号</Text>
                <Input
                  type='number'
                  maxlength={11}
                  className={styles['modal-input']}
                  placeholder='请输入手机号'
                  placeholderStyle='color: #ccc'
                  value={phoneNumber}
                  onInput={(e) => setPhoneNumber(e.detail.value)}
                />
              </View>

              <View className={styles['form-item']}>
                <Text className={styles['form-label']}>验证码</Text>
                <View className={styles['code-panel']}>
                  <View className={styles['code-input-wrap']}>
                    <Input
                      type='number'
                      maxlength={6}
                      focus={focusSmsCodeInput}
                      className={`${styles['modal-input']} ${styles['code-input']}`}
                      placeholder='请输入验证码'
                      placeholderStyle='color: #ccc'
                      value={smsCode}
                      onInput={(e) => setSmsCode(e.detail.value)}
                    />
                    <Button
                      className={styles['code-btn']}
                      disabled={isSendingSms || smsCountdown > 0}
                      onClick={handleSendSmsCode}
                    >
                      {isSendingSms ? '发送中' : smsCountdown > 0 ? `${smsCountdown}s` : '验证码'}
                    </Button>
                  </View>
                </View>
              </View>
            </View>

            <View className={styles['agreement-section']}>
              <View className={styles['checkbox-area']} onClick={() => setIsAgreed(!isAgreed)}>
                <View className={`${styles.checkbox} ${isAgreed ? styles['checkbox-checked'] : ''}`}>
                  {isAgreed && <View className={styles['checkbox-inner']}></View>}
                </View>
              </View>
              <View className={styles['agreement-content']}>
                <Text onClick={() => setIsAgreed(!isAgreed)}>我已阅读并同意</Text>
                <Text
                  className={styles.link}
                  onClick={(e) => {
                    e.stopPropagation();
                    Taro.navigateTo({ url: '/pages/Agreement/index' });
                  }}
                >
                  《用户服务协议》
                </Text>
                <Text>与</Text>
                <Text
                  className={styles.link}
                  onClick={(e) => {
                    e.stopPropagation();
                    Taro.navigateTo({ url: '/pages/Privacy/index' });
                  }}
                >
                  《隐私政策》
                </Text>
                <Text>，允许使用手机号完成 H5 登录。</Text>
              </View>
            </View>

            <View className={styles['modal-footer']}>
              <Button className={styles['btn-refuse']} onClick={() => setShowLoginModal(false)}>
                取消
              </Button>
              <Button className={styles['btn-save']} onClick={handleSubmitLogin}>
                确认登录
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
