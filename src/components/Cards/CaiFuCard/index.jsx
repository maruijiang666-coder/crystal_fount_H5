import { View, Image, Text } from '@tarojs/components';
import './index.css';

const JianKanCard = (props) => {
  const { content = '', className = '', style = {} } = props;

  return (
    <View
      className={`flex-col justify-start relative view ${className}`}
      style={{
        backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/yunshi/2.png)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        ...style
      }}
    >
      <View className="flex-row items-center section_2">
        <View className="flex-col flex-1 group_3 ml-19">
          <Text className="self-start font text_3">财富</Text>
          <Text className="self-stretch font_2 text_2 mt-10">
            {content}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default JianKanCard;
