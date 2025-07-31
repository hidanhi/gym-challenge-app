import React from 'react';
import { Image } from 'react-native';

export const Rocket = (props: any) => {
  const x = props.body.position.x - 25;
  const y = props.body.position.y - 25;

  return (
    <Image
      source={require('../assets/images/rocket.png')}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 50,
        height: 50,
        resizeMode: 'contain',
      }}
    />
  );
};
