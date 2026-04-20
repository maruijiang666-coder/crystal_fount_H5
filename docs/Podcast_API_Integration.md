# 塔罗水晶运势播客 API 集成文档

## 1. 概述
本模块用于展示塔罗水晶运势的音频播客，并支持字幕同步显示。

## 2. 接口定义

### 2.1 获取播客数据
- **URL**: `https://crystal.quant-speed.com/api/yunshi/fortune/podcast/`
- **Method**: `GET`
- **Headers**:
  - `X-API-Key`: `123quant-speed` (测试环境/未登录)
  - `X-Login-Token`: `<LOGIN_TOKEN>` (正式环境/微信登录用户)
    - *注：系统会自动检查本地存储 `login_token`，若存在则优先使用。*

### 2.2 响应结构
```json
{
  "status": "finish",
  "audio_url": "/media/yunshi_mp3/fortune_report_11.mp3",
  "file_size": 3204882,
  "report_date": "2026-01-03T21:05:46"
}
```

### 2.3 资源处理逻辑
- **音频地址**: 
  - 接口返回的是相对路径 (如 `/media/...`)。
  - 前端自动拼接 Base URL: `https://crystal.quant-speed.com`。
  - 最终地址示例: `https://crystal.quant-speed.com/media/yunshi_mp3/fortune_report_11.mp3`
  - *注：原需求中提到的 `docs/swagger/` 前缀经测试无效 (404)，故采用标准 Base URL。*

- **字幕地址**:
  - 字幕文件与音频文件同名，扩展名为 `.json`。
  - 生成逻辑: 将音频 URL 的 `.mp3` 后缀替换为 `.json`。
  - 示例: `https://crystal.quant-speed.com/media/yunshi_mp3/fortune_report_11.json`

## 3. 字幕数据结构
JSON 格式，包含多个对话片段：
```json
[
  {
    "round_id": 0,
    "text": "对话内容...",
    "speaker": "zh_male_...",  // 包含 'male' 或 'female' 标识性别
    "start_time_ms": 7080,     // 开始时间 (毫秒)
    "duration_ms": 11736       // 持续时间 (毫秒)
  },
  ...
]
```

## 4. 异常处理
- **403 Forbidden**: 认证失败，需检查 API Key 或 Token。
- **404 Not Found**: 资源不存在。
- **Network Error**: 网络请求失败，前端会有 Toast 提示。
