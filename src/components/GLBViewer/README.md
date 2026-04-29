# GLBViewer 组件

用于在小程序中显示 GLB/GLTF 3D 模型的组件。

## 使用方法

```jsx
import GLBViewer from '../../components/GLBViewer';

<GLBViewer
  modelUrl="https://example.com/model.glb"
  width="100%"
  height="500px"
  autoRotate={true}
  rotationSpeed={0.01}
  onLoad={(gltf) => console.log('加载成功', gltf)}
  onError={(error) => console.error('加载失败', error)}
/>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelUrl | string | 必填 | GLB模型的URL地址 |
| width | string | '100%' | 画布宽度 |
| height | string | '500px' | 画布高度 |
| autoRotate | boolean | true | 是否自动旋转 |
| rotationSpeed | number | 0.01 | 旋转速度 |
| cameraZ | number | 5 | 相机Z轴位置 |
| cameraY | number | 1 | 相机Y轴位置 |
| backgroundColor | number | 0x1a1a2e | 背景颜色（十六进制） |
| onLoad | function | null | 模型加载成功回调 |
| onError | function | null | 模型加载失败回调 |

## 注意事项

1. 需要在 `project.config.json` 中设置 `urlCheck: false` 或在微信开发者工具中关闭域名校验
2. 正式发布时需要在微信公众平台后台配置模型URL的域名白名单
3. 组件会自动计算模型大小并居中显示
4. 支持自动旋转动画

## 示例

查看 `src/pages/3Dtest/index.jsx` 获取完整示例。
