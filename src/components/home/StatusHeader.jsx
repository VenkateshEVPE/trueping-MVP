import React from 'react'
import { View, Text } from 'react-native'
import LogoIcon from '../icons/LogoIcon'

const StatusHeader = ({ insets }) => {
  return (
    <View className="absolute flex-row items-center justify-between w-full px-5" style={{ top: 15 + insets.top }}>
      <View className="items-start">
        <Text className="text-[14px] text-white font-satoshiMedium" style={{ letterSpacing: 0.15 }}>Status</Text>
        <Text className="text-[20px] text-[#e65300] font-offBit101Bold">Active_</Text>
      </View>
      <LogoIcon color="#e65300" size={33} />
    </View>
  )
}

export default StatusHeader

