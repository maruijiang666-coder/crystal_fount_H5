import { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { View, Text, Button, Image, Input, ScrollView } from '@tarojs/components';
import { getOssImageUrl } from '../../utils/config.js';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import styles from './index.module.css';

const FOCUS_AREAS_MAP = {
  'career': '事业发展',
  'love': '情感姻缘',
  'wealth': '财富运势',
  'health': '身心健康',
  'study': '学业考试',
  'family': '家庭关系'
};

export default function My(props) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const token = Taro.getStorageSync('importcode');
      const loginData = Taro.getStorageSync('loginData');
      const hasCompletedGuide = Taro.getStorageSync('hasCompletedGuide');
      return !!(token && loginData && hasCompletedGuide);
    } catch (e) {
      return false;
    }
  });

  const [userInfo, setUserInfo] = useState(() => {
    try {
      const token = Taro.getStorageSync('importcode');
      const loginData = Taro.getStorageSync('loginData');
      const hasCompletedGuide = Taro.getStorageSync('hasCompletedGuide');
      
      if (token && loginData && hasCompletedGuide) {
         const phoneData = Taro.getStorageSync('phoneLoginData');
         return {
            nickname: loginData.user?.nickname || loginData.nickname || loginData.data?.nickname || '水晶用户',
            phone: phoneData?.user?.phone_number || phoneData?.data?.phone_number || '',
            avatar: loginData.user?.avatar || loginData.avatar || loginData.data?.avatar || ''
         };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [tempUserInfo, setTempUserInfo] = useState({ avatar: '', nickname: '' });
  const [showProfileDetailModal, setShowProfileDetailModal] = useState(false);
  const [profileDetailData, setProfileDetailData] = useState(null);
  const [nickname, setNickname] = useState('');

  const navigateToLogin = () => {
    Taro.navigateTo({ url: '/pages/Login/index' });
  };

  Taro.useShareAppMessage(() => {
    return {
      title: '这是我的水晶档案，快来创建你的吧',
      path: '/pages/My/index',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    };
  });

  Taro.useShareTimeline(() => {
    return {
      title: '这是我的水晶档案，快来创建你的吧',
      query: '',
      imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/xiaolu.png'
    };
  });

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (userInfo?.nickname) {
      setNickname(userInfo.nickname);
    }
  }, [userInfo?.nickname]);

  // 页面显示时重新检查登录状态
  useDidShow(() => {
    checkLoginStatus();
  });

  const checkLoginStatus = async () => {
    try {
      const token = Taro.getStorageSync('importcode');
      const loginData = Taro.getStorageSync('loginData');
      const phoneData = Taro.getStorageSync('phoneLoginData');
      const hasCompletedGuide = Taro.getStorageSync('hasCompletedGuide');
      
      console.log('=== 检查登录状态 ===');
      console.log('token:', token);
      console.log('loginData:', loginData);
      console.log('hasCompletedGuide:', hasCompletedGuide);
      
      // 只有当有 token、loginData 且完成了引导，才显示已登录状态
      if (token && loginData && hasCompletedGuide) {
        // 验证 token 是否有效
        try {
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
            throw new Error('Token invalid');
          }
        } catch (validateError) {
          console.error('登录态验证失败:', validateError);
          // 清除登录信息
          Taro.removeStorageSync('importcode');
          Taro.removeStorageSync('loginData');
          Taro.removeStorageSync('phoneLoginData');
          Taro.removeStorageSync('hasCompletedGuide');
          
          setIsLoggedIn(false);
          setUserInfo(null);
          
          Taro.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          return;
        }

        console.log('✅ 满足已登录条件，设置为已登录状态');
        setIsLoggedIn(true);
        setUserInfo({
          nickname: loginData.user?.nickname || loginData.nickname || loginData.data?.nickname || '水晶用户',
          phone: phoneData.user?.phone_number || phoneData?.data?.phone_number || '',
          avatar: loginData.user?.avatar || loginData.avatar || loginData.data?.avatar || ''
        });

        // 获取用户信息
        try {
           console.log('=== 开始查询用户信息 ==='); 
           const profileRes = await Taro.request({
             url: getApiUrl(API_ENDPOINTS.PROFILES),
             method: 'GET',
             header: {
               'accept': 'application/json',
               'X-Login-Token': token,
               'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M'
             }
           });
           
           if (profileRes.statusCode === 200) {
             const profiles = profileRes.data.results || profileRes.data;
             if (Array.isArray(profiles) && profiles.length > 0) {
                 const userProfile = profiles[0];
                 Taro.setStorageSync('userprofileResId', userProfile.id);
                 
                 // 更新本地显示的用户信息（如果接口返回了）
                 if (userProfile.nickname || userProfile.avatar) {
                    setUserInfo(prev => ({
                      ...prev,
                      nickname: userProfile.nickname || prev.nickname,
                      avatar: userProfile.avatar || prev.avatar
                    }));
                 }
             }
           }
        } catch (err) {
          console.error('自动获取用户信息失败', err);
        }

      } else {
        console.log('❌ 不满足已登录条件');
        console.log('token 存在:', !!token);
        console.log('loginData 存在:', !!loginData);
        console.log('hasCompletedGuide:', hasCompletedGuide);
        
        // 确保状态为未登录，修复登录态过期跳转后仍显示已登录界面的问题
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmColor: '#a5864d',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('importcode');
          Taro.removeStorageSync('loginData');
          Taro.removeStorageSync('phoneLoginData');
          Taro.removeStorageSync('hasCompletedGuide');
          setIsLoggedIn(false);
          setUserInfo(null);
          Taro.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  };

  // --- 新增：直接修改资料相关函数 ---

  const uploadAvatar = (filePath) => {
    return new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: 'https://data.tangledup-ai.com/upload?folder=crystal%2Fuserimg',
        filePath: filePath,
        name: 'file',
        header: { 'accept': 'application/json' },
        success: (res) => {
          try {
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            if (data.success && data.file_url) {
              resolve(data.file_url);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (err) {
            reject(err);
          }
        },
        fail: reject
      });
    });
  };

  const updateUserProfile = async (data) => {
    const token = Taro.getStorageSync('importcode');
    return await Taro.request({
      url: getApiUrl(API_ENDPOINTS.USER_ME),
      method: 'PATCH',
      header: {
        'accept': 'application/json',
        'X-Login-Token': token,
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M'
      },
      data: data
    });
  };

  const updateLocalUserInfo = (updates) => {
     setUserInfo(prev => ({ ...prev, ...updates }));
     
     const loginData = Taro.getStorageSync('loginData') || {};
     if (loginData.user) {
       Object.assign(loginData.user, updates);
     }
     if (updates.nickname) loginData.nickname = updates.nickname;
     if (updates.avatar) loginData.avatar = updates.avatar;
     if (loginData.data) {
        Object.assign(loginData.data, updates);
     }
     Taro.setStorageSync('loginData', loginData);
  };

  const onChooseAvatarDirect = async (e) => {
    const avatarUrl = e.detail.avatarUrl;
    if (!avatarUrl) return;

    try {
      Taro.showLoading({ title: '上传头像中...' });
      const uploadedUrl = await uploadAvatar(avatarUrl);
      
      Taro.showLoading({ title: '保存中...' });
      const res = await updateUserProfile({ avatar: uploadedUrl });
      
      Taro.hideLoading();
      if (res.statusCode === 200 || res.statusCode === 204) {
         updateLocalUserInfo({ avatar: uploadedUrl });
         Taro.showToast({ title: '修改成功', icon: 'success' });
      } else {
         Taro.showToast({ title: '修改失败', icon: 'none' });
      }
    } catch (err) {
      Taro.hideLoading();
      console.error('修改头像失败:', err);
      Taro.showToast({ title: '修改失败', icon: 'none' });
    }
  };

  const onNicknameBlurDirect = async (e) => {
    const val = e.detail.value;
    if (!val) return; 
    if (val === userInfo?.nickname) return;

    try {
      Taro.showLoading({ title: '保存中...' });
      const res = await updateUserProfile({ nickname: val });
      
      Taro.hideLoading();
      if (res.statusCode === 200 || res.statusCode === 204) {
         updateLocalUserInfo({ nickname: val });
         Taro.showToast({ title: '修改成功', icon: 'success' });
      } else {
         setNickname(userInfo?.nickname || ''); 
         Taro.showToast({ title: '修改失败', icon: 'none' });
      }
    } catch (err) {
      Taro.hideLoading();
      setNickname(userInfo?.nickname || '');
      console.error('修改昵称失败:', err);
      Taro.showToast({ title: '修改失败', icon: 'none' });
    }
  };
  
  // ------------------------------------

  const handleChooseAvatar = (e) => {
    console.log('=== 选择头像回调触发 ===');
    console.log('事件类型:', e.type);
    console.log('事件对象:', JSON.stringify(e, null, 2));
    console.log('e.detail:', e.detail);
    
    // 获取 avatarUrl
    const avatarUrl = e.detail.avatarUrl;
    console.log('avatarUrl:', avatarUrl);
    
    if (avatarUrl) {
      console.log('✅ 成功获取头像 URL:', avatarUrl);
      
      // 先显示临时头像，提升体验
      setTempUserInfo(prev => ({
        ...prev,
        avatar: avatarUrl
      }));
      
      // 上传头像到服务器
      Taro.showLoading({
        title: '上传头像中...',
        mask: true
      });

      Taro.uploadFile({
        url: 'https://data.tangledup-ai.com/upload?folder=crystal%2Fuserimg',
        filePath: avatarUrl,
        name: 'file',
        header: {
          'accept': 'application/json'
          // Content-Type 由 uploadFile 自动处理
        },
        success: (res) => {
          Taro.hideLoading();
          console.log('上传响应:', res);
          try {
            // uploadFile 返回的 data 是字符串
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            
            if (data.success && data.file_url) {
              console.log('✅ 头像上传成功, URL:', data.file_url);
              setTempUserInfo(prev => ({
                ...prev,
                avatar: data.file_url
              }));
              
              Taro.showToast({
                title: '上传成功',
                icon: 'success',
                duration: 1000
              });
            } else {
              console.error('❌ 头像上传失败:', data);
              Taro.showToast({
                title: data.message || '上传失败',
                icon: 'none'
              });
            }
          } catch (err) {
            console.error('❌ 解析上传响应失败:', err);
            Taro.showToast({
              title: '上传异常',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          Taro.hideLoading();
          console.error('❌ 上传请求失败:', err);
          Taro.showToast({
            title: '网络错误',
            icon: 'none'
          });
        }
      });

    } else {
      console.error('❌ 未能获取到 avatarUrl');
    }
  };

  const onNicknameInput = (e) => {
    console.log('=== 昵称输入回调 ===');
    console.log('完整事件对象:', e);
    console.log('e.detail:', e.detail);
    
    const nickname = e.detail.value;
    console.log('输入的昵称:', nickname);
    
    setTempUserInfo(prev => {
      const newInfo = {
        ...prev,
        nickname: nickname
      };
      console.log('更新后的 tempUserInfo:', newInfo);
      return newInfo;
    });
  };

  const handleShowProfile = async () => {
    try {
      let profileId = Taro.getStorageSync('userprofileResId');
      const token = Taro.getStorageSync('importcode');

      if (!token) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      Taro.showLoading({ title: '加载中...' });

      // 如果没有 profileId，尝试先获取列表
      if (!profileId) {
        console.log('未找到 profileId，尝试重新获取...');
        const listRes = await Taro.request({
          url: getApiUrl(API_ENDPOINTS.PROFILES),
          method: 'GET',
          header: {
            'accept': 'application/json',
            'X-Login-Token': token,
            'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M'
          }
        });

        if (listRes.statusCode === 200) {
          const profiles = listRes.data.results || listRes.data;
          if (Array.isArray(profiles) && profiles.length > 0) {
            profileId = profiles[0].id;
            Taro.setStorageSync('userprofileResId', profileId);
          } else {
             Taro.hideLoading();
             // 如果真的没有资料，引导去填写
             Taro.showModal({
                title: '提示',
                content: '您尚未填写个人资料，是否前往填写？',
                success: (res) => {
                  if (res.confirm) {
                    Taro.navigateTo({ url: '/pages/LoginGuide/index' });
                  }
                }
             });
             return;
          }
        } else {
           Taro.hideLoading();
           Taro.showToast({ title: '获取资料失败', icon: 'none' });
           return;
        }
      }

      // 获取详情
      const res = await Taro.request({
        url: getApiUrl(`${API_ENDPOINTS.PROFILES}${profileId}/`),
        method: 'GET',
        header: {
          'accept': 'application/json',
          'X-Login-Token': token,
          'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M'
        }
      });

      Taro.hideLoading();

      if (res.statusCode === 200) {
        setProfileDetailData(res.data);
        setShowProfileDetailModal(true);
      } else {
        Taro.showToast({ title: '获取详情失败', icon: 'none' });
      }
    } catch (error) {
      Taro.hideLoading();
      console.error('获取个人资料出错:', error);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    }
  };

  const handleSaveProfile = async () => {
    if (!tempUserInfo.avatar && !tempUserInfo.nickname) {
      Taro.showToast({
        title: '请完善信息',
        icon: 'none'
      });
      return;
    }

    try {
      Taro.showLoading({ title: '保存中...' });
      const token = Taro.getStorageSync('importcode');
      
      // 准备请求数据
      const updateData = {};
      if (tempUserInfo.nickname) updateData.nickname = tempUserInfo.nickname;
      if (tempUserInfo.avatar) updateData.avatar = tempUserInfo.avatar;

      console.log('开始更新用户信息:', updateData);

      const res = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.USER_ME),
        method: 'PATCH',
        header: {
          'accept': 'application/json',
          'X-Login-Token': token,
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M'
        },
        data: updateData
      });

      Taro.hideLoading();
      console.log('更新用户信息响应:', res);

      if (res.statusCode === 200 || res.statusCode === 204) {
        // 更新成功
        const updatedUserInfo = {
          ...userInfo,
          ...updateData
        };

        // 更新本地状态
        setUserInfo(updatedUserInfo);

        // 更新本地存储
        const loginData = Taro.getStorageSync('loginData') || {};
        
        // 深度更新 loginData.user
        if (loginData.user) {
          loginData.user.nickname = updatedUserInfo.nickname;
          loginData.user.avatar = updatedUserInfo.avatar;
        }
        
        // 兼容旧结构
        loginData.nickname = updatedUserInfo.nickname;
        loginData.avatar = updatedUserInfo.avatar;
        if (loginData.data) {
          loginData.data.nickname = updatedUserInfo.nickname;
          loginData.data.avatar = updatedUserInfo.avatar;
        }
        
        Taro.setStorageSync('loginData', loginData);

        Taro.showToast({
          title: '保存成功',
          icon: 'success'
        });

        setShowEditModal(false);
      } else {
        console.error('更新失败:', res.data);
        Taro.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      Taro.hideLoading();
      console.error('更新用户信息出错:', error);
      Taro.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  };

  const handleEditProfile = () => {
    if (profileDetailData) {
      // Store current profile data for editing
      Taro.setStorageSync('tempEditingProfile', profileDetailData);
      setShowProfileDetailModal(false);
      Taro.navigateTo({
        url: '/pages/LoginGuide/index?mode=edit'
      });
    }
  };

  return (
    <View className={`flex-col justify-start ${styles['page']} ${styles['page-logged-in']} ${props.className}`}>
      {/* 个人信息编辑弹窗 */}
      {showEditModal && (
        <View className={styles['modal-overlay']}>
          <View className={styles['modal-content']}>
            <View className={styles['modal-title']}>更新个人资料</View>
            
            <View className={styles['avatar-section']}>
              <Button 
                className={styles['avatar-choose-btn']}
                openType="chooseAvatar"
                onChooseAvatar={handleChooseAvatar}
              >
                {tempUserInfo.avatar ? (
                  <Image 
                    src={tempUserInfo.avatar} 
                    className={styles['avatar-img']}
                    mode="aspectFill"
                  />
                ) : (
                  <Text className={styles['avatar-tip']}>点击选择头像</Text>
                )}
              </Button>
            </View>

            <View className={styles['input-group']}>
              <Text className={styles['input-label']}>昵称</Text>
              <Input
                type="nickname"
                className={styles['nickname-input']}
                placeholder="请输入昵称"
                value={tempUserInfo.nickname}
                onInput={onNicknameInput}
                onBlur={onNicknameInput}
              />
            </View>

            <View className={styles['modal-footer']}>
              <View 
                className={`${styles['modal-btn']} ${styles['btn-cancel']}`}
                onClick={() => setShowEditModal(false)}
              >
                取消
              </View>
              <View 
                className={`${styles['modal-btn']} ${styles['btn-confirm']}`}
                onClick={handleSaveProfile}
              >
                保存
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 个人资料详情弹窗 */}
      {showProfileDetailModal && profileDetailData && (
        <View className={styles['modal-overlay']}>
          <View className={styles['modal-content']}>
            <View className={styles['modal-title']}>个人资料</View>
            
            <ScrollView scrollY className={styles['profile-scroll']}>
              <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}> 出生日期</Text>
                <Text className={styles['profile-value']}>{profileDetailData.birth_date || '未填写'}</Text>
              </View>
               <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>🕒 出生时间</Text>
                <Text className={styles['profile-value']}>{profileDetailData.birth_time || '未填写'}</Text>
              </View>
              <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>🧩 MBTI</Text>
                <Text className={styles['profile-value']}>{profileDetailData.mbti_type || '未填写'}</Text>
              </View>
              <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>🌟 星座</Text>
                <Text className={styles['profile-value']}>{profileDetailData.zodiac || '未填写'}</Text>
              </View>
              <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>❤️ 情感状态</Text>
                <Text className={styles['profile-value']}>
                  {profileDetailData.relationship_status === 'single' ? '单身贵族' :
                   profileDetailData.relationship_status === 'dating' ? '暧昧接触' :
                   profileDetailData.relationship_status === 'in_love' ? '恋爱中' :
                   profileDetailData.relationship_status === 'married' ? '已婚' :
                   profileDetailData.relationship_status === 'complicated' ? '关系复杂' :
                   profileDetailData.relationship_status === 'healing' ? '疗愈期' :
                   profileDetailData.relationship_status || '未填写'}
                </Text>
              </View>
              <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>💼 职业</Text>
                <Text className={styles['profile-value']}>{profileDetailData.occupation || '未填写'}</Text>
              </View>
              <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>✍️ 个性签名</Text>
                <Text className={styles['profile-value']}>{profileDetailData.signature || '未填写'}</Text>
              </View>
              <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>📖 故事</Text>
                <Text className={styles['profile-value']}>{profileDetailData.story || '未填写'}</Text>
              </View>
               <View className={styles['profile-item']}>
                <Text className={styles['profile-label']}>🎯 关注领域</Text>
                <Text className={styles['profile-value']}>
                  {(() => {
                    const areas = profileDetailData.focus_areas;
                    if (!areas) return '未填写';
                    const keys = Array.isArray(areas) ? areas : Object.keys(areas);
                    return keys.length > 0 ? keys.map(item => FOCUS_AREAS_MAP[item] || item).join('、') : '未填写';
                  })()}
                </Text>
              </View>
            </ScrollView>

            <View className={styles['modal-footer']}>
              <View 
                className={`${styles['modal-btn']} ${styles['btn-cancel']}`}
                onClick={() => setShowProfileDetailModal(false)}
              >
                关闭
              </View>
              <View 
                className={`${styles['modal-btn']} ${styles['btn-confirm']}`}
                onClick={handleEditProfile}
              >
                编辑资料
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 页面内容 - 始终显示列表布局 */}
      <View className={`flex-col ${styles['logged-in-container']}`}>
        {/* 用户信息卡片 */}
        <View 
          className={`flex-col ${styles['user-card']}`}
          onClick={!isLoggedIn ? navigateToLogin : undefined}
        >
          <View className={`flex-row items-center ${styles['user-info']}`}>
            {isLoggedIn ? (
              <Button 
                className={`${styles['avatar-wrapper']}`}
                style={{ margin: 0, padding: 0, width: '120px', height: '120px', background: 'none', border: 'none' }}
                openType="chooseAvatar" 
                onChooseAvatar={onChooseAvatarDirect}
              >
                {userInfo?.avatar ? (
                  <Image 
                    src={userInfo.avatar} 
                    className={`${styles['avatar']}`}
                    mode='aspectFill'
                  />
                ) : (
                  <View className={`${styles['avatar-placeholder']}`}>
                    <Text className={`${styles['avatar-text']}`}>
                      {userInfo?.nickname?.charAt(0) || '水'}
                    </Text>
                  </View>
                )}
              </Button>
            ) : (
              <View className={`${styles['avatar-wrapper']}`}>
                <View className={`${styles['avatar-placeholder']}`}>
                  <Text className={`${styles['avatar-text']}`}>?</Text>
                </View>
              </View>
            )}

            <View className={`flex-col ${styles['user-details']}`}>
              {isLoggedIn ? (
                <Input
                  type="nickname"
                  className={`${styles['user-nickname']}`}
                  value={nickname}
                  onInput={(e) => setNickname(e.detail.value)}
                  onBlur={onNicknameBlurDirect}
                  placeholder="点击设置昵称"
                  placeholderStyle="color: #999"
                />
              ) : (
                <Text className={`${styles['user-nickname']}`}>点击登录</Text>
              )}
              {isLoggedIn && userInfo?.phone && (
                <Text className={`${styles['user-phone']}`}>{userInfo.phone}</Text>
              )}
            </View>
            
          </View>
        </View>

        {/* 功能菜单 */}
        <View className={`flex-col ${styles['menu-section']}`}>
          <View 
            className={`flex-row items-center ${styles['menu-item']}`}
            onClick={() => {
              if (!isLoggedIn) {
                Taro.showToast({ title: '请先登录', icon: 'none' });
              } else {
                Taro.navigateTo({ url: '/pages/ActivateCrystal/index' });
              }
            }}
          >
            <Text className={`${styles['menu-icon']}`}>🔮</Text>
            <Text className={`${styles['menu-text']}`}>激活水晶</Text>
            <Text className={`${styles['menu-arrow']}`}>›</Text>
          </View>

          <View className={`${styles['menu-divider']}`}></View>

          <View 
            className={`flex-row items-center ${styles['menu-item']}`}
            onClick={() => {
              if (!isLoggedIn) {
                Taro.showToast({ title: '请先登录', icon: 'none' });
              } else {
                handleShowProfile();
              }
            }}
          >
            <Text className={`${styles['menu-icon']}`}>📝</Text>
            <Text className={`${styles['menu-text']}`}>个人资料</Text>
            <Text className={`${styles['menu-arrow']}`}>›</Text>
          </View>
        </View>

        {/* 底部按钮：仅已登录时显示退出登录 */}
        <View className={`flex-col ${styles['logout-section']}`}>
          {isLoggedIn && (
            <View 
              className={`flex-col justify-start items-center ${styles['logout-button']}`}
              onClick={handleLogout}
            >
              <Text className={`${styles['logout-text']}`}>退出登录</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

My.defaultProps = { className: '' };
