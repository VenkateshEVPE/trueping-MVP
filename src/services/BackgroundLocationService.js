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
 * Check if location permissions are already granted
 */
export const checkLocationPermissions = async () => {
  if (Platform.OS !== 'android') {
    return true
  }

  try {
    // Check foreground location permission
    const foregroundStatus = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    )

    if (!foregroundStatus) {
      return false
    }

    // Check background location permission (Android 10+)
    if (Platform.Version >= 29) {
      const backgroundStatus = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      )
      return backgroundStatus
    }

    return true
  } catch (err) {
    console.warn('Permission check error:', err)
    return false
  }
}

/**
 * Request location permissions
 * @param {boolean} showAlerts - Whether to show alert dialogs
 */
export const requestLocationPermissions = async (showAlerts = true) => {
  if (Platform.OS !== 'android') {
    return true
  }

  try {
    // First check if permissions are already granted
    const alreadyGranted = await checkLocationPermissions()
    if (alreadyGranted) {
      console.log('✅ Location permissions already granted')
      return true
    }

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
      if (showAlerts) {
        Alert.alert(
          'Permission Required',
          'Location permission is required for background tracking.'
        )
      } else {
        console.warn('⚠️ Location permission not granted')
      }
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
        if (showAlerts) {
          Alert.alert(
            'Background Permission Required',
            'Background location permission is required for continuous tracking.'
          )
        } else {
          console.warn('⚠️ Background location permission not granted')
        }
        return false
      }
    }

    console.log('✅ Location permissions granted')
    return true
  } catch (err) {
    console.error('❌ Permission request error:', err)
    return false
  }
}

/**
 * Get current location
 */
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    console.log('📍 getCurrentLocation called, requesting position...')
    
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
        console.log('✅ Background Location obtained:', location)
        resolve(location)
      },
      (error) => {
        console.error('❌ Location error in getCurrentLocation:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT,
        })
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
    console.log('📍 Location watch already active, watchId:', watchId)
    return // Already watching
  }

  console.log('📍 Starting location watch...')
  
  try {
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
        console.log('✅ Location Update from watch:', location)
      },
      (error) => {
        console.error('❌ Location watch error:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT,
        })
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 2000, // Fastest update every 2 seconds
      }
    )
    console.log('✅ Location watch started, watchId:', watchId)
  } catch (watchError) {
    console.error('❌ Failed to start location watch:', watchError)
    watchId = null
  }
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

  console.log('🚀 Background task started with delay:', delay || 5000)

  try {
    // Start watching location
    startLocationWatch()
    console.log('📍 Location watch started')

    // Get initial location immediately
    try {
      await getCurrentLocation()
      console.log('📍 Initial location obtained:', locationData)
    } catch (initialLocationError) {
      console.warn('⚠️ Failed to get initial location:', initialLocationError.message)
      console.warn('⚠️ Error code:', initialLocationError.code)
    }

    // Main loop
    while (BackgroundActions.isRunning()) {
      try {
        // Get location
        try {
          await getCurrentLocation()
        } catch (locationError) {
          console.warn('⚠️ Location error in background task:', locationError.message, 'Code:', locationError.code)
          // Continue even if location fails
        }

        // Get network info
        try {
          await getNetworkInfo()
        } catch (networkError) {
          console.warn('⚠️ Network info error in background task:', networkError.message)
        }

        // Get traffic stats
        try {
          await getTrafficStats()
        } catch (trafficError) {
          console.warn('⚠️ Traffic stats error in background task:', trafficError.message)
        }

        // Log combined data
        console.log('📦 Combined Data:', {
          location: locationData,
          network: networkData,
          traffic: trafficStatsData,
        })

        // Wait for the specified delay
        await new Promise((resolve) => setTimeout(resolve, delay || 5000))
      } catch (error) {
        console.error('❌ Background task loop error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        })
        // Continue running even if there's an error
        await new Promise((resolve) => setTimeout(resolve, delay || 5000))
      }
    }
  } catch (taskError) {
    console.error('❌ Background task fatal error:', taskError)
    console.error('❌ Fatal error details:', {
      message: taskError.message,
      stack: taskError.stack,
      name: taskError.name,
    })
  } finally {
    // Cleanup when task stops
    stopLocationWatch()
    console.log('🛑 Background task stopped')
  }
}

/**
 * Start background service
 */
