import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import GridPatternBackground from '../../components/GridPatternBackground'
import { clearAllData } from '../../database/database'

const Settings = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all local data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData()
              navigation.reset({
                index: 0,
                routes: [{ name: 'signIn' }],
              })
            } catch (error) {
              console.error('Error clearing data:', error)
              Alert.alert('Error', 'Failed to clear data. Please try again.')
            }
          },
        },
      ]
    )
  }

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
            Settings
          </Text>
          
          {/* Logout button */}
          <TouchableOpacity 
            className="w-full py-3 items-center justify-center bg-buttonBackground mt-8"
            onPress={handleLogout}
          >
            <Text className="text-xl font-satoshiMedium text-buttonText">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default Settings