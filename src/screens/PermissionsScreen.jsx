import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native'
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { PermissionsAndroid } from 'react-native'
import GridPatternBackground from '../components/GridPatternBackground'
import { markPermissionsAsGranted } from '../services/permissionsStorage'

const PermissionsScreen = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionsStatus, setPermissionsStatus] = useState({
    location: false,
    backgroundLocation: false,
    notifications: false,
  })

  // Request location permissions
  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') {
      // iOS handles permissions automatically via Info.plist
      setPermissionsStatus((prev) => ({ ...prev, location: true, backgroundLocation: true }))
      return true
    }

    try {
      // Request foreground location permission
      const foregroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'TruePing needs access to your location to provide accurate network monitoring and device information.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      )

      if (foregroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Required',
          'Location permission is required for TruePing to function properly. Please grant the permission to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => requestLocationPermission() },
          ]
        )
        return false
      }

      setPermissionsStatus((prev) => ({ ...prev, location: true }))

      // Request background location permission (Android 10+)
      if (Platform.Version >= 29) {
        const backgroundGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Background Location Permission',
            message:
              'TruePing needs access to your location even when the app is in the background to continuously monitor your network and device status.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        )

        if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Background Permission Required',
            'Background location permission is required for continuous monitoring. Please grant the permission to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => requestLocationPermission() },
            ]
          )
          return false
        }

        setPermissionsStatus((prev) => ({ ...prev, backgroundLocation: true }))
      } else {
        // For Android < 10, background location is included in foreground permission
        setPermissionsStatus((prev) => ({ ...prev, backgroundLocation: true }))
      }

      return true
    } catch (err) {
      console.error('Location permission request error:', err)
      Alert.alert('Error', 'Failed to request location permission. Please try again.')
      return false
    }
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          // Android 13+ requires POST_NOTIFICATIONS permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'TruePing needs notification permission to alert you about important network and device status updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'Allow',
            }
          )

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required',
              'Notification permission is recommended for the best experience. You can grant it later in settings.',
              [{ text: 'OK' }]
            )
            return false
          }

          setPermissionsStatus((prev) => ({ ...prev, notifications: true }))
          return true
        } else {
          // Android < 13, notifications are granted by default
          setPermissionsStatus((prev) => ({ ...prev, notifications: true }))
          return true
        }
      } catch (err) {
        console.error('Notification permission request error:', err)
        return false
      }
    } else {
      // iOS - notifications are handled via push notification setup
      setPermissionsStatus((prev) => ({ ...prev, notifications: true }))
      return true
    }
  }

  // Request all permissions
  const requestAllPermissions = async () => {
    setIsRequesting(true)

    try {
      // Request location permissions first (most important)
      const locationGranted = await requestLocationPermission()
      if (!locationGranted) {
        setIsRequesting(false)
        return
      }

      // Request notification permission
      await requestNotificationPermission()

      // All permissions requested
      setIsRequesting(false)

      // Mark permissions as granted in AsyncStorage
      try {
        const success = await markPermissionsAsGranted()
        if (!success) {
          console.error('Failed to mark permissions as granted')
          Alert.alert(
            'Warning',
            'Permissions were granted but could not be saved. The app may ask for permissions again.',
            [{ text: 'OK', onPress: () => navigation.replace('tabs') }]
          )
          return
        }
      } catch (error) {
        console.error('Error marking permissions as granted:', error)
        Alert.alert(
          'Warning',
          'Permissions were granted but could not be saved. The app may ask for permissions again.',
          [{ text: 'OK', onPress: () => navigation.replace('tabs') }]
        )
        return
      }

      // Navigate to tabs (data collection and upload services will start in tabs)
      navigation.replace('tabs')
    } catch (error) {
      console.error('Error requesting permissions:', error)
      setIsRequesting(false)
      Alert.alert('Error', 'Failed to request permissions. Please try again.')
    }
  }

  return (
    <View className="flex-1 bg-background dark:bg-black">
      <GridPatternBackground />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <Text className="text-4xl font-offBit101Bold text-text dark:text-white text-center mb-4">
            Permissions Required
          </Text>
          <Text className="text-base font-satoshi text-text/70 dark:text-white/70 text-center px-4">
            TruePing needs certain permissions to provide you with accurate network monitoring and device information.
          </Text>
        </View>

        <View className="space-y-6 mb-8">
          {/* Location Permission */}
          <View className="bg-white/5 dark:bg-white/5 rounded-lg p-5 border border-white/10">
            <View className="flex-row items-start mb-3">
              <View className="w-12 h-12 bg-[#E65300]/20 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">📍</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-satoshiBold text-text dark:text-white mb-1">
                  Location Access
                </Text>
                <Text className="text-sm font-satoshi text-text/70 dark:text-white/70">
                  Required for accurate network monitoring, device location tracking, and network analysis.
                </Text>
              </View>
            </View>
            {permissionsStatus.location && (
              <View className="mt-2">
                <Text className="text-xs font-satoshi text-[#E65300]">✓ Permission granted</Text>
              </View>
            )}
          </View>

          {/* Background Location Permission */}
          {Platform.OS === 'android' && Platform.Version >= 29 && (
            <View className="bg-white/5 dark:bg-white/5 rounded-lg p-5 border border-white/10">
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 bg-[#E65300]/20 rounded-full items-center justify-center mr-4">
                  <Text className="text-2xl">🔄</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-satoshiBold text-text dark:text-white mb-1">
                    Background Location
                  </Text>
                  <Text className="text-sm font-satoshi text-text/70 dark:text-white/70">
                    Allows TruePing to monitor your network and device status even when the app is in the background.
                  </Text>
                </View>
              </View>
              {permissionsStatus.backgroundLocation && (
                <View className="mt-2">
                  <Text className="text-xs font-satoshi text-[#E65300]">✓ Permission granted</Text>
                </View>
              )}
            </View>
          )}

          {/* Notification Permission */}
          <View className="bg-white/5 dark:bg-white/5 rounded-lg p-5 border border-white/10">
            <View className="flex-row items-start mb-3">
              <View className="w-12 h-12 bg-[#E65300]/20 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">🔔</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-satoshiBold text-text dark:text-white mb-1">
                  Notifications
                </Text>
                <Text className="text-sm font-satoshi text-text/70 dark:text-white/70">
                  Receive important alerts about network status, device information, and system updates.
                </Text>
              </View>
            </View>
            {permissionsStatus.notifications && (
              <View className="mt-2">
                <Text className="text-xs font-satoshi text-[#E65300]">✓ Permission granted</Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-8">
          <TouchableOpacity
            onPress={requestAllPermissions}
            disabled={isRequesting}
            className={`bg-[#E65300] rounded-lg py-4 px-6 items-center ${
              isRequesting ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-white font-satoshiBold text-lg">
              {isRequesting ? 'Requesting Permissions...' : 'Grant All Permissions'}
            </Text>
          </TouchableOpacity>

          <Text className="text-xs font-satoshi text-text/50 dark:text-white/50 text-center mt-4 px-4">
            These permissions are required for TruePing to function properly. You can manage them later in your device settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default PermissionsScreen

