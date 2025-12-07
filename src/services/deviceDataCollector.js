import DeviceInfo from 'react-native-device-info'
import NetInfo from '@react-native-community/netinfo'
import Ping from 'react-native-ping'
import Geolocation from 'react-native-geolocation-service'
import { performSpeedTest } from '../utils/pingUtils'
import {
  insertDeviceData,
  getUnuploadedDeviceData,
  deleteDeviceDataByIds,
} from '../database/database'
import { uploadProofs } from './proofs/proofService'

/**
 * Helper function to safely get device info with fallback
 */
const safeDeviceInfoCall = async (deviceInfoCall, fallback, methodName) => {
  try {
    const result = await deviceInfoCall()
    return result || fallback
  } catch (error) {
    console.warn(`⚠️ ${methodName} failed:`, error.message)
    return fallback
  }
}

/**
 * Parse speed string to bytes per second
 * @param {string} speedString - Speed string like "1.5 MB/s" or "500 KB/s"
 * @returns {number} Bytes per second
 */
const parseSpeedToBytes = (speedString) => {
  if (!speedString || typeof speedString !== 'string') {
    return 0
  }

  try {
    const parts = speedString.trim().split(' ')
    if (parts.length < 2) return 0

    const value = parseFloat(parts[0])
    const unit = parts[1].toUpperCase()

    let multiplier = 1
    if (unit.includes('KB')) multiplier = 1024
    else if (unit.includes('MB')) multiplier = 1024 * 1024
    else if (unit.includes('GB')) multiplier = 1024 * 1024 * 1024

    return Math.round(value * multiplier)
  } catch (error) {
    console.warn('⚠️ Error parsing speed:', error)
    return 0
  }
}

/**
 * Format bytes to readable string
 * @param {number} bytes - Bytes value
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B/s'
  if (bytes < 1024) return `${bytes} B/s`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB/s`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB/s`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB/s`
}

/**
 * Collect comprehensive device and network information
 * @returns {Promise<Object>} Collected device and network data
 */
