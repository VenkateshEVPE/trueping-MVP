import React from 'react'
import { View, Text } from 'react-native'
import Svg, { Path } from 'react-native-svg'

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
          <Svg width="12" height="11" viewBox="0 0 12 11" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.15314 0.437967C5.22991 0.304824 5.34038 0.194247 5.47345 0.117363C5.60652 0.0404786 5.7575 0 5.91119 0C6.06487 0 6.21585 0.0404786 6.34892 0.117363C6.48199 0.194247 6.59247 0.304824 6.66923 0.437967L11.7057 9.16113C11.7825 9.29415 11.823 9.44503 11.823 9.59863C11.823 9.75222 11.7825 9.90311 11.7057 10.0361C11.6289 10.1691 11.5185 10.2796 11.3855 10.3564C11.2525 10.4332 11.1016 10.4736 10.948 10.4736H0.874978C0.721385 10.4736 0.570499 10.4332 0.437486 10.3564C0.304472 10.2796 0.194017 10.1691 0.117222 10.0361C0.0404275 9.90311 -9.75477e-07 9.75222 0 9.59863C9.75512e-07 9.44503 0.0404314 9.29415 0.117228 9.16113L5.15373 0.437967H5.15314Z"
              fill="#14AE5C"
            />
          </Svg>
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

