import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.css'

class App extends Component {

  // 全局数据
  globalData = {
    ossBaseUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/'
  }

  componentDidMount () {
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

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  // this.props.children 是将要会渲染的页面
  render () {
    return this.props.children
  }
}

export default App
