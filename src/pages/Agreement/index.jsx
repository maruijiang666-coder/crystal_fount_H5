import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.css';

export default function Agreement() {
  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>用户服务协议</Text>
      </View>
      <ScrollView scrollY className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.paragraph}>
            欢迎您使用本小程序服务。请您在开始使用前仔细阅读并充分理解本协议，特别是涉及免责声明、权利限制的条款。如果您不同意本协议的任何内容，请您立即停止使用本服务。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>1. 服务内容</Text>
          <Text className={styles.paragraph}>
            1.1 本小程序提供包括但不限于水晶NFC互动、塔罗运势查询、灵宠养成及相关娱乐服务。
          </Text>
          <Text className={styles.paragraph}>
            1.2 我们保留随时变更、中断或终止部分或全部服务的权利，包括但不限于对游戏规则、功能模块的调整。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>2. 用户账号与行为规范</Text>
          <Text className={styles.paragraph}>
            2.1 您需要通过微信授权登录使用本服务。您应妥善保管您的账号信息，并对该账号下发生的所有活动承担法律责任。
          </Text>
          <Text className={styles.paragraph}>
            2.2 您承诺不利用本服务从事任何违法违规行为，包括但不限于发布违法信息、使用外挂或脚本破坏游戏平衡、恶意攻击服务器等。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>3. 隐私保护</Text>
          <Text className={styles.paragraph}>
            我们非常重视您的个人信息保护。关于我们如何收集、使用和存储您的个人信息，请参阅《隐私政策》。您使用本服务即视为您同意我们按照隐私政策处理您的信息。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>4. 免责声明（重要）</Text>
          <Text className={styles.paragraph}>
            4.1 本小程序提供的塔罗占卜、运势解读等内容仅供娱乐和心理参考，不代表科学依据，也不构成任何法律、医疗、金融等专业建议。
          </Text>
          <Text className={styles.paragraph}>
            4.2 请您理性看待解读结果，切勿沉迷。我们不对您基于本服务做出的任何决策或行动承担责任。
          </Text>
          <Text className={styles.paragraph}>
            4.3 因网络状况、通讯线路、第三方服务瑕疵等原因导致的服务中断或数据丢失，我们不承担赔偿责任。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>5. 知识产权</Text>
          <Text className={styles.paragraph}>
            本小程序包含的所有文本、图片、音频、代码及相关素材的知识产权归开发者所有。未经授权，任何单位和个人不得擅自复制、转载或用于商业用途。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>6. 未成年人保护</Text>
          <Text className={styles.paragraph}>
            若您是未成年人，请在监护人的陪同和指导下阅读本协议及使用本服务。
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>7. 联系我们</Text>
          <Text className={styles.paragraph}>
            如您对本协议有任何疑问或建议，请通过以下方式联系我们：
          </Text>
          <Text className={styles.paragraph}>
            邮箱：1689578286@qq.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
