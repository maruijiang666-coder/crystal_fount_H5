export default {
  pages: [
    //  'pages/Loading/index',
    'pages/SJShouYe/SJShouYe',
    'pages/Podcast/index',
    'pages/NFCTouch/index',
    'pages/ActivateCrystal/index',
    'pages/Loading/index',
    'pages/xiangxi/xiangxi',
    'pages/yunshi/yunshi',
    'pages/haoyun/index',
    'pages/TaLuo/index',
    'pages/TaLuoAnswer/index',
    'pages/FontDemo/FontDemo',
    'pages/FontCheck/FontCheck',
    'pages/TanChuang/index',
    'pages/Pokedex/index',
    'pages/AllRecommendations/index',
    'pages/My/index',
    'pages/Login/index',
    'pages/LoginGuide/index',
    'pages/Agreement/index',
    'pages/Privacy/index',
    'pages/MbtiTest/index',
    'pages/match/index',
    'pages/matchReport/index'
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#f8f8f8ff',
    backgroundColor: '#111313',

    list: [
      {
        pagePath: 'pages/SJShouYe/SJShouYe',
        text: '首页',
        iconPath: 'assets/img/SJSY.png',
        selectedIconPath: 'assets/img/SJSY_active.png',
      },
      {
        pagePath: 'pages/xiangxi/xiangxi',
        text: '水晶',
        iconPath: 'assets/img/SJ.png',
        selectedIconPath: 'assets/img/SJ_active.png',
      },
      {
        pagePath: 'pages/haoyun/index',
        text: '好运',
        iconPath: 'assets/img/haoyun.png',
        selectedIconPath: 'assets/img/haoyun_active.png',
      },
      {
        pagePath: 'pages/My/index',
        text: '我的',
        iconPath: 'assets/img/my.png',
        selectedIconPath: 'assets/img/my_active.png',
      }
    ]
  }, 
  permission: {
    "scope.nfc": {
      "desc": "用于读取水晶NFC芯片中的数据信息"
    }
  },
  deviceOrientation: "portrait"
};


