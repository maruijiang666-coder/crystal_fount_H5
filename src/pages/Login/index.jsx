import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Button, Image, Input } from '@tarojs/components';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import styles from './index.module.css';

export default function Login() {
  const [isAgreed, setIsAgreed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tempUserInfo, setTempUserInfo] = useState({ avatar: '', nickname: '' });

  useEffect(() => {
    const user = Taro.getStorageSync('user');
    if (user) {
      setTempUserInfo({
        avatar: user.avatar || '',
        nickname: user.nickname || ''
      });
    }
  }, []);

  const performLogin = async (phoneNumber, existingUserInfo = null) => {
    try {
      Taro.showLoading({
        title: '登录中...',
        mask: true
      });

      console.log('=== 获取登录凭证 ===');
      const loginRes = await Taro.login();
      console.log('code:', loginRes.code);
      
      const loginPayload = {
        code: loginRes.code,
        app_type: 'crystal',
        nickname: existingUserInfo?.nickname || tempUserInfo.nickname || phoneNumber || '微信用户',
        avatar: existingUserInfo?.avatar || tempUserInfo.avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        gender: 1,
        country: 'China',
        province: 'YunNan',
        city: 'Kunming',
        language: 'zh_CN',
        phone_number: phoneNumber
      };

      console.log('=== 发送登录请求 ===', loginPayload);
      const loginResponse = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.WX_LOGIN),
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M',
          'Accept': 'application/json'
        },
        data: loginPayload
      });
      
      if (loginResponse.statusCode === 200) {
        Taro.setStorageSync('user', loginResponse.data.data.user);
        Taro.setStorageSync('openid', loginResponse.data.data.user.openid);
        const responseData = loginResponse.data.data || loginResponse.data;
        Taro.setStorageSync('loginData', responseData);
        
        if (responseData.login_token) {
          Taro.setStorageSync('importcode', responseData.login_token);
        }

        Taro.hideLoading();
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });
        
        // 检查用户是否已登记信息
        try {
          const profileRes = await Taro.request({
            url: 'https://crystal.quant-speed.com/api/profiles/',
            method: 'GET',
            header: {
              'accept': 'application/json',
              'X-Login-Token': Taro.getStorageSync('importcode'),
              'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M'
            }
          });

          const results = profileRes.data.results || profileRes.data;
          const hasProfile = Array.isArray(results) 
            ? results.length > 0 
            : (results && typeof results === 'object' && Object.keys(results).length > 0 && results.id);

          if (profileRes.statusCode === 200 && hasProfile) {
            Taro.setStorageSync('hasCompletedGuide', true);
            // 登录成功并有资料，返回上一页
            setTimeout(() => {
              Taro.navigateBack();
            }, 1500);
          } else {
            setTimeout(() => {
              Taro.navigateTo({
                url: '/pages/LoginGuide/index'
              });
            }, 1500);
          }
        } catch (profileError) {
          setTimeout(() => {
            Taro.navigateTo({
              url: '/pages/LoginGuide/index'
            });
          }, 1500);
        }
      } else {
        const errorMsg = loginResponse.data?.message || loginResponse.data?.msg || '登录失败';
        Taro.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
      }
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: error.errMsg || '登录请求异常',
        icon: 'none',
        duration: 3000
      });
    }
  };

  const handleGetPhoneNumber = async (e) => {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      try {
        Taro.showLoading({ title: '登录中...', mask: true });
        const response = await Taro.request({
          url: getApiUrl(API_ENDPOINTS.WX_GET_PHONE),
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M',
            'Accept': 'application/json'
          },
          data: {
            code: e.detail.code,
            app_type: 'crystal'
          }
        });

        Taro.hideLoading();
        if (response.statusCode === 200) {
          setShowLoginModal(false);
          const phoneInfo = response.data?.data?.phone_info || response.data?.phone_info;
          const phoneNumber = phoneInfo?.purePhoneNumber;
          Taro.setStorageSync('phoneLoginData', response.data);
          await performLogin(phoneNumber || '默认用户');
        } else {
          const errorMsg = response.data?.message || response.data?.msg || '获取手机号失败';
          Taro.showToast({ title: errorMsg, icon: 'none', duration: 3000 });
        }
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({ title: error.errMsg || '请求异常', icon: 'none', duration: 3000 });
      }
    } else {
      Taro.showToast({ title: '需要手机号才能登录', icon: 'none' });
    }
  };

  const handleLoginClick = () => {
    if (!isAgreed) {
      Taro.showToast({ title: '请先阅读并同意协议', icon: 'none' });
      return;
    }
    setShowLoginModal(true);
  };

  const handleChooseAvatar = (e) => {
    const avatarUrl = e.detail.avatarUrl;
    if (avatarUrl) {
      setTempUserInfo(prev => ({ ...prev, avatar: avatarUrl }));
      Taro.showLoading({ title: '上传头像中...', mask: true });
      Taro.uploadFile({
        url: 'https://data.tangledup-ai.com/upload?folder=crystal%2Fuserimg',
        filePath: avatarUrl,
        name: 'file',
        header: { 'accept': 'application/json' },
        success: (res) => {
          Taro.hideLoading();
          try {
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            if (data.success && data.file_url) {
              setTempUserInfo(prev => ({ ...prev, avatar: data.file_url }));
              Taro.showToast({ title: '上传成功', icon: 'success', duration: 1000 });
            } else {
              Taro.showToast({ title: data.message || '上传失败', icon: 'none' });
            }
          } catch (err) {
            Taro.showToast({ title: '上传异常', icon: 'none' });
          }
        },
        fail: () => {
          Taro.hideLoading();
          Taro.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    }
  };

  const onNicknameInput = (e) => {
    const nickname = e.detail.value;
    setTempUserInfo(prev => ({ ...prev, nickname: nickname }));
  };

  return (
    <View className={styles['page']}>
      <View className={`flex-col ${styles['group']}`}>
        <View className={`flex-col items-center`}>
          <Text className={`${styles['text']}`}>谴山国际水晶</Text>
          <Text className={`${styles['font']} ${styles['text_2']} ${styles['mt-25']}`}>
            请完成微信号快速登录以继续使用
          </Text>
        </View>
        <View className={`flex-col mt-68`}>
          <View className={`flex-col justify-start items-center self-stretch relative`}>
            <View 
              className={`${styles['login-button']}`}
              onClick={handleLoginClick}
            >
              <View className={`flex-col justify-start items-center ${styles['text-wrapper']}`}>
                <Text className={`${styles['text_3']}`}>登录</Text>
              </View>
            </View>
            <View 
              className={`${styles['cancel-button']}`}
              onClick={() => Taro.navigateBack()}
            >
              <Text className={styles['cancel-text']}>取消登录</Text>
            </View>
          </View>
        </View>

        <View className={styles['agreement-container']}>
          <View
            className={styles['checkbox-area']}
            onClick={() => setIsAgreed(!isAgreed)}
          >
            <View className={`${styles['checkbox']} ${isAgreed ? styles['checkbox-checked'] : ''}`}>
              {isAgreed && <View className={styles['checkbox-inner']}></View>}
            </View>
          </View>
          <Text className={styles['agreement-text']}>我已阅读并同意</Text>
          <Text 
            className={styles['agreement-link']}
            onClick={() => Taro.navigateTo({ url: '/pages/Agreement/index' })}
          >
            《用户服务协议》
          </Text>
          <Text className={styles['agreement-text']}>与</Text>
          <Text 
            className={styles['agreement-link']}
            onClick={() => Taro.navigateTo({ url: '/pages/Privacy/index' })}
          >
            《隐私政策》
          </Text>
        </View>
      </View>

      {/* 登录弹窗 */}
      {showLoginModal && (
        <View className={styles['modal-overlay']}>
          <View className={styles['modal-content']}>
            <View className={styles['modal-header']}>
              <View className={styles['modal-title']}>
                <Text>谴山国际水晶 申请</Text>
              </View>
              <Text className={styles['modal-subtitle']}>获取你的昵称、头像</Text>
              <Text className={styles['modal-desc']}>用于个人中心以及分享时展示</Text>
            </View>
            
            <View className={styles['modal-form']}>
              <View className={styles['form-item']}>
                <Text className={styles['form-label']}>头像</Text>
                <Button 
                  openType="chooseAvatar" 
                  onChooseAvatar={handleChooseAvatar}
                  className={styles['avatar-btn']} 
                >
                  <Image src={tempUserInfo.avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'} className={styles['modal-avatar-img']} />
                </Button>
              </View>
              
              <View className={styles['form-item']}>
                <Text className={styles['form-label']}>昵称</Text>
                <Input 
                  type="nickname" 
                  className={styles['nickname-input']} 
                  placeholder="请输入昵称" 
                  placeholderStyle="color: #ccc"
                  value={tempUserInfo.nickname}
                  onInput={onNicknameInput}
                  onBlur={onNicknameInput} 
                />
              </View>
            </View>
            
            <View className={styles['agreement-section']}>
              <View 
                className={styles['checkbox-area']}
                onClick={() => setIsAgreed(!isAgreed)}
              >
                <View className={`${styles['checkbox']} ${isAgreed ? styles['checkbox-checked'] : ''}`}>
                  {isAgreed && <View className={styles['checkbox-inner']}></View>}
                </View>
              </View>
              <View className={styles['agreement-content']}>
                <Text onClick={() => setIsAgreed(!isAgreed)}>我已阅读并同意</Text>
                <Text 
                  className={styles['link']}
                  onClick={(e) => {
                    e.stopPropagation();
                    Taro.navigateTo({ url: '/pages/Agreement/index' });
                  }}
                >
                  《用户服务协议》
                </Text>
                <Text>与</Text>
                <Text 
                  className={styles['link']}
                  onClick={(e) => {
                    e.stopPropagation();
                    Taro.navigateTo({ url: '/pages/Privacy/index' });
                  }}
                >
                  《隐私政策》
                </Text>
                <Text>，允许获取昵称、头像等信息用于账号登录。</Text>
              </View>
            </View>

            <View className={styles['modal-footer']}>
              <Button 
                className={styles['btn-refuse']} 
                onClick={() => setShowLoginModal(false)}
              >
                取消登录
              </Button>
              {isAgreed ? (
                <Button 
                  className={styles['btn-save']}
                  openType="getPhoneNumber"
                  onGetPhoneNumber={handleGetPhoneNumber}
                >
                  保存
                </Button>
              ) : (
                <Button 
                  className={styles['btn-save']}
                  onClick={() => Taro.showToast({ title: '请先阅读并同意协议', icon: 'none' })}
                >
                  保存
                </Button>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
