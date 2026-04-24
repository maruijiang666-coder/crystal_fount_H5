import { useState, useEffect, useRef } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { getApiUrl, API_ENDPOINTS } from '../../utils/api.config.js';
import styles from './index.module.css';

const PODCAST_API = getApiUrl(API_ENDPOINTS.FORTUNE_REPORT);

// Format seconds to MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function Podcast() {
  const router = Taro.useRouter();
  const [loading, setLoading] = useState(true);
  const [podcastData, setPodcastData] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false); // Track dragging state
  
  const audioContext = useRef(null);
  const lastDuration = useRef(0);
  const introAudioContext = useRef(null);

  // Initialize Intro Audio Context
  useEffect(() => {
    const iac = Taro.createInnerAudioContext();
    iac.src = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/sounds/found_sund.mp3';
    introAudioContext.current = iac;
    return () => {
      iac.destroy();
    };
  }, []);

  // Initialize Audio Context
  useEffect(() => {
    Taro.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#120c21',
        animation: {
            duration: 400,
            timingFunc: 'easeIn'
        }
    });

    const audio = Taro.getBackgroundAudioManager();
    audioContext.current = audio;

    // Sync initial state if audio is already playing
    if (audio.src && !audio.paused) {
        setIsPlaying(true);
        if (audio.duration) {
            setDuration(audio.duration);
            lastDuration.current = audio.duration;
        }
        setCurrentTime(audio.currentTime);
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onStop = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => {
      if (audio.duration && audio.duration > 0) {
        if (audio.duration >= lastDuration.current || lastDuration.current === 0) {
          lastDuration.current = audio.duration;
          setDuration(audio.duration);
        }
      }
      // Only update time if not dragging
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onError = (res) => {
      console.error('Audio Error:', res);
      Taro.showToast({ title: '播放出错', icon: 'none' });
    };
    const onCanplay = () => {
        if (audio.duration) {
             lastDuration.current = audio.duration;
             setDuration(audio.duration);
        }
    }

    audio.onPlay(onPlay);
    audio.onPause(onPause);
    audio.onStop(onStop);
    audio.onEnded(onEnded);
    audio.onTimeUpdate(onTimeUpdate);
    audio.onError(onError);
    audio.onCanplay(onCanplay);

    return () => {
       // Cleanup if needed
    };
  }, [isDragging]); // Depend on isDragging to update closure if needed, though ref is better. 
  // Actually onTimeUpdate closure captures isDragging state? No, event listener is attached once.
  // We need to use a ref for isDragging inside the listener or update listener.
  // Better approach: use a Ref for isDragging to access it inside the stable onTimeUpdate callback.
  
  const isDraggingRef = useRef(false);
  useEffect(() => {
      isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Re-fetch duration when page is shown
  useDidShow(() => {
    const audio = audioContext.current || Taro.getBackgroundAudioManager();
    if (audio && audio.duration) {
        console.log('Page Show: Refreshing duration', audio.duration);
        setDuration(audio.duration);
        lastDuration.current = audio.duration;
    }
  });

  // Re-bind onTimeUpdate to access fresh state or use Ref
  useEffect(() => {
    if(!audioContext.current) return;
    const audio = audioContext.current;
    const onTimeUpdate = () => {
        if (audio.duration && audio.duration > 0) {
            if (audio.duration >= lastDuration.current || lastDuration.current === 0) {
              lastDuration.current = audio.duration;
              setDuration(audio.duration);
            }
        }
        if (!isDraggingRef.current) {
            setCurrentTime(audio.currentTime);
        }
    };
    audio.onTimeUpdate(onTimeUpdate);
  }, []); // Re-bind only once, rely on ref

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Check params first
        const paramsAudioUrl = router.params.audio_url ? decodeURIComponent(router.params.audio_url) : null;
        const paramsSubtitleUrl = router.params.subtitle_url ? decodeURIComponent(router.params.subtitle_url) : null;
        const paramsReportDate = router.params.report_date ? decodeURIComponent(router.params.report_date) : null;

        if (paramsAudioUrl) {
            const mockData = {
                report_date: paramsReportDate || new Date().toISOString(),
                ai_data: {
                    tts_audio_url: paramsAudioUrl,
                    subtitle_url: paramsSubtitleUrl
                }
            };
            setPodcastData(mockData);

            const audioUrl = paramsAudioUrl.startsWith('http') ? paramsAudioUrl : `${API_BASE}${paramsAudioUrl}`;
            
            if (audioContext.current) {
                audioContext.current.title = `运势播客 ${new Date(mockData.report_date).toLocaleDateString()}`;
                audioContext.current.epname = '塔罗水晶运势';
                audioContext.current.singer = 'AI 占卜师';
                audioContext.current.coverImgUrl = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/b006026aece6a0992802b69125015c60.png';
                audioContext.current.src = audioUrl;
            }

            let subtitleUrl = paramsSubtitleUrl;
            if (subtitleUrl) {
                subtitleUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `${API_BASE}${subtitleUrl}`;
            } else {
                subtitleUrl = audioUrl.replace('.mp3', '.json');
            }
            fetchSubtitles(subtitleUrl);
            setLoading(false);
            return;
        }

        const token = Taro.getStorageSync('importcode');
        const headers = {};
        
        if (token) {
          headers['X-Login-Token'] = token;
        } else {
          headers['X-API-Key'] = '123quant-speed';
        }

        const res = await Taro.request({
          url: PODCAST_API,
          method: 'GET',
          header: headers
        });

        if (res.statusCode === 200 && res.data) {
          setPodcastData(res.data);
          
          const aiData = res.data.ai_data;
          const audioPath = aiData ? aiData.tts_audio_url : null;
          const subtitlePath = aiData ? aiData.subtitle_url : null;

          if (audioPath) {
            const audioUrl = audioPath.startsWith('http') 
              ? audioPath 
              : `${API_BASE}${audioPath}`;
            
            if (audioContext.current) {
                audioContext.current.title = `运势播客 ${new Date(res.data.report_date).toLocaleDateString()}`;
                audioContext.current.epname = '塔罗水晶运势';
                audioContext.current.singer = 'AI 占卜师';
                audioContext.current.coverImgUrl = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/b006026aece6a0992802b69125015c60.png';
                audioContext.current.src = audioUrl;
            }

            let subtitleUrl = subtitlePath;
            if (subtitleUrl) {
                subtitleUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `${API_BASE}${subtitleUrl}`;
            } else {
                subtitleUrl = audioUrl.replace('.mp3', '.json');
            }
            fetchSubtitles(subtitleUrl);
          } else {
             Taro.showToast({ title: '暂无音频', icon: 'none' });
          }
        } else {
          Taro.showToast({ title: '获取数据失败', icon: 'none' });
        }
      } catch (err) {
        console.error(err);
        Taro.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchSubtitles = async (url) => {
    try {
      const res = await Taro.request({ url });
      if (res.statusCode === 200 && res.data) {
        setSubtitles(res.data);
        
        // Refresh audio duration when subtitles are loaded
        if (audioContext.current && audioContext.current.duration) {
            const newDuration = audioContext.current.duration;
            setDuration(newDuration);
            lastDuration.current = newDuration;
        }
      }
    } catch (err) {
      console.error('Failed to fetch subtitles:', err);
    }
  };

  // Sync Subtitles
  useEffect(() => {
    if (!subtitles.length) return;

    const currentTimeMs = currentTime * 1000;
    
    const index = subtitles.findIndex((sub, i) => {
      const nextSub = subtitles[i + 1];
      const start = sub.start_time_ms;
      const end = nextSub ? nextSub.start_time_ms : (start + sub.duration_ms);
      return currentTimeMs >= start && currentTimeMs < end;
    });

    if (index !== -1 && index !== activeSubtitleIndex) {
      setActiveSubtitleIndex(index);
    }
  }, [currentTime, subtitles, activeSubtitleIndex]);

  // Control Intro Sound based on active subtitle
  useEffect(() => {
    if (!introAudioContext.current) return;
    
    let isHeadMusicSection = false;
    if (activeSubtitleIndex !== -1 && subtitles[activeSubtitleIndex]) {
        const sub = subtitles[activeSubtitleIndex];
        isHeadMusicSection = sub.text_type === 'head_music' || sub.round_type === 'head_music';
    }

    if (isHeadMusicSection && isPlaying) {
        introAudioContext.current.play();
    } else {
        if (!isHeadMusicSection) {
            introAudioContext.current.stop();
        } else {
            introAudioContext.current.pause();
        }
    }
  }, [activeSubtitleIndex, isPlaying, subtitles]);

  const togglePlay = () => {
    if (!audioContext.current) return;
    if (isPlaying) {
      audioContext.current.pause();
    } else {
      audioContext.current.play();
    }
  };

  const cycleSpeed = () => {
      const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
      const currentIndex = speeds.indexOf(playbackRate);
      const nextIndex = (currentIndex + 1) % speeds.length;
      const nextSpeed = speeds[nextIndex];
      
      if (audioContext.current) {
          try {
              audioContext.current.playbackRate = nextSpeed;
              setPlaybackRate(nextSpeed);
              Taro.showToast({ title: `倍速: ${nextSpeed}x`, icon: 'none' });
          } catch (e) {
              console.warn('Playback rate not supported');
          }
      }
  };

  // Custom Slider Logic
  const sliderRectRef = useRef(null);

  const updateSliderRect = () => {
      const query = Taro.createSelectorQuery();
      query.select('#custom-slider').boundingClientRect((rect) => {
          if (rect) {
              sliderRectRef.current = rect;
          }
      }).exec();
  };

  useEffect(() => {
      // Initial measure
      setTimeout(updateSliderRect, 500);
  }, []);

  const calculateTime = (e) => {
      if (!sliderRectRef.current || duration <= 0) return;
      const { left, width } = sliderRectRef.current;
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return;
      
      const clientX = touch.clientX;
      let offsetX = clientX - left;
      
      if (offsetX < 0) offsetX = 0;
      if (offsetX > width) offsetX = width;
      
      const percent = offsetX / width;
      setCurrentTime(percent * duration);
  };

  const handleTouchStart = (e) => {
      setIsDragging(true);
      updateSliderRect(); // Ensure we have latest rect
      calculateTime(e);
  };

  const handleTouchMove = (e) => {
      if (isDragging) {
          calculateTime(e);
      }
  };

  const handleTouchEnd = () => {
      setIsDragging(false);
      if (audioContext.current) {
          audioContext.current.seek(currentTime);
      }
  };

  const handleSubtitleClick = (sub) => {
    if (audioContext.current && sub.start_time_ms !== undefined) {
        const seekTime = sub.start_time_ms / 1000;
        audioContext.current.seek(seekTime);
        setCurrentTime(seekTime);
        if (!isPlaying) {
             audioContext.current.play();
        }
    }
  };

  if (loading) {
    return (
      <View className={styles.loading}>
        <Text>正在加载运势播客...</Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles['bg-pattern']}></View>
      
      <View className={styles.header}>
        <Text className={styles.title}>运势播客</Text>
        <Text className={styles.aiDisclaimer}>-- 本服务由人工智能提供技术支持 --</Text>
        {podcastData && (
          <Text className={styles.date}>
            {new Date(podcastData.report_date).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Tarot Card Visual */}
      <View className={styles['visual-container']}>
          <View className={styles['tarot-card']}>
              <Image 
                className={styles['tarot-image']}
                src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/Podcsat/qsls.png"
                mode="aspectFit"
              />
          </View>
      </View>

      {/* Subtitles Area */}
      <View className={styles['subtitle-container']}>
        <ScrollView
          scrollY
          className={styles['subtitle-scroll']}
          scrollIntoView={`sub-${activeSubtitleIndex}`}
          scrollWithAnimation
          showScrollbar={false}
        >
          {!podcastData?.ai_data?.tts_audio_url ? (
            <View className={styles.generating} style={{ textAlign: 'center', padding: '20px' }}>
              <Text>没有生成运势播客，请在抽卡占卜答案页面底部点击生成对应播客。</Text>
            </View>
          ) : subtitles.length === 0 ? (
            <View className={styles.generating}>
              <Text>正在生成...</Text>
            </View>
          ) : (
            <>
              <View style={{ height: '40px' }}></View>
              {subtitles.map((sub, index) => {
                const isHeadMusic = sub.text_type === 'head_music' || sub.round_type === 'head_music';
                const isActive = index === activeSubtitleIndex;
                
                if (isHeadMusic) {
                    return (
                        <View 
                            key={index} 
                            id={`sub-${index}`}
                            className={`${styles['subtitle-item']} ${isActive ? styles['subtitle-active'] : ''}`}
                        >
                            <Text className={styles['subtitle-text']}>🎵 开启今日运势...</Text>
                        </View>
                    );
                }

                const isMale = sub.speaker && sub.speaker.includes('male') && !sub.speaker.includes('female');
                const isFemale = sub.speaker && sub.speaker.includes('female');
                const speakerLabel = isMale ? 'Speaker 1' : (isFemale ? 'Speaker 2' : 'Narrator');
                
                // Add gender-specific styling
                const labelClass = isMale 
                    ? `${styles['speaker-label']} ${styles['label-male']}`
                    : isFemale 
                        ? `${styles['speaker-label']} ${styles['label-female']}`
                        : `${styles['speaker-label']} ${styles['label-narrator']}`;

                return (
                  <View 
                    key={index} 
                    id={`sub-${index}`}
                    className={`${styles['subtitle-item']} ${isActive ? styles['subtitle-active'] : ''}`}
                    onClick={() => handleSubtitleClick(sub)}
                  >
                    {isActive && (
                        <Text className={labelClass}>{speakerLabel}</Text>
                    )}
                    <Text className={styles['subtitle-text']}>{sub.text}</Text>
                  </View>
                );
              })}
              <View style={{ height: '40px' }}></View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Controls */}
      <View className={styles['controls-container']}>
          <View className={styles['slider-container']}
                id="custom-slider"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
          >
            <View className={styles['slider-track']}>
                <View 
                    className={styles['slider-progress']}
                    style={{ width: `${(duration > 0 ? currentTime / duration : 0) * 100}%` }}
                />
            </View>
            <View 
                 className={styles['slider-thumb']}
                 style={{ left: `${(duration > 0 ? currentTime / duration : 0) * 100}%` }}
             >
                 <Image 
                     src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/Podcsat/icon2.png" 
                     className={styles['thumb-image']}
                 />
             </View>
           </View>

           <View className={styles['time-display']}>
                <Text>{formatTime(currentTime)}</Text>
                <Text>{formatTime(duration)}</Text>
           </View>

           <View className={styles['buttons-row']}>
              <View className={styles['speed-toggle']} onClick={cycleSpeed}>
                  <Text className={styles['speed-text']}>{playbackRate}x</Text>
              </View>

              <View className={styles['main-controls']}>
                  <View className={styles['btn-icon']} onClick={() => audioContext.current.seek(currentTime - 15)}>
                    <Text>↺ 15s</Text>
                  </View>
                  
                  <View className={styles['btn-play']} onClick={togglePlay}>
                    {isPlaying ? (
                        <Image 
                            src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/Podcsat/icon4.png"
                            style={{ width: '60px', height: '60px' }}
                        />
                    ) : (
                        <Image 
                            src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/Podcsat/icon1.png"
                            style={{ width: '60px', height: '60px' }}
                        />
                    )}
                  </View>

                  <View className={styles['btn-icon']} onClick={() => audioContext.current.seek(currentTime + 15)}>
                    <Text>15s ↻</Text>
                  </View>
              </View>

              {/* Placeholder for loop/mode or just empty to balance layout */}
              <View style={{ width: '40px' }}></View>
          </View>
      </View>
    </View>
  );
}
