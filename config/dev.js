module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    // 本地 Docker 后端
    API_BASE_URL: '"http://localhost:8011"'
  },
  mini: {},
  h5: {
    devServer: {
      host: '0.0.0.0',
      port: 10086,
      public: 'localhost:10086',
      disableHostCheck: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8011',
          changeOrigin: true
        }
      }
    }
  }
}
