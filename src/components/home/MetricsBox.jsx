import React from 'react'
import { View, Text } from 'react-native'

const MetricsBox = ({ insets }) => {
  return (
    <View className="absolute flex-col w-full px-5" style={{ top: 272.88 + insets.top, gap: 5 }}>
      {/* Single white box containing all three values */}
      <View className="bg-[#f6f6f6] px-[15px] py-[5px] flex-row items-center justify-between rounded-[5px]">
        {/* Samples Collected */}
        <View className="flex-1 items-center">
          <Text className="text-[14px] text-[#212322] font-offBit101Bold text-center" style={{ lineHeight: 20 }}>250</Text>
        </View>

        {/* Uptime */}
        <View className="flex-1 flex-row items-center justify-center gap-2">
          <Text className="text-[14px] text-[#212322] font-offBit101Bold text-center" style={{ lineHeight: 20 }}>25%</Text>
        </View>

        {/* Avg Latency */}
        <View className="flex-1 items-center">
          <Text className="text-[14px] text-[#212322] font-offBit101Bold text-center" style={{ lineHeight: 20 }}>45ms</Text>
        </View>
      </View>

      {/* Labels below the box - aligned with values above */}
      <View className="flex-row items-center">
        <View className="flex-1 items-center">
          <Text className="text-[12px] text-white font-satoshi text-center" style={{ letterSpacing: 0.15 }}>Samples collected</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-[12px] text-white font-satoshi text-center" style={{ letterSpacing: 0.15 }}>Uptime %</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-[12px] text-white font-satoshi text-center" style={{ letterSpacing: 0.15 }}>Avg latency today</Text>
        </View>
      </View>
    </View>
  )
}

export default MetricsBox

