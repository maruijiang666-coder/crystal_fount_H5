import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.css'

if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
  const hostname = window.location?.hostname || ''
  const isLocalH5 =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '6.6.6.123' ||
    hostname === '192.168.1.2'

  window.__API_BASE_URL__ = isLocalH5 ? '' : API_BASE_URL
}

class App extends Component {

  resizeHandler = null

  syncH5Viewport = () => {
    if (process.env.TARO_ENV !== 'h5' || typeof window === 'undefined') {
      return
    }

    const docEl = window.document.documentElement
    const body = window.document.body
    const bodyWidth = body ? body.getBoundingClientRect().width : 0
    const viewportWidth = Math.min(
      docEl.getBoundingClientRect().width || window.innerWidth || 375,
      bodyWidth || window.innerWidth || 375,
      window.innerWidth || 375
    )
    const safeWidth = Math.max(320, Math.min(viewportWidth, 540))
    const rootFontSize = (safeWidth / 375) * 20
    const viewportHeight = window.innerHeight || docEl.clientHeight || 667

    docEl.style.fontSize = `${rootFontSize}px`
    docEl.style.setProperty('--app-font-size', `${rootFontSize}px`)
    docEl.style.setProperty('--app-safe-width', `${safeWidth}px`)
    docEl.style.setProperty('--app-vh', `${viewportHeight * 0.01}px`)
  }

  // 全局数据
  globalData = {
    ossBaseUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/'
  }

  componentDidMount () {
    this.syncH5Viewport()

    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      this.resizeHandler = () => this.syncH5Viewport()
      window.addEventListener('resize', this.resizeHandler)
      window.addEventListener('orientationchange', this.resizeHandler)
      window.addEventListener('pageshow', this.resizeHandler)
    }

    // 添加请求拦截器，打印所有 API 请求和响应
    Taro.addInterceptor((chain) => {
      const requestParams = chain.requestParams
      const { method, data, url, header } = requestParams
      
      console.log(`🚀 [Request] ${method || 'GET'} ${url}`)
      if (header) console.log('Headers:', header)
      if (data) console.log('Data:', data)

      return chain.proceed(requestParams)
        .then(res => {
          console.log(`✅ [Response] ${method || 'GET'} ${url}`, res)
          
          // 统一处理登录态过期 (401 或 403)
          if (res.statusCode === 401 || res.statusCode === 403) {
            console.warn('登录态过期，仅清除本地登录信息，不强制跳转');
            
            // 清除本地存储的登录信息
            Taro.removeStorageSync('importcode');
            Taro.removeStorageSync('loginData');
            Taro.removeStorageSync('phoneLoginData');
            Taro.removeStorageSync('hasCompletedGuide');
            
            // 不再强制跳转，允许用户浏览部分页面
            // 具体的跳转逻辑交由各页面的交互按钮来处理
          }

          return res
        })
        .catch(err => {
          console.error(`❌ [Error] ${method || 'GET'} ${url}`, err)
          return Promise.reject(err)
        })
    })
  }

  componentDidShow () {
    this.syncH5Viewport()
  }

  componentWillUnmount () {
    if (this.resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler)
      window.removeEventListener('orientationchange', this.resizeHandler)
      window.removeEventListener('pageshow', this.resizeHandler)
    }
  }

  componentDidHide () {}

  componentDidCatchError () {}

  // this.props.children 是将要会渲染的页面
  render () {
    return this.props.children
  }
}

export default App
