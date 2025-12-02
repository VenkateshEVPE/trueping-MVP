import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

const LeftPanel = ({ insets, isChargingToggleOn, setIsChargingToggleOn, selectedNetwork, setSelectedNetwork }) => {
  return (
    <View className="absolute items-center w-1/2" style={{ left: 14.34, top: 530.51 + insets.top, gap: 33 }} pointerEvents="box-none">
      {/* Proof Interval */}
      <View className="items-center" style={{ gap: 4 }}>
        <Text className="text-[16px] text-[#f6f6f6] font-satoshiMedium text-center" style={{ letterSpacing: 0.15 }}>Proof Interval</Text>
        <Text className="text-[16px] text-[#e65300] font-offBit101Bold text-center">15 : 02</Text>
      </View>

      {/* Toggle */}
      <View className="items-center" style={{ gap: 10 }} pointerEvents="box-none">
        <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: -0.2, lineHeight: 18 }}>Collect data while charging</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Toggle pressed, current state:', isChargingToggleOn)
            setIsChargingToggleOn(prev => {
              console.log('Setting new state to:', !prev)
              return !prev
            })
          }}
          className="rounded-full justify-center"
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            height: 24.314,
            width: 40,
            padding: 1.55,
            backgroundColor: isChargingToggleOn ? '#e65300' : '#5a5a5a',
            zIndex: 10
          }}
        >
          <View
            className="bg-white rounded-full"
            pointerEvents="none"
            style={{
              width: 20.929,
              height: 20.929,
              alignSelf: isChargingToggleOn ? 'flex-end' : 'flex-start',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2.325 },
              shadowOpacity: 0.15,
              shadowRadius: 6.201,
              elevation: 3
            }}
          />
        </TouchableOpacity>
      </View>

      {/* Network Type Selection */}
      <View className="items-center" style={{ gap: 5 }}>
        <View className="flex-row justify-between w-full">
          <Text className="text-[10px] text-white font-satoshi text-right w-[32.341px]" style={{ letterSpacing: -0.2 }}>Wi-Fi</Text>
          <Text className="text-[10px] text-white font-satoshi text-center w-[46.438px]" style={{ letterSpacing: -0.2 }}>5G</Text>
          <Text className="text-[10px] text-white font-satoshi text-right w-[52.52px]" style={{ letterSpacing: -0.2 }}>WI-FI + 5G</Text>
        </View>
        <View className="bg-[#282828] rounded-[5px] p-[2px] flex-row items-center" style={{ gap: 2 }}>
          <TouchableOpacity
            onPress={() => setSelectedNetwork('wifi')}
            activeOpacity={0.7}
            className={`w-12 h-[39px] items-center justify-center rounded-[3px] ${selectedNetwork === 'wifi' ? 'bg-[#e65300]' : ''}`}
          >
            <Text className="text-white text-xs">Wi-Fi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedNetwork('5g')}
            activeOpacity={0.7}
            className={`w-12 h-[39px] items-center justify-center rounded-[3px] ${selectedNetwork === '5g' ? 'bg-[#e65300]' : ''}`}
          >
            <Text className="text-white text-xs">5G</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedNetwork('wifi5g')}
            activeOpacity={0.7}
            className={`w-12 h-[39.357px] items-center justify-center rounded-[3px] ${selectedNetwork === 'wifi5g' ? 'bg-[#e65300]' : ''}`}
          >
            <Text className="text-white text-xs">Both</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default LeftPanel

