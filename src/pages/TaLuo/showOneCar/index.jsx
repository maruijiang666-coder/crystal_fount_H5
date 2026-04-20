import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.css';

export default function ShowOneCar(props) {
  const [data, setData] = useState({});

  return (
    <View className={`flex-col justify-start items-center relative ${styles['page']} ${props.className}`}>
      <Image
        className={`${styles['image']}`}
        src="https://ide.code.fun/api/image?token=69283888043f1900118edda2&name=1e734912a97ed8f162bfe0b3fe1f74f7.png"
      />
      <Image
        className={`${styles['image_2']} ${styles['pos_2']}`}
        src="https://ide.code.fun/api/image?token=69283888043f1900118edda2&name=3a3a92f598a35fdc1ea7932f42c9a0d1.png"
      />
      <View className={`flex-col ${styles['group']} ${styles['pos_4']}`}>
        <View className={`flex-row justify-between self-stretch relative`}>
          <Image
            className={`${styles['image_3']}`}
            src="https://ide.code.fun/api/image?token=69283888043f1900118edda2&name=1f962a56642df1b7d09ef159b7ef97cb.png"
          />
          <Image
            className={`${styles['image_3']}`}
            src="https://ide.code.fun/api/image?token=69283888043f1900118edda2&name=1f962a56642df1b7d09ef159b7ef97cb.png"
          />
          <Text className={`${styles['font']} ${styles['text']} ${styles['pos_3']}`}>View the card you selected</Text>
        </View>
        <Text className={`self-center ${styles['font']} ${styles['text']} mt-28`}>Key words</Text>
        <Text className={`self-center ${styles['text_2']} mt-28`}>失落、后悔、聚焦空洞、忽视剩余</Text>
      </View>
    </View>
  );
}

ShowOneCar.defaultProps = { className: '' };
