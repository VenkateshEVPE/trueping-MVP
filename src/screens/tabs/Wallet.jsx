import { Text, View, ScrollView } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GridPatternBackground from '../../components/GridPatternBackground'

const Wallet = () => {
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 bg-background dark:bg-black">
      {/* Grid pattern background with gradient overlay */}
      <GridPatternBackground />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-1 px-5 pt-[20%]">
          <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white">
            Wallet
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default Wallet