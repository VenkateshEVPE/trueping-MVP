import React from 'react'
import { View, Text } from 'react-native'

const LatencyDisplay = ({ insets, ipAddress }) => {
  return (
    <View className="absolute flex-row items-baseline justify-between w-full px-5" style={{ top: 144.44 + insets.top }}>
      {/* Large Latency Display */}
      <View className="flex-row items-baseline">
        <Text className="text-white font-offBit101 text-[100px]">20</Text>
        <Text className="text-white font-offBit ml-[10px] text-[54px]">ms</Text>
      </View>

      {/* IP Address */}
      <View className="items-baseline">
        <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
          <Text>IP </Text>
          <Text className="text-[#e65300] font-offBit101Bold">{ipAddress}</Text>
        </Text>
      </View>
    </View>
  )
}

export default LatencyDisplay

