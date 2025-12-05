import React from 'react'
import { Image } from 'react-native'

const EditIcon = ({ size = 14 }) => {
  return (
    <Image
      source={require('../../../assets/icons/edit.png')}
      style={{
        width: size,
        height: size,
        resizeMode: 'contain',
      }}
    />
  )
}

export default EditIcon

