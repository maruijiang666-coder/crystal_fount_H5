import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import styles from './danchuang.module.css';

export default function Danchuang(props) {
  const [data, setData] = useState({});

  return (
    <View className={`flex-col justify-start items-end ${styles['page']} ${props.className}`}>
      <View className={`flex-col justify-start items-start relative ${styles['group_1']}`}>
        <View className={`flex-col relative ${styles['section']}`}>
          <View className={`flex-col justify-start items-start relative ${styles['text-wrapper']}`}>
            <Text className={`${styles['text_3']}`}>请输入你想占卜的内容</Text>
          </View>
          <View className={`flex-col ${styles['group']}`}>
            <View className={`flex-col justify-start items-center self-stretch relative ${styles['text-wrapper_2']}`}>
              <Text className={`${styles['text_4']}`}>提交问题</Text>
            </View>
            <Text className={`self-center ${styles['text_5']} mt-10`}>退出占卜</Text>
          </View>
        </View>
        <Image
          className={`${styles['image']} ${styles['pos']}`}
          src="https://ide.code.fun/api/image?token=69283888043f1900118edda2&name=ba29a9bfea020d78cb3bf1760d2e5c28.png"
        />
        <View className={`flex-col items-start ${styles['pos_2']}`}>
          <Text className={`${styles['font']} ${styles['text']}`}>您想占卜？</Text>
          <Text className={`${styles['font']} ${styles['text_2']} ${styles['mt-17']}`}>divination</Text>
        </View>
      </View>
    </View>
  );
}

Danchuang.defaultProps = { className: '' };