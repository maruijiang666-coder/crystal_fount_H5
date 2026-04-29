import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import './index.css';
import _arrayWithoutHoles from '@babel/runtime/helpers/arrayWithoutHoles';

const ShiYeCard = (props) => {
  const { content = '', className = '', style = {} } = props;

  return (
    <View 
      className={`flex-col justify-start relative view_1 ${className}`}
      style={{
        backgroundImage: `url(https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/yunshi/1.png)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        ...style
      }}
    >
      <View className="flex-row section pos">
        <View className="flex-col flex-1 self-start">
          <Text className="self-start font text">事业</Text>
          <Text className="self-stretch font_2 text_2 mt-10">
            {content}
          </Text>
        </View>
        
      </View>
    </View>
  );
};

export default ShiYeCard;
