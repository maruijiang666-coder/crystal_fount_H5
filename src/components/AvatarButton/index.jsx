import { Component } from 'react';
import { Button } from '@tarojs/components';
import Taro from '@tarojs/taro';

class AvatarButton extends Component {
  handleChooseAvatar = (e) => {
    console.log('=== AvatarButton 内部回调触发 ===');
    console.log('事件对象:', e);
    console.log('e.detail:', e.detail);
    console.log('e.detail.avatarUrl:', e.detail.avatarUrl);
    
    if (this.props.onChooseAvatar && e.detail.avatarUrl) {
      this.props.onChooseAvatar(e.detail.avatarUrl);
    }
  }

  render() {
    const { children, className, ...rest } = this.props;
    
    return (
      <Button
        {...rest}
        className={className}
        openType="chooseAvatar"
        onChooseAvatar={this.handleChooseAvatar}
      >
        {children}
      </Button>
    );
  }
}

export default AvatarButton;
