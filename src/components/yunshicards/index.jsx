import { View, Text, Image } from '@tarojs/components';
import '../../app.css';
import styles from './index.module.css';

export default function Yunshicards(props) {
  return (
    <View className={`flex-col justify-start items-end relative ${styles['group']} ${props.className}`}>
      <View className={`flex-row ${styles['section']} ${styles['pos']}`}>
        <View className={`flex-col flex-1 self-start ${styles['group_2']}`}>
          <Text className={`self-start ${styles['font']} ${styles['text']}`}>事业</Text>
          <Text className={`mt-10 self-stretch ${styles['font_2']} ${styles['text_2']}`}>
              桃花窗口仍在，但"质量"比"数量"更值得评估。白羊、
            桃花窗口仍在，但"质量"比"数量"更值得评估。白羊、天秤、射手会
          </Text>
        </View>
      </View>
    </View>
  );
}
Yunshicards.defaultProps = { className: '' };
