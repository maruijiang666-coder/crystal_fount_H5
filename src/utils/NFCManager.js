import Taro from '@tarojs/taro';

/**
 * NFCManager
 * 全局单例 NFC 管理器
 * 
 * 职责：
 * 1. 维护唯一的 NFC Adapter 实例
 * 2. 统一管理 startDiscovery / stopDiscovery，避免资源竞争
 * 3. 实现订阅/发布模式，将 NFC 事件分发给当前活跃的页面
 * 4. 屏蔽安卓/iOS 差异及错误处理
 */
class NFCManager {
  constructor() {
    this.adapter = null;
    this.activeListener = null; // 当前活跃的监听回调
    this.isScanning = false;    // 内部状态标记
    this.initAdapter();
  }

  initAdapter() {
    try {
      this.adapter = Taro.getNFCAdapter();
      if (!this.adapter) {
        console.warn('[NFCManager] 当前设备不支持NFC或API不可用');
      } else {
        // 注册底层的全局监听器
        // 注意：这个监听器在小程序生命周期内只注册一次，永远不移除
        this.adapter.onDiscovered((res) => {
          this.handleDiscovered(res);
        });
      }
    } catch (e) {
      console.error('[NFCManager] 初始化失败:', e);
    }
  }

  /**
   * 页面调用此方法来“接管”NFC监听
   * @param {Function} callback - (res) => void
   */
  takeOver(callback) {
    console.log('[NFCManager] 页面接管监听:', callback ? 'Success' : 'Null');
    this.activeListener = callback;
    
    // 确保扫描已启动
    if (!this.isScanning) {
      this.startDiscovery();
    }
  }

  /**
   * 页面离开或不再需要监听时调用
   */
  release() {
    console.log('[NFCManager] 页面释放监听');
    this.activeListener = null;
    
    // 策略选择：
    // 1. 立即停止扫描（省电，但下次启动有延迟）
    // 2. 保持扫描（响应快，但耗电）
    // 这里选择策略1：如果没人监听了，就停止扫描，但为了避免频繁启停，可以加个防抖（暂不加，先保持简单）
    // 考虑到页面切换间隔很短，我们暂时不立即 stop，或者延迟 stop。
    // 为了稳健性，我们暂时选择：不主动 stopDiscovery，除非显式调用 stopAll。
    // 这样页面切换时，底层依然在跑，只是回调指向了空，真正做到了无缝切换。
  }

  /**
   * 内部使用的事件分发
   */
  handleDiscovered(res) {
    if (this.activeListener) {
      // console.log('[NFCManager] 分发事件给活跃监听者');
      this.activeListener(res);
    } else {
      console.log('[NFCManager] 收到NFC事件但无活跃监听者，忽略');
    }
  }

  /**
   * 启动 NFC 扫描
   */
  startDiscovery() {
    if (!this.adapter) {
      this.initAdapter();
      if (!this.adapter) return;
    }

    console.log('[NFCManager] 请求启动扫描...');
    
    this.adapter.startDiscovery({
      success: () => {
        console.log('[NFCManager] 扫描启动成功');
        this.isScanning = true;
      },
      fail: (err) => {
        console.error('[NFCManager] 扫描启动失败:', err);
        // 错误码处理
        if (err.errCode === 13000) {
           console.warn('设备不支持NFC');
        } else if (err.errCode === 13001) {
           console.warn('系统NFC未开启');
        } else {
           // 其他错误，假设可能已经在运行，标记为 true 以便后续分发
           // 比如 errCode 13006 (资源已占用/正在运行)
           console.log('[NFCManager] 假设扫描已在后台运行');
           this.isScanning = true; 
        }
      }
    });
  }

  /**
   * 停止扫描（通常在小程序切后台或彻底退出功能时调用）
   */
  stopDiscovery() {
    if (!this.adapter) return;
    
    console.log('[NFCManager] 请求停止扫描');
    this.adapter.stopDiscovery({
      complete: () => {
        console.log('[NFCManager] 扫描已停止');
        this.isScanning = false;
      }
    });
  }
}

// 导出单例
const nfcManager = new NFCManager();
export default nfcManager;