export const collectDeviceAndNetworkData = async () => {
  try {
    console.log('📊 Starting comprehensive data collection...')

    // Collect device information
    const deviceId = await safeDeviceInfoCall(
      async () => DeviceInfo.getDeviceId(),
      'Unknown',
      'getDeviceId'
    )

    const uniqueId = await safeDeviceInfoCall(
      async () => DeviceInfo.getUniqueId(),
      'Unknown',
      'getUniqueId'
    )

    const deviceName = await safeDeviceInfoCall(
      async () => DeviceInfo.getDeviceName(),
      'Unknown Device',
      'getDeviceName'
    )

    const os = await safeDeviceInfoCall(
      async () => DeviceInfo.getSystemName(),
      'Unknown OS',
      'getSystemName'
    )

    const osVersion = await safeDeviceInfoCall(
      async () => DeviceInfo.getSystemVersion(),
      'Unknown Version',
      'getSystemVersion'
    )

    // Collect network information
    const netInfoState = await NetInfo.fetch()
    const ipAddress = await safeDeviceInfoCall(
      async () => DeviceInfo.getIpAddress(),
      null,
      'getIpAddress'
    )

    // Get network type from NetInfo
    let networkType = 'unknown'
    if (netInfoState?.type) {
      networkType = netInfoState.type
    } else if (netInfoState?.details?.cellularGeneration) {
      networkType = `cellular-${netInfoState.details.cellularGeneration}`
    }

    // Get airplane mode
    const airplaneMode = await safeDeviceInfoCall(
      async () => DeviceInfo.isAirplaneMode(),
      false,
      'isAirplaneMode'
    )

    // Get internet reachable status
    const internetReachable = netInfoState?.isInternetReachable ?? false

    // Collect speed test data (latency)
    let avgLatency = null
    let bestLatency = null
    let serverTested = null

    try {
      const speedTestResult = await performSpeedTest()
      if (speedTestResult) {
        avgLatency = speedTestResult.avgLatency || null
        bestLatency = speedTestResult.minLatency || null
        if (speedTestResult.results && speedTestResult.results.length > 0) {
          serverTested = speedTestResult.results
            .map((r) => `${r.server} (${r.ip})`)
            .join(', ')
        }
      }
    } catch (speedTestError) {
      console.warn('⚠️ Speed test failed:', speedTestError.message)
    }

    // Collect upload and download speeds from traffic stats
    let uploadSpeed = null
    let downloadSpeed = null

    try {
      const trafficStats = await Ping.getTrafficStats()
      if (trafficStats) {
        console.log('📊 Raw traffic stats:', trafficStats)
        
        // Parse speed strings to bytes
        const uploadBytes = parseSpeedToBytes(trafficStats.sendNetworkSpeed)
        const downloadBytes = parseSpeedToBytes(trafficStats.receivedNetworkSpeed)

        console.log('📊 Parsed speeds:', { uploadBytes, downloadBytes })

        // Convert to readable format only if we have valid data
        if (uploadBytes > 0) {
          uploadSpeed = formatBytes(uploadBytes)
        }
        if (downloadBytes > 0) {
          downloadSpeed = formatBytes(downloadBytes)
        }

        // If speeds are still null/zero, try to estimate from latency
        if ((!uploadSpeed || uploadSpeed === '0 B/s') && (!downloadSpeed || downloadSpeed === '0 B/s')) {
          if (avgLatency !== null) {
            // Estimate speed based on latency (rough approximation)
            let estimatedSpeed = 0
            if (avgLatency < 50) estimatedSpeed = 50 * 1024 * 1024 // 50MB/s
            else if (avgLatency < 100) estimatedSpeed = 25 * 1024 * 1024 // 25MB/s
            else if (avgLatency < 200) estimatedSpeed = 10 * 1024 * 1024 // 10MB/s
            else if (avgLatency < 500) estimatedSpeed = 5 * 1024 * 1024 // 5MB/s
            else estimatedSpeed = 1 * 1024 * 1024 // 1MB/s

            downloadSpeed = formatBytes(estimatedSpeed)
            uploadSpeed = formatBytes(estimatedSpeed * 0.8) // Upload is typically slower
            console.log('📊 Estimated speeds from latency:', { downloadSpeed, uploadSpeed })
          }
        }
      } else {
        console.warn('⚠️ Traffic stats returned null/undefined')
      }
    } catch (trafficError) {
      console.warn('⚠️ Traffic stats failed:', trafficError.message)
      // Try to estimate from latency if available
      if (avgLatency !== null) {
        let estimatedSpeed = 0
        if (avgLatency < 50) estimatedSpeed = 50 * 1024 * 1024
        else if (avgLatency < 100) estimatedSpeed = 25 * 1024 * 1024
        else if (avgLatency < 200) estimatedSpeed = 10 * 1024 * 1024
        else if (avgLatency < 500) estimatedSpeed = 5 * 1024 * 1024
        else estimatedSpeed = 1 * 1024 * 1024

        downloadSpeed = formatBytes(estimatedSpeed)
        uploadSpeed = formatBytes(estimatedSpeed * 0.8)
        console.log('📊 Estimated speeds from latency (fallback):', { downloadSpeed, uploadSpeed })
      }
    }

    // If IP address is not available from DeviceInfo, try NetInfo
    let finalIpAddress = ipAddress
    if (!finalIpAddress || finalIpAddress === 'Unknown' || finalIpAddress === '0.0.0.0') {
      if (netInfoState?.details?.ipAddress) {
        finalIpAddress = netInfoState.details.ipAddress
      }
    }

    // Get location data directly (not from BackgroundLocationService)
    let latitude = null
    let longitude = null
    let altitude = null
    let accuracy = null

    try {
      console.log('📍 Getting location directly...')
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        )
      })

      latitude = position.coords.latitude || null
      longitude = position.coords.longitude || null
      altitude = position.coords.altitude || null
      accuracy = position.coords.accuracy || null
      console.log('✅ Location obtained directly:', { latitude, longitude, altitude, accuracy })
    } catch (locationError) {
      console.warn('⚠️ Direct location fetch failed:', {
        message: locationError.message,
        code: locationError.code,
      })
    }

    // Compile all data
    const collectedData = {
      deviceId: deviceId || 'Unknown',
      uniqueId: uniqueId || 'Unknown',
      deviceName: deviceName || 'Unknown Device',
      os: os || 'Unknown OS',
      osVersion: osVersion || 'Unknown Version',
      ipAddress: finalIpAddress || 'N/A',
      networkType: networkType || 'unknown',
      airplaneMode: airplaneMode || false,
      internetReachable: internetReachable || false,
      latitude: latitude,
      longitude: longitude,
      altitude: altitude,
      accuracy: accuracy,
      uploadSpeed: uploadSpeed || null,
      downloadSpeed: downloadSpeed || null,
      avgLatency: avgLatency || null,
      bestLatency: bestLatency || null,
      serverTested: serverTested || 'N/A',
      timestamp: Date.now(),
    }

    console.log('✅ Data collection complete:', collectedData)
    return collectedData
  } catch (error) {
    console.error('❌ Error collecting device and network data:', error)
    // Return a minimal data object instead of throwing to prevent crashes
    return {
      deviceId: 'Unknown',
      uniqueId: 'Unknown',
      deviceName: 'Unknown Device',
      os: 'Unknown OS',
      osVersion: 'Unknown Version',
      ipAddress: 'N/A',
      networkType: 'unknown',
      airplaneMode: false,
      internetReachable: false,
      latitude: null,
      longitude: null,
      altitude: null,
      accuracy: null,
      uploadSpeed: null,
      downloadSpeed: null,
      avgLatency: null,
      bestLatency: null,
      serverTested: 'N/A',
      timestamp: Date.now(),
    }
  }
}

