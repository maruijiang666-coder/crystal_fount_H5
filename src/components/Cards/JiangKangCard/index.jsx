import { View, Image, Text } from '@tarojs/components';
import './index.css';

const JiangKangCard = (props) => {
  const { content = '', className = '', style = {} } = props;

  return (
    <View 
      className={`flex-col justify-start relative view ${className}`}
      style={{
        backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/yunshi/4.png)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        ...style
      }}
    >
      <View className="flex-row section">

        <View className="flex-col flex-1 self-start group_4 ml-19">
          <Text className="self-start font text_5">健康</Text>
          <Text className="self-stretch font_2 text_2 mt-10">
            {content}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default JiangKangCard;