export const startBackgroundService = async (showAlerts = false) => {
  try {
    console.log('🔍 Starting background service (showAlerts:', showAlerts, ')')
    
    // Check if already running
    const isRunning = await BackgroundActions.isRunning()
    if (isRunning) {
      console.log('✅ Background service already running')
      return true
    }

    // Check if permissions are already granted (don't request again if already granted)
    const hasPermission = await checkLocationPermissions()
    console.log('🔍 Location permissions check:', hasPermission)

    if (!hasPermission) {
      // Only request permissions if not already granted
      console.log('📍 Requesting location permissions...')
      const permissionGranted = await requestLocationPermissions(showAlerts)
      if (!permissionGranted) {
        if (showAlerts) {
          Alert.alert('Permission Denied', 'Cannot start background service without location permission.')
        } else {
          console.warn('⚠️ Cannot start background service without location permission')
        }
        return false
      }
    } else {
      console.log('✅ Location permissions already granted, proceeding to start service')
    }

    // Start the background task
    try {
      console.log('🚀 Attempting to start BackgroundActions...')
      await BackgroundActions.start(backgroundTask, backgroundTaskOptions)
      console.log('✅ Background service started successfully')
      
      // Give it a moment to initialize and get first location
      setTimeout(() => {
        const location = getLatestLocation()
        if (location) {
          console.log('✅ First location collected after 2s:', location)
        } else {
          console.warn('⚠️ No location data after 2 seconds, checking service status...')
          // Check if service is actually running
          BackgroundActions.isRunning().then((running) => {
            console.log('🔍 Background service running status:', running)
            if (running) {
              console.log('⚠️ Service is running but no location yet. This may be normal if location takes time.')
            } else {
              console.error('❌ Service is not running!')
            }
          })
        }
      }, 2000)
      
      // Also check after 5 seconds
      setTimeout(() => {
        const location = getLatestLocation()
        if (location) {
          console.log('✅ Location collected after 5s:', location)
        } else {
          console.warn('⚠️ Still no location after 5 seconds')
        }
      }, 5000)
      
      return true
    } catch (startError) {
      console.error('❌ Error starting BackgroundActions:', startError)
      console.error('❌ Start error details:', {
        message: startError.message,
        stack: startError.stack,
        name: startError.name,
      })
      throw startError
    }
  } catch (error) {
    console.error('❌ Failed to start background service:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    if (showAlerts) {
      Alert.alert('Error', `Failed to start background service: ${error.message}`)
    }
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
    const running = await BackgroundActions.isRunning()
    if (!running && locationData === null) {
      // Service might have been killed, log it
      console.warn('⚠️ Background service is not running and no location data available')
    }
    return running
  } catch (error) {
    console.error('❌ Error checking background service status:', error)
    return false
  }
}

/**
 * Ensure background service is running (restart if needed)
 * Useful for checking if service was killed by the system
 */
export const ensureBackgroundServiceRunning = async (showAlerts = false) => {
  try {
    const isRunning = await isBackgroundServiceRunning()
    if (!isRunning) {
      console.log('🔄 Background service not running, attempting to restart...')
      return await startBackgroundService(showAlerts)
    }
    return true
  } catch (error) {
    console.error('❌ Error ensuring background service is running:', error)
    return false
  }
}

/**
 * Get latest location data
 */
export const getLatestLocation = () => {
  if (locationData) {
    console.log('📍 getLatestLocation: Returning location data:', locationData)
  } else {
    console.log('📍 getLatestLocation: No location data available (locationData is null)')
    console.log('📍 Service status check - watchId:', watchId)
  }
  return locationData
}

/**
 * Wait for location data with timeout
 * @param {number} timeoutMs - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<object|null>} Location data or null if timeout
 */
export const waitForLocation = async (timeoutMs = 10000) => {
  return new Promise((resolve) => {
    if (locationData) {
      console.log('📍 Location already available:', locationData)
      resolve(locationData)
      return
    }

    console.log(`📍 Waiting for location data (timeout: ${timeoutMs}ms)...`)
    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (locationData) {
        console.log('✅ Location data received after', Date.now() - startTime, 'ms')
        clearInterval(checkInterval)
        resolve(locationData)
      } else if (Date.now() - startTime > timeoutMs) {
        console.warn('⚠️ Timeout waiting for location data')
        clearInterval(checkInterval)
        resolve(null)
      }
    }, 500) // Check every 500ms
  })
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

