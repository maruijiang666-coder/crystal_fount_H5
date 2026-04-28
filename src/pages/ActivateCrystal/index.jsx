import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.css';
import { getOssImageUrl } from '../../utils/config';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';

const DEFAULT_CSRF_TOKEN = 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M';

const NFC_URL_PREFIX_MAP = {
  0x00: '',
  0x01: 'http://www.',
  0x02: 'https://www.',
  0x03: 'http://',
  0x04: 'https://'
};

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

function bytesFromDataView(data) {
  if (!data) return new Uint8Array();
  if (data instanceof DataView) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return new Uint8Array();
}

function decodeBytes(bytes) {
  if (!bytes || !bytes.length) return '';
  if (textDecoder) {
    try {
      return textDecoder.decode(bytes);
    } catch (err) {}
  }

  let raw = '';
  for (let i = 0; i < bytes.length; i += 1) {
    raw += String.fromCharCode(bytes[i]);
  }

  try {
    return decodeURIComponent(escape(raw));
  } catch (err) {
    return raw;
  }
}

function parseWebNfcRecord(record) {
  if (!record) return '';

  const bytes = bytesFromDataView(record.data);
  if (!bytes.length) return '';

  if (record.recordType === 'url') {
    const prefix = NFC_URL_PREFIX_MAP[bytes[0]] || '';
    return `${prefix}${decodeBytes(bytes.slice(1))}`.trim();
  }

  if (record.recordType === 'text') {
    const langLength = bytes[0] & 0x3f;
    if (bytes.length > 1 + langLength) {
      return decodeBytes(bytes.slice(1 + langLength)).trim();
    }
  }

  return decodeBytes(bytes).trim();
}

function extractNfcIdentifier(content) {
  if (!content) return '';

  const value = String(content).trim();
  if (!value) return '';

  const snMatch = value.match(/[?&]sn=([^&]+)/i);
  if (snMatch && snMatch[1]) {
    try {
      return decodeURIComponent(snMatch[1]);
    } catch (err) {
      return snMatch[1];
    }
  }

  const kvMatch = value.match(/^(?:sn|id|tag_id|tagId|nfc_tag_id)\s*[:=]\s*(.+)$/i);
  if (kvMatch && kvMatch[1]) {
    return kvMatch[1].trim();
  }

  return value;
}

function getPhoneNumberFromStorage() {
  const loginData = Taro.getStorageSync('loginData') || {};
  return (
    loginData?.user?.phone_number ||
    loginData?.data?.phone_number ||
    loginData?.phone_number ||
    ''
  );
}

function getErrorMessage(error, fallback = '请求失败，请重试') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.data?.message ||
    error?.data?.detail ||
    error?.message ||
    fallback
  );
}