/**
 * Collect and store device and network data in SQLite
 * @returns {Promise<boolean>} Success status
 */
export const collectAndStoreDeviceData = async () => {
  try {
    // Collect data
    const data = await collectDeviceAndNetworkData()

    // Store in database (database should already be initialized in App.jsx)
    const success = await insertDeviceData(data)

    if (success) {
      console.log('✅ Device data collected and stored successfully')
    } else {
      console.warn('⚠️ Failed to store device data')
    }

    return success
  } catch (error) {
    console.error('❌ Error in collectAndStoreDeviceData:', error)
    return false
  }
}

/**
 * Upload device data to server
 * @param {Array} deviceDataRecords - Array of device data records to upload
 * @returns {Promise<boolean>} Success status
 */
export const uploadDeviceDataToServer = async (deviceDataRecords) => {
  try {
    if (!deviceDataRecords || deviceDataRecords.length === 0) {
      return true // Nothing to upload
    }

    // Prepare data for upload (map SQLite records to proof format)
    const proofs = deviceDataRecords.map((record) => ({
      device_id: record.device_id || null,
      unique_id: record.unique_id || null,
      device_name: record.device_name || null,
      os: record.os || null,
      os_version: record.os_version || null,
      ip_address: record.ip_address || null,
      network_type: record.network_type || null,
      airplane_mode: record.airplane_mode === 1 ? 1 : 0,
      internet_reachable: record.internet_reachable === 1 ? 1 : 0,
      latitude: record.latitude || null,
      longitude: record.longitude || null,
      altitude: record.altitude || null,
      accuracy: record.accuracy || null,
      upload_speed: record.upload_speed || null,
      download_speed: record.download_speed || null,
      avg_latency: record.avg_latency || null,
      best_latency: record.best_latency || null,
      server_tested: record.server_tested || null,
      timestamp: record.timestamp || Date.now(),
    }))

    // Upload proofs using the proof service
    const result = await uploadProofs(proofs)

    // Increment proofs uploaded today count if upload was successful
    if (result.success && result.succeeded > 0) {
      try {
        const { incrementProofsUploadedToday } = require('../database/database')
        await incrementProofsUploadedToday(result.succeeded)
      } catch (incrementError) {
        console.warn('⚠️ Failed to increment proofs uploaded today:', incrementError.message)
      }
    }

    // Note: We don't increment samplesCollected here anymore
    // samplesCollected now represents all stored samples (incremented when stored)
    // This ensures accurate count of collected samples

    // Return true if at least one proof was uploaded successfully
    return result.success
  } catch (error) {
    console.error('❌ Error uploading device data to server:', error)
    return false
  }
}

