import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.css';

export default function Privacy() {
  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>隐私政策</Text>
      </View>
      <ScrollView scrollY className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.paragraph}>
            我们非常重视您的隐私保护。本政策旨在详细说明我们如何收集、使用、存储及保护您的个人信息。请您在使用本服务前仔细阅读。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>1. 我们收集的信息</Text>
          <Text className={styles.paragraph}>
            为了向您提供完整的服务体验，我们需要收集以下信息：
          </Text>
          <Text className={styles.listItem}>• 个人基本信息：经您授权后，我们会获取您的微信昵称、头像，用于在小程序中创建您的个人档案、显示排行榜及灵宠互动界面。</Text>
          <Text className={styles.listItem}>• 互动与游戏数据：我们会记录您与NFC水晶的交互记录（如Tag ID）、灵宠养成数据（如能量值、等级、收集物品）、塔罗占卜记录等。这些数据是游戏功能正常运行所必需的。</Text>
          <Text className={styles.listItem}>• 日志信息：为了保障账号安全及服务稳定性，我们会收集您的登录日志、操作记录及必要的设备信息（如设备型号、操作系统版本）。</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>2. 信息的存储</Text>
          <Text className={styles.paragraph}>
            2.1 存储地点：我们依照法律法规的规定，将您的个人信息存储于中华人民共和国境内。
          </Text>
          <Text className={styles.paragraph}>
            2.2 存储期限：我们仅在为您提供服务所必需的期间内保留您的个人信息。当您注销账号或撤回授权后，我们将依法对您的信息进行删除或匿名化处理。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>3. 信息的使用</Text>
          <Text className={styles.paragraph}>
            我们将收集的信息用于以下用途：
          </Text>
          <Text className={styles.listItem}>• 身份验证：确保您的账号安全。</Text>
          <Text className={styles.listItem}>• 提供服务：保存您的游戏进度、生成个性化的塔罗解读结果。</Text>
          <Text className={styles.listItem}>• 服务优化：分析用户使用情况，以改进产品功能和体验。</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>4. 信息共享与披露</Text>
          <Text className={styles.paragraph}>
            未经您的明确同意，我们不会向任何第三方共享、转让您的个人信息，除非：
          </Text>
          <Text className={styles.listItem}>• 依据法律法规或政府主管部门的强制性要求。</Text>
          <Text className={styles.listItem}>• 为维护公共利益或您的合法权益。</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>5. 您的权利</Text>
          <Text className={styles.paragraph}>
            您可以随时查阅您的个人资料和游戏数据。如需更正信息或注销账号，请通过“联系我们”中的方式与我们联系，我们将及时响应您的请求。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>6. 联系我们</Text>
          <Text className={styles.paragraph}>
            如您对本隐私政策有任何疑问，或需要进行个人信息相关的投诉与举报，请联系：
          </Text>
          <Text className={styles.paragraph}>
            邮箱：1689578286@qq.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
