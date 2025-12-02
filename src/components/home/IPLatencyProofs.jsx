import React from 'react'
import { View, Text } from 'react-native'
import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const IPLatencyProofs = ({ insets, deviceId, cpuUsage, ramUsage }) => {
  // Debug: Log what values we're receiving
  console.log('📱 IPLatencyProofs received:', { cpuUsage, ramUsage })
  
  return (
    <View className="absolute flex-row items-baseline justify-between px-5" style={{ left: SCREEN_WIDTH / 2 - 183.3105, top: 373 + insets.top, width: 366.621 }}>
      <View className="items-start" style={{ gap: 5 }}>
        {/* Proofs submitted */}
        <View className="border border-white flex-row items-stretch relative" style={{ gap: 0 }}>
          <View className="px-[5px] py-[2px] justify-center">
            <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
              <Text>Proofs submitted today </Text>
            </Text>
          </View>
          <View className="bg-white px-[5px] justify-center">
            <Text className="text-[12px] text-[#212322] font-offBit101Bold">452</Text>
          </View>
        </View>
        {/* Device ID */}
        <View className="border border-white h-[20px] flex-row items-baseline justify-start w-full" style={{ gap: 0 }}>
          <View className="bg-white px-1 h-full justify-center">
            <Text className="text-[12px] text-[#212322] font-satoshi" style={{ letterSpacing: 0.15 }}>
              <Text>Device ID</Text>
            </Text>
          </View>
          <Text className="text-[12px] text-[#e65300] font-offBit101Bold px-5" style={{ letterSpacing: 0.15 }}>{deviceId}</Text>
        </View>
      </View>

      {/* CPU/RAM */}
      <View className="items-baseline w-[71px]" style={{ gap: 5 }}>
        <View className="absolute bg-white" style={{ height: 17.203, left: 36.1, top: 25.8, width: 36.582 }} />
        <View className="absolute bg-white" style={{ height: 17.203, left: 36.1, top: 1.8, width: 36.582 }} />
        <View className="flex-row items-baseline" style={{ gap: 0 }}>
          <Text className="text-[14px] text-white font-satoshi text-right" style={{ letterSpacing: 0.15 }}>
            <Text>CPU </Text>
          </Text>
          <Text className="text-[14px] text-[#212322] font-offBit101Bold text-right px-2" style={{ letterSpacing: 0.15 }}>{cpuUsage}</Text>
        </View>
        <View className="flex-row items-baseline" style={{ gap: 0 }}>
          <Text className="text-[14px] text-white font-satoshi text-right" style={{ letterSpacing: 0.15 }}>
            <Text>RAM </Text>
          </Text>
          <Text className="text-[14px] text-[#212322] font-offBit101Bold text-right px-2" style={{ letterSpacing: 0.15 }}>{ramUsage}</Text>
        </View>
      </View>
    </View>
  )
}

export default IPLatencyProofs

