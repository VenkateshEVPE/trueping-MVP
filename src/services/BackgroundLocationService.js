/**
 * Background Location and Network Monitoring Service
 * Based on: https://medium.com/@kprshnt23/background-foreground-geolocation-fetching-on-react-native-0af2e762b44c
 */

import Geolocation from 'react-native-geolocation-service'
import BackgroundActions from 'react-native-background-actions'
import NetInfo from '@react-native-community/netinfo'
import Ping from 'react-native-ping'
import DeviceInfo from 'react-native-device-info'
import { Platform, PermissionsAndroid, Alert } from 'react-native'

// Background task options
const backgroundTaskOptions = {
  taskName: 'BackgroundLocationNetworkMonitor',
  taskTitle: 'Tracking Location & Network',
  taskDesc: 'Monitoring your location and network status',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'trueping://',
  parameters: {
    delay: 5000, // 5 seconds interval
  },
}

// Storage for location and network data
let locationData = null
let networkData = null
let trafficStatsData = null

/**
 * Request location permissions
 */
export const requestLocationPermissions = async () => {
  if (Platform.OS !== 'android') {
    return true
  }

  try {
    // Request foreground location permission
    const foregroundGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location to track it in the background.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    )

    if (foregroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Permission Required',
        'Location permission is required for background tracking.'
      )
      return false
    }

    // Request background location permission (Android 10+)
    if (Platform.Version >= 29) {
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message:
            'This app needs access to your location even when the app is closed or not in use.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      )

      if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Background Permission Required',
          'Background location permission is required for continuous tracking.'
        )
        return false
      }
    }

    return true
  } catch (err) {
    console.warn('Permission request error:', err)
    return false
  }
}

/**
 * Get current location
 */
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || null,
          accuracy: position.coords.accuracy || null,
          speed: position.coords.speed || null,
          heading: position.coords.heading || null,
          timestamp: position.timestamp,
        }
        locationData = location
        console.log('📍 Background Location:', location)
        resolve(location)
      },
      (error) => {
        console.error('❌ Location error:', error)
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 10, // Update every 10 meters
      }
    )
  })
}

/**
 * Watch location updates
 */
let watchId = null
const startLocationWatch = () => {
  if (watchId !== null) {
    return // Already watching
  }

  watchId = Geolocation.watchPosition(
    (position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || null,
        accuracy: position.coords.accuracy || null,
        speed: position.coords.speed || null,
        heading: position.coords.heading || null,
        timestamp: position.timestamp,
      }
      locationData = location
      console.log('📍 Location Update:', location)
    },
    (error) => {
      console.error('❌ Location watch error:', error)
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Update every 10 meters
      interval: 5000, // Update every 5 seconds
      fastestInterval: 2000, // Fastest update every 2 seconds
    }
  )
}

/**
 * Stop location watch
 */
const stopLocationWatch = () => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId)
    watchId = null
    console.log('📍 Location watch stopped')
  }
}

/**
 * Get network information
 */
const getNetworkInfo = async () => {
  try {
    // Get NetInfo state
    const netInfoState = await NetInfo.fetch()

    // Get additional network info from DeviceInfo
    const ipAddress = await DeviceInfo.getIpAddress()
    const carrier = await DeviceInfo.getCarrier()
    const isAirplaneMode = await DeviceInfo.isAirplaneMode()

    const networkInfo = {
      ...netInfoState,
      ipAddress: ipAddress !== 'Unknown' ? ipAddress : null,
      carrier: carrier !== 'Unknown' ? carrier : null,
      isAirplaneMode,
      timestamp: Date.now(),
    }

    networkData = networkInfo
    console.log('📡 Network Info:', networkInfo)
    return networkInfo
  } catch (error) {
    console.error('❌ Network info error:', error)
    return null
  }
}

/**
 * Get traffic statistics
 */
const getTrafficStats = async () => {
  try {
    const stats = await Ping.getTrafficStats()

    const trafficStats = {
      receivedNetworkSpeed: stats.receivedNetworkSpeed || '0 B/s',
      sendNetworkSpeed: stats.sendNetworkSpeed || '0 B/s',
      receivedNetworkTotal: stats.receivedNetworkTotal || '0 B',
      sendNetworkTotal: stats.sendNetworkTotal || '0 B',
      timestamp: Date.now(),
    }

    trafficStatsData = trafficStats
    console.log('📊 Traffic Stats:', trafficStats)
    return trafficStats
  } catch (error) {
    console.error('❌ Traffic stats error:', error)
    return null
  }
}

/**
 * Background task that runs continuously
 */
const backgroundTask = async (taskData) => {
  const { delay } = taskData

  console.log('🚀 Background task started')

  // Start watching location
  startLocationWatch()

  // Main loop
  while (BackgroundActions.isRunning()) {
    try {
      // Get location
      await getCurrentLocation()

      // Get network info
      await getNetworkInfo()

      // Get traffic stats
      await getTrafficStats()

      // Log combined data
      console.log('📦 Combined Data:', {
        location: locationData,
        network: networkData,
        traffic: trafficStatsData,
      })

      // Wait for the specified delay
      await new Promise((resolve) => setTimeout(resolve, delay || 5000))
    } catch (error) {
      console.error('❌ Background task error:', error)
      // Continue running even if there's an error
      await new Promise((resolve) => setTimeout(resolve, delay || 5000))
    }
  }

  // Cleanup when task stops
  stopLocationWatch()
  console.log('🛑 Background task stopped')
}

/**
 * Start background service
 */
export const startBackgroundService = async () => {
  try {
    // Check if already running
    if (await BackgroundActions.isRunning()) {
      console.log('⚠️ Background service already running')
      return true
    }

    // Request permissions first
    const hasPermission = await requestLocationPermissions()
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot start background service without location permission.')
      return false
    }

    // Start the background task
    await BackgroundActions.start(backgroundTask, backgroundTaskOptions)
    console.log('✅ Background service started')
    return true
  } catch (error) {
    console.error('❌ Failed to start background service:', error)
    Alert.alert('Error', `Failed to start background service: ${error.message}`)
    return false
  }
}

/**
 * Stop background service
 */
export const stopBackgroundService = async () => {
  try {
    if (await BackgroundActions.isRunning()) {
      await BackgroundActions.stop()
      stopLocationWatch()
      console.log('✅ Background service stopped')
      return true
    }
    console.log('⚠️ Background service is not running')
    return false
  } catch (error) {
    console.error('❌ Failed to stop background service:', error)
    return false
  }
}

/**
 * Check if background service is running
 */
export const isBackgroundServiceRunning = async () => {
  try {
    return await BackgroundActions.isRunning()
  } catch (error) {
    console.error('❌ Error checking background service status:', error)
    return false
  }
}

/**
 * Get latest location data
 */
export const getLatestLocation = () => {
  return locationData
}

/**
 * Get latest network data
 */
export const getLatestNetworkInfo = () => {
  return networkData
}

/**
 * Get latest traffic stats
 */
export const getLatestTrafficStats = () => {
  return trafficStatsData
}