/**
 * Collect, store, upload, and cleanup device data
 * @returns {Promise<boolean>} Success status
 */
export const collectStoreUploadAndCleanup = async () => {
  try {
    console.log('🔄 Starting collect, store, upload, and cleanup cycle...')
    
    // Step 1: Collect new data (with error handling)
    let collectedData = null
    try {
      collectedData = await collectDeviceAndNetworkData()
    } catch (collectionError) {
      console.error('❌ Error collecting device data:', collectionError)
      // Continue with upload of existing data even if collection fails
      collectedData = null
    }
    
    // Step 2: Store in database (only if we collected data)
    if (collectedData) {
      try {
        const stored = await insertDeviceData(collectedData)
        if (!stored) {
          console.warn('⚠️ Failed to store device data')
        } else {
          console.log('✅ Device data collected and stored successfully')
        }
      } catch (storeError) {
        console.error('❌ Error storing device data:', storeError)
        // Continue with upload even if store fails
      }
    }

    // Step 3: Get all unuploaded records (including the one we just stored)
    let unuploadedRecords = []
    try {
      unuploadedRecords = await getUnuploadedDeviceData(100) // Upload up to 100 records at a time
    } catch (fetchError) {
      console.error('❌ Error fetching unuploaded records:', fetchError)
      // If we can't fetch, just return - don't crash
      return false
    }

    if (unuploadedRecords.length > 0) {
      console.log(`📤 Found ${unuploadedRecords.length} unuploaded records, uploading to API...`)
      
      // Step 4: Upload all unuploaded records to server
      try {
        const uploadSuccess = await uploadDeviceDataToServer(unuploadedRecords)

        if (uploadSuccess) {
          // Step 5: Delete uploaded records from SQLite
          try {
            const idsToDelete = unuploadedRecords.map((record) => record.id)
            const deleteSuccess = await deleteDeviceDataByIds(idsToDelete)

            if (deleteSuccess) {
              console.log(`✅ Successfully uploaded and deleted ${unuploadedRecords.length} device data records`)
            } else {
              console.warn('⚠️ Upload successful but failed to delete records from SQLite')
            }
          } catch (deleteError) {
            console.error('❌ Error deleting uploaded records:', deleteError)
            // Don't crash - records will be uploaded again next time
          }
        } else {
          console.warn('⚠️ Upload failed, keeping records in SQLite for retry')
        }
      } catch (uploadError) {
        console.error('❌ Error uploading device data:', uploadError)
        // Don't crash - records will be retried next time
      }
    } else {
      console.log('ℹ️ No unuploaded device data records to upload')
    }

    return true
  } catch (error) {
    console.error('❌ Error in collectStoreUploadAndCleanup:', error)
    // Return false but don't throw - prevent crashes
    return false
  }
}

// Track upload service state
let uploadServiceInterval = null
let isUploadServiceRunning = false

/**
 * Upload existing unuploaded device data to server
 * This function only uploads pending data without collecting new data
 * @returns {Promise<boolean>} Success status
 */
