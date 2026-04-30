module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    // 本地 Docker 后端
    API_BASE_URL: '"https://crystal.quant-speed.com"'
  },
  mini: {},
  h5: {
    devServer: {
      host: '0.0.0.0',
      port: 10086,
      public: '6.6.6.123:10086',
      disableHostCheck: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      proxy: {
        '/api': {
          target: 'https://crystal.quant-speed.com',
          changeOrigin: true
        }
      }
    }
  }
}
