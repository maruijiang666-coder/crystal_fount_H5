import Taro from '@tarojs/taro';

/**
 * 检查水晶是否已激活
 * @returns {boolean} 是否已激活
 */
export const checkCrystalActivation = () => {
  const importcode = Taro.getStorageSync('importcode');
  if (!importcode) {
    Taro.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 1500
    });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/My/index' });
    }, 1500);
    return false;
  }

  const nfcTagId = Taro.getStorageSync('nfc_tag_id');
  if (!nfcTagId) {
    Taro.showModal({
      title: '提示',
      content: '您尚未激活水晶，请先去激活',
      confirmText: '去激活',
      confirmColor: '#d6a207',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({
            url: '/pages/ActivateCrystal/index'
          });
        }
      }
    });
    return false;
  }
  
  return true;
};