export const uploadPendingDeviceData = async () => {
  try {
    // Get unuploaded records
    const unuploadedRecords = await getUnuploadedDeviceData(100) // Upload up to 100 records at a time

    if (unuploadedRecords.length > 0) {
      console.log(`📤 Uploading ${unuploadedRecords.length} pending device data records...`)
      
      // Upload to server
      const uploadSuccess = await uploadDeviceDataToServer(unuploadedRecords)

      if (uploadSuccess) {
        // Delete uploaded records from SQLite
        const idsToDelete = unuploadedRecords.map((record) => record.id)
        const deleteSuccess = await deleteDeviceDataByIds(idsToDelete)

        if (deleteSuccess) {
          console.log(`✅ Successfully uploaded and deleted ${unuploadedRecords.length} device data records`)
          return true
        } else {
          console.warn('⚠️ Upload successful but failed to delete records from SQLite')
          return false
        }
      } else {
        console.warn('⚠️ Upload failed, keeping records in SQLite for retry')
        return false
      }
    } else {
      console.log('ℹ️ No unuploaded device data records to upload')
      return true
    }
  } catch (error) {
    console.error('❌ Error uploading pending device data:', error)
    return false
  }
}

/**
 * Start periodic upload service (uploads pending data without collecting new data)
 * @param {number} intervalMs - Upload interval in milliseconds (default: 120000 = 2 minutes)
 * @returns {Function} Cleanup function to stop upload service
 */
export const startPeriodicUploadService = (intervalMs = 120000) => {
  // Prevent duplicate service starts
  if (isUploadServiceRunning && uploadServiceInterval) {
    console.log('⚠️ Upload service is already running, skipping duplicate start')
    return () => {
      // Return a no-op cleanup function
    }
  }

  console.log(`🔄 Starting periodic upload service (interval: ${intervalMs}ms = ${intervalMs / 1000} seconds)`)

  // Upload pending data immediately (without collecting new data)
  uploadPendingDeviceData().catch(error => {
    console.error('❌ Error in initial upload service call:', error)
  })

  // Set up interval to upload pending data every 2 minutes (without collecting new data)
  uploadServiceInterval = setInterval(() => {
    console.log(`⏰ Upload service tick - uploading pending data...`)
    uploadPendingDeviceData().catch(error => {
      console.error('❌ Error in periodic upload service call:', error)
    })
  }, intervalMs)
  
  isUploadServiceRunning = true

  // Return cleanup function
  return () => {
    if (uploadServiceInterval) {
      clearInterval(uploadServiceInterval)
      uploadServiceInterval = null
      isUploadServiceRunning = false
      console.log('🛑 Periodic upload service stopped')
    }
  }
}

/**
 * Start periodic data collection, upload, and cleanup
 * @param {number} intervalMs - Collection interval in milliseconds (default: 120000 = 2 minutes)
 * @returns {Function} Cleanup function to stop collection
 */
export const startPeriodicDataCollection = (intervalMs = 120000) => {
  console.log(`🔄 Starting periodic data collection (interval: ${intervalMs}ms = ${intervalMs / 60000} minutes)`)

  // Collect, store, upload, and cleanup immediately (with error handling)
  // Add a small delay to ensure permissions are ready
  setTimeout(() => {
    collectStoreUploadAndCleanup().catch(error => {
      console.error('❌ Error in initial data collection:', error)
      // Don't crash - continue with interval
    })
  }, 2000) // 2 second delay to ensure permissions are processed

  // Set up interval
  const interval = setInterval(() => {
    collectStoreUploadAndCleanup().catch(error => {
      console.error('❌ Error in periodic data collection:', error)
      // Don't crash - continue with next interval
    })
  }, intervalMs)

  // Return cleanup function
  return () => {
    clearInterval(interval)
    console.log('🛑 Periodic data collection stopped')
  }
}

