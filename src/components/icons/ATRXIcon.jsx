

import React from 'react'
import { Image } from 'react-native'

const ATRXIcon = ({ size = 22 }) => {
  const aspectRatio = 25 / 21
  
  return (
    <Image
      source={require('../../../assets/icons/ATRX.png')}
      style={{
        width: size,
        height: size / aspectRatio,
        resizeMode: 'contain',
      }}
    />
  )
}

export default ATRXIcon

