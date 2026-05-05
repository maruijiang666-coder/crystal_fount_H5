import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.css';

const ANALYSIS_LABELS = {
  personality: '性格匹配',
  emotional: '情感缘分',
  life: '生活适配',
  values: '三观合拍',
  work: '工作匹配',
  leadership: '领导力匹配',
  social: '社交适配',
};

function getAnalysisSections(report) {
  const sections = [];
  for (const key of Object.keys(report)) {
    if (key.endsWith('_score') && key !== 'overall_score') {
      const prefix = key.replace('_score', '');
      const matchKey = prefix + '_match';
      if (report[matchKey]) {
        sections.push({
          label: ANALYSIS_LABELS[prefix] || prefix,
          score: report[key],
          details: report[matchKey],
        });
      }
    }
  }
  return sections;
}

export default function MatchReport() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    const data = Taro.getStorageSync('match_report_data');
    if (data) {
      setReport(data);
    } else {
      Taro.showToast({ title: '报告数据不存在', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, []);

  const handleBack = () => {
    Taro.navigateBack();
  };

  if (!report) return null;

  const analysisSections = getAnalysisSections(report);

  return (
    <View className={`flex-col ${styles['page']}`}>
      <ScrollView scrollY className={styles['scroll-container']}>
        <View className={`flex-col ${styles['section']}`}>
          <Text className={styles['section-title']}>匹配报告</Text>

          {report.overall_score !== undefined && (
            <View className={`flex-row justify-center items-center ${styles['score-card']}`}>
              <View className={`flex-col items-center ${styles['score-circle']}`}>
                <Text className={styles['score-number']}>{report.overall_score}</Text>
                <Text className={styles['score-label']}>综合匹配度</Text>
              </View>
            </View>
          )}

          {report.overall_summary && (
            <View className={`flex-col ${styles['analysis-card']}`}>
              <Text className={styles['analysis-content']}>{report.overall_summary}</Text>
            </View>
          )}

          {analysisSections.map((section) => (
            <View key={section.label} className={`flex-col ${styles['analysis-card']}`}>
              <View className={`flex-row items-center ${styles['analysis-header']}`}>
                <Text className={styles['analysis-title']}>{section.label}</Text>
                <Text className={styles['analysis-score']}>{section.score}分</Text>
              </View>
              <Text className={styles['analysis-content']}>{section.details}</Text>
            </View>
          ))}

          {report.adjustment_advice && (
            <View className={`flex-col ${styles['analysis-card']}`}>
              <View className={`flex-row items-center ${styles['analysis-header']}`}>
                <Text className={styles['analysis-title']}>调整建议</Text>
              </View>
              <Text className={styles['analysis-content']}>{report.adjustment_advice}</Text>
            </View>
          )}
        </View>

        <View
          className={`flex-col justify-center items-center ${styles['back-btn']}`}
          onClick={handleBack}
        >
          <Text className={styles['back-text']}>返回</Text>
        </View>

        <View className={styles['powered-by-ai']}>
          本服务由人工智能提供技术支持
        </View>
      </ScrollView>
    </View>
  );
}
