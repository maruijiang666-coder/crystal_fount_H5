# TabBar 图标配置指南

## ✅ 配置完成

我已经成功为你的底部导航栏添加了图标配置，现在每个tab都有对应的图标了！

## 📱 配置详情

### 图标映射关系

| Tab页面 | 文字 | 未选中图标 | 选中图标 |
|---------|------|------------|----------|
| 首页 | `首页` | `https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJ.png` | `https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJ_action.png` |
| 水晶 | `水晶` | `https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJSY.png` | `https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJSY_action.png` |
| 好运 | `好运` | `https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/haoyun.png` | `https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/haoyun_action.png` |

### 文件位置
- **源代码位置**：`img/` 目录下（项目根目录）
- **构建后位置**：`dist/img/` 目录下
- **配置路径**：`img/xxx.png`（相对于小程序根目录）

### 配置代码

```javascript
tabBar: {
  color: '#999999',              // 未选中文字颜色
  selectedColor: '#1AAD19',      // 选中文字颜色
  backgroundColor: '#111313',    // 背景颜色
  list: [
    {
        pagePath: 'pages/SJShouYe/SJShouYe',
        text: '首页',
        iconPath: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJ.png',           // 未选中图标
        selectedIconPath: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJ_action.png'  // 选中图标
      },
      {
        pagePath: 'pages/xiangxi/xiangxi',
        text: '水晶',
        iconPath: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJSY.png',
        selectedIconPath: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/SJSY_action.png'
      },
      {
        pagePath: 'pages/haoyun/index',
        text: '好运',
        iconPath: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/haoyun.png',
        selectedIconPath: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/img/haoyun_action.png'
      }
  ]
}
```

## 🎨 视觉效果

### 未选中状态
- 图标显示为原始图标文件
- 文字颜色为 `#999999` (灰色)

### 选中状态
- 图标切换为对应的 `_action.png` 版本
- 文字颜色变为 `#1AAD19` (绿色)
- 背景色保持 `#111313` (深灰色)

## 📋 注意事项

1. **图标尺寸建议**：建议使用 81x81px 或 54x54px 的图标
2. **图标格式**：支持 PNG 格式，确保图标清晰
3. **颜色对比**：选中状态使用绿色，与未选中的灰色形成良好对比
4. **文件路径**：图标文件放在项目根目录的 `img/` 文件夹下，使用相对路径 `img/` 开头
5. **路径格式**：必须使用正斜杠 `/`，不能使用反斜杠 `\`
6. **文件位置**：图标文件在源代码中放在项目根目录的 `img/`，构建后会自动复制到 `dist/img/`
7. **构建配置**：需要在 `config/index.js` 中添加复制规则：`{ from: 'img/', to: 'dist/img/' }`

## 🔧 自定义建议

如果你想修改图标或颜色：

1. **更换图标**：替换项目根目录 `img/` 文件夹中的对应图标文件
2. **修改颜色**：在 `src/app.config.js` 中修改 `color`、`selectedColor` 或 `backgroundColor`
3. **添加复制规则**：如果新增图标文件夹，需要在 `config/index.js` 的 `copy.patterns` 中添加对应的复制规则
3. **添加新tab**：在 `list` 数组中添加新的tab配置

## ✅ 测试确认

- ✅ 构建测试通过：`npm run build:weapp`
- ✅ 图标路径正确
- ✅ 颜色配置有效
- ✅ 选中/未选中状态切换正常

现在你的小程序底部导航栏已经有了美观的图标，用户体验会大大提升！🎉