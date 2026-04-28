import React, { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import styles from './index.module.css'

const QUESTIONS = [
  // E/I 维度 (1-5)
  { id: 1, text: '在聚会或社交场合中，你感到精力充沛', dim: 'EI' },
  { id: 2, text: '你喜欢结识新朋友，并乐于主动开启对话', dim: 'EI' },
  { id: 3, text: '你倾向于先行动再思考，边做边调整', dim: 'EI' },
  { id: 4, text: '在人群中你感到自在，不介意成为关注的焦点', dim: 'EI' },
  { id: 5, text: '与独处相比，你更喜欢与他人一起工作或消磨时光', dim: 'EI' },
  // S/N 维度 (6-10)
  { id: 6, text: '比起抽象的概念，你更关注具体的事实和细节', dim: 'SN' },
  { id: 7, text: '你更相信过往的经验，而非直觉和灵感', dim: 'SN' },
  { id: 8, text: '你喜欢按部就班完成任务，不太喜欢即兴发挥', dim: 'SN' },
  { id: 9, text: '比起想象未来的可能性，你更注重眼前的现实', dim: 'SN' },
  { id: 10, text: '你更看重实用性，而非创新和创意', dim: 'SN' },
  // T/F 维度 (11-15)
  { id: 11, text: '做决定时，你更依赖逻辑分析而非个人感受', dim: 'TF' },
  { id: 12, text: '你认为公正比同情更重要', dim: 'TF' },
  { id: 13, text: '在给出反馈时，你更注重事实而非对方的情绪', dim: 'TF' },
  { id: 14, text: '你更看重原则和一致性，而非具体情境下的和谐', dim: 'TF' },
  { id: 15, text: '面对问题时，你倾向于客观分析而非考虑对人的影响', dim: 'TF' },
  // J/P 维度 (16-20)
  { id: 16, text: '你喜欢提前制定计划，而非随机应变', dim: 'JP' },
  { id: 17, text: '有明确的截止日期和规则会让你更安心', dim: 'JP' },
  { id: 18, text: '你倾向于做完一件事再开始下一件', dim: 'JP' },
  { id: 19, text: '你更喜欢确定性，不喜欢太多开放式的选择', dim: 'JP' },
  { id: 20, text: '比起灵活多变，你更偏爱有条理的生活方式', dim: 'JP' },
]

const OPTIONS = [
  { label: '非常不同意', value: -2 },
  { label: '不同意', value: -1 },
  { label: '中立', value: 0 },
  { label: '同意', value: 1 },
  { label: '非常同意', value: 2 },
]

const TYPE_DESCRIPTIONS = {
  'ISTJ': '严谨务实的守护者，重视规则与责任。',
  'ISFJ': '温柔细心的保护者，默默守护身边的人。',
  'INFJ': '深邃有远见的提倡者，内心充满理想与温度。',
  'INTJ': '独立理性的建筑师，擅长战略与长远规划。',
  'ISTP': '冷静果敢的鉴赏家，擅长动手解决实际问题。',
  'ISFP': '敏感细腻的探险家，在平凡中发现美好。',
  'INFP': '理想主义的调停者，追寻内心真正的意义。',
  'INTP': '理性思辨的逻辑学家，热衷于探索真理。',
  'ESTP': '行动力强的企业家，善于随机应变。',
  'ESFP': '热情洋溢的表演者，活在当下享受生活。',
  'ENFP': '充满热情的竞选者，永远对新事物抱有好奇。',
  'ENTP': '机智善辩的辩论家，享受思想的碰撞。',
  'ESTJ': '高效务实的管理者，天生的组织协调者。',
  'ESFJ': '温暖贴心的执政官，善于照顾他人感受。',
  'ENFJ': '富有魅力的主人公，擅长激励和引导他人。',
  'ENTJ': '果敢决断的指挥官，天生的领导者。',
}

export default function MbtiTest() {
  const [current, setCurrent] = useState(0)
  const [scores, setScores] = useState({ EI: 0, SN: 0, TF: 0, JP: 0 })
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)

  const handleAnswer = (value) => {
    const question = QUESTIONS[current]
    const newScores = { ...scores }
    newScores[question.dim] += value
    setScores(newScores)

    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1)
    } else {
      setFinished(true)
    }
  }

  const handlePrev = () => {
    if (current > 0) {
      // Remove the previous answer's score
      const question = QUESTIONS[current - 1]
      const prevValue = answers[question.id]
      if (prevValue !== undefined) {
        const newScores = { ...scores }
        newScores[question.dim] -= prevValue
        setScores(newScores)
      }
      setCurrent(current - 1)
    }
  }

  const getResult = () => {
    let result = ''
    result += scores.EI >= 0 ? 'E' : 'I'
    result += scores.SN >= 0 ? 'S' : 'N'
    result += scores.TF >= 0 ? 'T' : 'F'
    result += scores.JP >= 0 ? 'J' : 'P'
    return result
  }

  const handleUseResult = () => {
    const mbtiType = getResult()
    Taro.setStorageSync('mbtiTestResult', mbtiType)
    Taro.navigateBack()
  }

  if (finished) {
    const mbtiType = getResult()
    const desc = TYPE_DESCRIPTIONS[mbtiType] || ''

    return (
      <View className={styles.container}>
        <View className={styles.resultCard}>
          <Text className={styles.resultEmoji}>🔮</Text>
          <Text className={styles.resultLabel}>你的 MBTI 类型</Text>
          <Text className={styles.resultType}>{mbtiType}</Text>
          <Text className={styles.resultDesc}>{desc}</Text>

          <View className={styles.dimScores}>
            {[
              { dim: 'EI', left: '外向 E', right: '内向 I' },
              { dim: 'SN', left: '感觉 S', right: '直觉 N' },
              { dim: 'TF', left: '思考 T', right: '情感 F' },
              { dim: 'JP', left: '判断 J', right: '感知 P' },
            ].map(item => {
              const raw = scores[item.dim]
              const maxScore = 10
              const pct = Math.min(100, Math.max(0, ((raw + maxScore) / (maxScore * 2)) * 100))
              return (
                <View key={item.dim} className={styles.dimRow}>
                  <Text className={styles.dimLabel}>{item.left}</Text>
                  <View className={styles.dimBar}>
                    <View className={styles.dimFill} style={{ width: `${pct}%` }} />
                  </View>
                  <Text className={styles.dimLabel}>{item.right}</Text>
                </View>
              )
            })}
          </View>

          <View className={styles.resultBtn} onClick={handleUseResult}>
            使用此结果
          </View>
          <Text className={styles.retestLink} onClick={() => { setFinished(false); setCurrent(0); setScores({ EI: 0, SN: 0, TF: 0, JP: 0 }); setAnswers({}) }}>
            重新测试
          </Text>
        </View>
      </View>
    )
  }

  const question = QUESTIONS[current]
  const progress = ((current + 1) / QUESTIONS.length) * 100
  const dimNames = { EI: '外向 vs 内向', SN: '感觉 vs 直觉', TF: '思考 vs 情感', JP: '判断 vs 感知' }

  return (
    <View className={styles.container}>
      {/* Header */}
      <View className={styles.header}>
        <Text className={styles.headerTitle}>MBTI 性格测试</Text>
        <Text className={styles.headerSub}>
          第 {current + 1} / {QUESTIONS.length} 题 · {dimNames[question.dim]}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className={styles.progressBar}>
        <View className={styles.progressFill} style={{ width: `${progress}%` }} />
      </View>

      {/* Question Card */}
      <View className={styles.questionCard}>
        <Text className={styles.questionNum}>Q{current + 1}</Text>
        <Text className={styles.questionText}>{question.text}</Text>

        {/* Options */}
        <View className={styles.options}>
          {OPTIONS.map(opt => {
            const isSelected = answers[question.id] === opt.value
            return (
              <View
                key={opt.value}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                onClick={() => handleAnswer(opt.value)}
              >
                <Text className={`${styles.optionText} ${isSelected ? styles.optionTextSelected : ''}`}>
                  {opt.label}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Navigation */}
      <View className={styles.nav}>
        {current > 0 ? (
          <View className={styles.navBtn} onClick={handlePrev}>上一题</View>
        ) : (
          <View />
        )}
        <Text className={styles.navHint}>点击选项自动进入下一题</Text>
      </View>
    </View>
  )
}
