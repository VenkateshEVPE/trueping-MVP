import DeviceInfo from 'react-native-device-info'

/**
 * Helper function to safely get device info with fallback
 * @param {Function} deviceInfoCall - Async function to call
 * @param {*} fallback - Fallback value if call fails
 * @param {string} methodName - Name of the method for logging
 * @returns {*} Result of the call or fallback value
 */
export const safeDeviceInfoCall = async (deviceInfoCall, fallback, methodName) => {
  try {
    const result = await deviceInfoCall()
    return result || fallback
  } catch (error) {
    console.warn(`⚠️ ${methodName} failed:`, error.message)
    return fallback
  }
}

/**
 * Fetch device information (IP address, Device ID, CPU and RAM usage)
 * @param {Object} netInfoState - NetInfo state object
 * @returns {Promise<Object>} Device info object with ipAddress, deviceId, cpuUsage, and ramUsage
 */
export const fetchDeviceInfo = async (netInfoState) => {
  try {
    // Get device ID (unique ID)
    const deviceId = await safeDeviceInfoCall(
      async () => DeviceInfo.getUniqueId(),
      'Unknown Unique ID',
      'getUniqueId'
    )
    
    // Try multiple methods to get IP address
    let ipAddress = null
    
    // Method 1: Try async getIpAddress
    ipAddress = await safeDeviceInfoCall(
      async () => DeviceInfo.getIpAddress(),
      null,
      'getIpAddress'
    )
    
    console.log('📡 IP Address (Method 1 - async):', ipAddress)
    
    // Method 2: If Method 1 failed or returned invalid, try sync version
    if (!ipAddress || 
        ipAddress === 'Unknown' || 
        ipAddress === '0.0.0.0' || 
        ipAddress.trim() === '') {
      try {
        // Try sync version if available
        if (DeviceInfo.getIpAddressSync) {
          const syncIp = DeviceInfo.getIpAddressSync()
          console.log('📡 IP Address (Method 2 - sync):', syncIp)
          if (syncIp && 
              syncIp !== 'Unknown' && 
              syncIp !== '0.0.0.0' && 
              syncIp.trim() !== '') {
            ipAddress = syncIp
          }
        }
      } catch (syncError) {
        console.warn('⚠️ Sync IP method failed:', syncError.message)
      }
    }
    
    // Method 3: Try NetInfo as fallback
    if (!ipAddress || 
        ipAddress === 'Unknown' || 
        ipAddress === '0.0.0.0' || 
        ipAddress.trim() === '') {
      try {
        // Use NetInfo to get IP address from network details
        if (netInfoState?.details?.ipAddress) {
          ipAddress = netInfoState.details.ipAddress
          console.log('📡 IP Address (Method 3 - NetInfo):', ipAddress)
        }
      } catch (netInfoError) {
        console.warn('⚠️ NetInfo method failed:', netInfoError.message)
      }
    }
    
    // Method 4: Retry DeviceInfo after delay if still no IP
    if (!ipAddress || 
        ipAddress === 'Unknown' || 
        ipAddress === '0.0.0.0' || 
        ipAddress.trim() === '') {
      try {
        // Check if device is connected
        const isAirplaneMode = await safeDeviceInfoCall(
          async () => DeviceInfo.isAirplaneMode(),
          false,
          'isAirplaneMode'
        )
        
        if (!isAirplaneMode) {
          // Try getting IP again after a short delay (network might need time)
          await new Promise(resolve => setTimeout(resolve, 500))
          ipAddress = await safeDeviceInfoCall(
            async () => DeviceInfo.getIpAddress(),
            null,
            'getIpAddress-retry'
          )
          console.log('📡 IP Address (Method 4 - retry):', ipAddress)
        }
      } catch (retryError) {
        console.warn('⚠️ Retry method failed:', retryError.message)
      }
    }
    
    // Check if IP address is valid (not 'Unknown', '0.0.0.0', or empty)
    let formattedIp = 'N/A'
    if (ipAddress && 
        ipAddress !== 'Unknown' && 
        ipAddress !== '0.0.0.0' && 
        ipAddress.trim() !== '') {
      // Format IP address with spaces (matching the original format)
      formattedIp = ipAddress.split('.').join(' ')
      console.log('✅ formattedIp:', formattedIp)
    } else {
      console.log('⚠️ formattedIp unknown - IP address not available')
    }
    
    console.log('✅ deviceId:', deviceId)
    
    // Note: CPU and RAM are handled by continuous monitoring in Home component
    // We don't fetch them here to avoid conflicts with the continuous monitoring
    
    return {
      ipAddress: formattedIp,
      deviceId: deviceId || 'N/A',
      // CPU and RAM will be set by continuous monitoring
      cpuUsage: '0%',
      ramUsage: '0%',
    }
  } catch (error) {
    console.error('❌ Error fetching device info:', error)
    return {
      ipAddress: 'N/A',
      deviceId: 'N/A',
      cpuUsage: '0%',
      ramUsage: '0%',
    }
  }
}