export default function ActivateCrystal() {
  const router = Taro.useRouter();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('点击“激活 NFC”后，将手机贴近水晶');
  const [isWebNfcSupported, setIsWebNfcSupported] = useState(false);
  const [isReadingWebNfc, setIsReadingWebNfc] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [parsedRecords, setParsedRecords] = useState([]);
  const [manualKey, setManualKey] = useState('');
  const [isSubmittingManualKey, setIsSubmittingManualKey] = useState(false);
  const [manualKeyFocused, setManualKeyFocused] = useState(false);
  const [activationResult, setActivationResult] = useState(null);
  const webNfcReaderRef = useRef(null);
  const activationLockRef = useRef(false);
  const autoActivationAttemptedRef = useRef(false);

  const stopWebNfcScan = () => {
    const reader = webNfcReaderRef.current;
    if (reader) {
      reader.onreading = null;
      reader.onreadingerror = null;
    }
    webNfcReaderRef.current = null;
    setIsReadingWebNfc(false);
  };

  const checkWebNfcSupport = () => {
    return (
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      'NDEFReader' in window
    );
  };

  const checkUserActivation = async (targetNfcId) => {
    try {
      const res = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.ACTIVATE_CRYSTAL_USER_TAGS),
        method: 'GET',
        header: {
          accept: 'application/json',
          'X-Login-Token': Taro.getStorageSync('importcode'),
          'X-CSRFTOKEN': DEFAULT_CSRF_TOKEN
        }
      });

      const results = res.data?.results || res.data?.data?.results || [];
      if (res.statusCode === 200 && Array.isArray(results)) {
        return results.some((item) => {
          return item?.crystal_tag?.nfc_tag_id === targetNfcId;
        });
      }
    } catch (error) {
      console.error('Check activation failed:', error);
    }

    return false;
  };

  const activateCrystalById = async (nfcId) => {
    if (!nfcId || activationLockRef.current) {
      return;
    }

    activationLockRef.current = true;
    try {
      const phoneNumber = getPhoneNumberFromStorage();
      if (!phoneNumber) {
        setStatus('error');
        setMessage('未找到用户手机号，请先登录');
        Taro.showToast({ title: '未找到用户手机号，请先登录', icon: 'none' });
        return;
      }

      setStatus('reading');
      setMessage('正在校验水晶状态...');
      setCurrentContent(nfcId);

      const alreadyActivated = await checkUserActivation(nfcId);
      if (alreadyActivated) {
        setStatus('success');
        setMessage('该水晶已激活');
        setActivationResult({ already: true, nfc_tag_id: nfcId });
        Taro.setStorageSync('nfc_tag_id', nfcId);
        return;
      }

      setMessage('正在激活水晶...');
      const response = await Taro.request({
        url: getApiUrl(API_ENDPOINTS.ACTIVATE_CRYSTAL),
        method: 'POST',
        header: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Login-Token': Taro.getStorageSync('importcode'),
          'X-CSRFTOKEN': DEFAULT_CSRF_TOKEN
        },
        data: {
          phone_number: phoneNumber,
          nfc_tag_id: nfcId
        }
      });

      const responseData = response.data?.data || response.data || {};
      const isSuccess =
        response.statusCode === 200 ||
        response.statusCode === 201 ||
        responseData?.code === 0;

      if (isSuccess) {
        setStatus('success');
        setMessage('激活成功！');
        setActivationResult(responseData);
        Taro.setStorageSync('nfc_tag_id', nfcId);
        return;
      }

      const detail =
        response.data?.message ||
        response.data?.detail ||
        responseData?.message ||
        '激活失败，请重试';
      setStatus('error');
      setMessage(detail);
      Taro.showToast({ title: detail, icon: 'none' });
    } catch (error) {
      const detail = getErrorMessage(error, '网络连接失败');
      console.error('Activate crystal failed:', error);
      setStatus('error');
      setMessage(detail);
      Taro.showToast({ title: detail, icon: 'none' });
    } finally {
      activationLockRef.current = false;
    }
  };

  const handleManualActivate = async () => {
    const key = manualKey.trim();
    if (!key) {
      Taro.showToast({ title: '请输入密钥', icon: 'none' });
      return;
    }

    if (isSubmittingManualKey || activationLockRef.current) {
      return;
    }

    setIsSubmittingManualKey(true);
    try {
      await activateCrystalById(key);
    } finally {
      setIsSubmittingManualKey(false);
    }
  };

  const handleManualKeyChange = (e) => {
    const value =
      e?.detail?.value ??
      e?.target?.value ??
      e?.currentTarget?.value ??
      '';
    setManualKey(value);
  };

  const handleWebNfcReading = async (event) => {
    try {
      const records = event?.message?.records || [];
      const contents = records.map(parseWebNfcRecord).filter(Boolean);
      const readableContent = contents.join('\n').trim();

      setParsedRecords(contents);
      setCurrentContent(readableContent);

      if (!readableContent) {
        setStatus('error');
        setMessage('已读取到 NFC，但未解析出可用内容');
        Taro.showToast({ title: '未识别到可用内容', icon: 'none' });
        stopWebNfcScan();
        return;
      }

      const nfcId = extractNfcIdentifier(readableContent);
      stopWebNfcScan();
      await activateCrystalById(nfcId || readableContent);
    } catch (error) {
      const detail = getErrorMessage(error, '读取 NFC 失败');
      console.error('Web NFC reading failed:', error);
      setStatus('error');
      setMessage(detail);
      Taro.showToast({ title: detail, icon: 'none' });
      stopWebNfcScan();
    }
  };

  const startWebNfcScan = async () => {
    if (isReadingWebNfc) return;

    const supported = checkWebNfcSupport();
    if (!supported) {
      setStatus('error');
      setMessage('当前浏览器不支持 Web NFC，请使用 Android Chrome 并通过安全环境访问');
      Taro.showToast({ title: '当前浏览器不支持 Web NFC', icon: 'none' });
      return;
    }

    try {
      const reader = new window.NDEFReader();
      webNfcReaderRef.current = reader;
      setIsReadingWebNfc(true);
      setStatus('scanning');
      setMessage('请将手机贴近水晶，等待读取 NFC 内容');

      reader.onreading = (event) => {
        void handleWebNfcReading(event);
      };

      reader.onreadingerror = () => {
        setStatus('error');
        setMessage('读取 NFC 失败，请重新贴近水晶');
        Taro.showToast({ title: '读取 NFC 失败', icon: 'none' });
        stopWebNfcScan();
      };

      await reader.scan();
    } catch (error) {
      const detail = getErrorMessage(error, '启动 NFC 读取失败');
      console.error('Web NFC scan failed:', error);
      setStatus('error');
      setMessage(detail);
      Taro.showToast({ title: detail, icon: 'none' });
      stopWebNfcScan();
    }
  };

  const handleCloseOverlay = () => {
    setActivationResult(null);
    Taro.switchTab({
      url: '/pages/My/index',
      fail: () => {
        Taro.reLaunch({ url: '/pages/My/index' });
      }
    });
  };

  useEffect(() => {
    const supported = checkWebNfcSupport();
    setIsWebNfcSupported(supported);

    if (Taro.getEnv() !== Taro.ENV_TYPE.WEB) {
      setStatus('error');
      setMessage('请在 H5 浏览器中使用 Web NFC');
      return () => {
        stopWebNfcScan();
      };
    }

    setStatus(supported ? 'idle' : 'error');
    setMessage(
      supported
        ? '点击“激活 NFC”后，将手机贴近水晶'
        : '当前浏览器不支持 Web NFC，请使用 Android Chrome 并通过安全环境访问'
    );

    return () => {
      stopWebNfcScan();
    };
  }, []);

  useEffect(() => {
    if (autoActivationAttemptedRef.current) {
      return;
    }

    const rawRouteValue =
      router?.params?.nfc_tag_id ||
      router?.params?.tag_id ||
      router?.params?.tagId ||
      router?.params?.sn ||
      '';

    const resolvedNfcId = extractNfcIdentifier(rawRouteValue);
    if (!resolvedNfcId) {
      return;
    }

    autoActivationAttemptedRef.current = true;
    setManualKey(resolvedNfcId);
    setCurrentContent(resolvedNfcId);
    setStatus('reading');
    setMessage('检测到链接参数，正在自动激活水晶...');
    void activateCrystalById(resolvedNfcId);
  }, [router?.params]);

  return (
    <View className={styles.page}>
      <View className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            className={styles.star}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              '--duration': `${Math.random() * 3 + 2}s`,
              '--delay': `${Math.random() * 2}s`
            }}
          />
        ))}
      </View>

      <View className={styles.header}>
        <View className={styles.statInfo}>
          <View className={styles.mainTitle}>激活水晶</View>
          <View className={styles.subText}>{message}</View>
          {currentContent ? (
            <View className={styles.currentContentCard}>
              <Text className={styles.currentContentLabel}>读取到的内容</Text>
              <Text className={styles.currentContentText}>{currentContent}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className={`${styles.crystalContainer} ${status === 'reading' ? styles.reading : ''}`}>
        <View className={styles.magicRing}></View>
        <View className={styles.glow}></View>
        <Image
          src={getOssImageUrl('SJSY/1e467fc804d0fd434a82a6706adadf24.png')}
          className={styles.crystalImage}
          mode="aspectFit"
        />
        {status === 'reading' && (
          <Text className={styles.floatingText}>Reading NFC...</Text>
        )}
      </View>

      {status === 'scanning' && (
        <View className={styles.scanHintContainer}>
          <View className={styles.phoneIcon}></View>
          <Text className={styles.scanText}>将手机背部贴近水晶</Text>
        </View>
      )}

      <View className={styles.nfcPanel}>
        <Button
          className={`${styles.nfcAction} ${!isWebNfcSupported || isReadingWebNfc ? styles.nfcActionDisabled : ''}`}
          disabled={!isWebNfcSupported || isReadingWebNfc}
          onClick={startWebNfcScan}
        >
          {isReadingWebNfc ? '读取中...' : '激活 NFC'}
        </Button>
        <Text className={styles.nfcTip}>
          {isWebNfcSupported
            ? '请使用支持 Web NFC 的 Android Chrome，并在安全环境下打开页面'
            : '当前浏览器不支持 Web NFC'}
        </Text>
        {parsedRecords.length > 0 && (
          <View className={styles.recordList}>
            {parsedRecords.map((record, index) => (
              <View key={`${record}-${index}`} className={styles.recordItem}>
                <Text className={styles.recordIndex}>{index + 1}</Text>
                <Text className={styles.recordText}>{record}</Text>
              </View>
            ))}
          </View>
        )}

        <View className={styles.manualSection}>
          <Text className={styles.manualTitle}>或输入密钥激活</Text>
          <View className={styles.manualRow}>
            <Input
              className={styles.manualInput}
              type='text'
              maxlength={64}
              value={manualKey}
              focus={manualKeyFocused}
              placeholder='请输入水晶密钥 / 编号'
              placeholderStyle='color: rgba(255,255,255,0.35)'
              autoComplete='off'
              confirmType='done'
              onClick={() => setManualKeyFocused(true)}
              onFocus={() => setManualKeyFocused(true)}
              onBlur={() => setManualKeyFocused(false)}
              onInput={handleManualKeyChange}
              onChange={handleManualKeyChange}
              onConfirm={handleManualActivate}
            />
            <Button
              className={styles.manualButton}
              disabled={isSubmittingManualKey || !manualKey.trim()}
              onClick={handleManualActivate}
            >
              {isSubmittingManualKey ? '提交中...' : '密钥激活'}
            </Button>
          </View>
          <Text className={styles.manualTip}>
            如果 NFC 芯片不可读取，可以直接输入后端提供的密钥完成激活
          </Text>
        </View>
      </View>

      {activationResult && (
        <View className={styles.overlay}>
          <View className={`${styles.rewardCard} ${styles.epic}`}>
            <View className={styles.rewardTitle}>激活成功</View>
            <View className={styles.rewardDesc}>
              {activationResult?.already ? '该水晶已激活' : '您的水晶已成功激活！'}
            </View>
            <Button className={styles.confirmBtn} onClick={handleCloseOverlay}>
              确定
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
