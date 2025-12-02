import React from 'react'
import { View, Text, Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const NetworkPulseGraph = ({ insets }) => {
  return (
    <View className="absolute bg-black border border-[#5a5a5a] rounded-[5px] overflow-hidden" style={{ left: SCREEN_WIDTH / 2 - 183, top: 927.69 + insets.top, width: 366, height: 170 }}>
      <View className="absolute" style={{ top: 10.31, left: 10, gap: 2 }}>
        <Text className="text-[16px] text-white font-satoshiBold" style={{ letterSpacing: 0.15 }}>Network pulse</Text>
        <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
          <Text className="font-satoshiMedium">Lowest pulse recorded </Text>
          <Text className="font-offBit101Bold">20ms</Text>
        </Text>
      </View>
      <Text className="absolute text-[16px] text-[#e65300] font-offBitDotBold text-center" style={{ top: 73.92, left: 251.74, letterSpacing: 0.15, transform: [{ translateX: -50 }] }}>20</Text>
    </View>
  )
}

export default NetworkPulseGraph

