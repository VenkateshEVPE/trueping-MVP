import Ping from 'react-native-ping'
import NetInfo from '@react-native-community/netinfo'

/**
 * Start live ping monitoring - pings continuously
 * @param {Function} onPingUpdate - Callback function that receives latency in ms
 * @returns {Function} Cleanup function to stop monitoring
 */
export const startLivePing = (onPingUpdate) => {
  // List of servers to try (fallback if one fails)
  const pingServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'] // Google DNS, Cloudflare, OpenDNS
  let currentServerIndex = 0
  let pingCount = 0
  let consecutiveFailures = 0
  let isActive = true

  const performLivePing = async () => {
    if (!isActive) return

    try {
      // Check network connectivity first
      const netInfo = await NetInfo.fetch()
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        console.warn('⚠️ No network connection, skipping ping')
        onPingUpdate(999) // Show error state
        consecutiveFailures++
        return
      }

      const pingServer = pingServers[currentServerIndex]
      
      try {
        const ms = await Ping.start(pingServer, { timeout: 3000 })

        // Validate ping result
        if (ms && ms > 0 && ms < 10000) {
          // Round to whole number and update
          const roundedLatency = Math.round(ms)
          onPingUpdate(roundedLatency)

          pingCount++
          consecutiveFailures = 0
          console.log(`🏓 Live ping #${pingCount} to ${pingServer}: ${roundedLatency}ms`)
        } else {
          throw new Error(`Invalid ping result: ${ms}ms`)
        }
      } catch (pingError) {
        const errorMessage = pingError.message || 'Unknown error'
        
        // If it's a host error, try next server
        if (errorMessage.includes('HostError') || errorMessage.includes('Unknown')) {
          consecutiveFailures++
          
          // Try next server
          currentServerIndex = (currentServerIndex + 1) % pingServers.length
          console.warn(`⚠️ Ping to ${pingServer} failed (${errorMessage}), trying next server: ${pingServers[currentServerIndex]}`)
          
          // If all servers failed, show error state
          if (consecutiveFailures >= pingServers.length * 2) {
            console.warn(`❌ All ping servers failed after ${consecutiveFailures} attempts`)
            onPingUpdate(999) // Show error state
            consecutiveFailures = 0 // Reset to try again
          }
        } else {
          // Other errors - show error state
          console.warn(`❌ Live ping to ${pingServer} failed:`, errorMessage)
          onPingUpdate(999) // Show error state
          consecutiveFailures++
        }
      }
    } catch (error) {
      console.warn(`❌ Live ping error:`, error.message)
      onPingUpdate(999) // Show error state
      consecutiveFailures++
    }
  }

  // Perform initial ping with a small delay to ensure network is ready
  setTimeout(() => {
    if (isActive) {
      performLivePing()
    }
  }, 1000)

  // Set up interval for continuous pinging (every 3 seconds to avoid overwhelming)
  const interval = setInterval(() => {
    if (isActive) {
      performLivePing()
    }
  }, 3000)

  // Return cleanup function
  return () => {
    isActive = false
    clearInterval(interval)
    console.log('🏓 Live ping interval cleared')
  }
}

/**
 * Perform a single ping test
 * @param {string} server - Server IP address or hostname
 * @param {number} timeout - Timeout in milliseconds (default: 2000)
 * @returns {Promise<number>} Latency in milliseconds
 */
export const performPing = async (server = '8.8.8.8', timeout = 2000) => {
  try {
    const ms = await Ping.start(server, { timeout })
    return Math.round(ms)
  } catch (error) {
    console.warn(`❌ Ping to ${server} failed:`, error.message)
    throw error
  }
}

/**
 * Perform speed test by pinging multiple servers
 * @returns {Promise<Object>} Speed test results with average and min latency
 */
export const performSpeedTest = async () => {
  try {
    console.log('🏓 Starting speed test with ping...')

    // Check network connectivity first
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      console.warn('⚠️ No network connection available for speed test')
      return null
    }

    // Test multiple servers to get average latency
    const servers = [
      { name: 'Google DNS', ip: '8.8.8.8' },
      { name: 'Cloudflare', ip: '1.1.1.1' },
      { name: 'OpenDNS', ip: '208.67.222.222' },
    ]

    const results = []

    for (const server of servers) {
      try {
        const startTime = Date.now()
        const ms = await Ping.start(server.ip, { timeout: 3000 })
        const endTime = Date.now()

        // Validate ping result
        if (ms && ms > 0 && ms < 10000) {
        results.push({
          server: server.name,
          ip: server.ip,
          latency: ms,
          testTime: endTime - startTime,
        })

        console.log(`✅ ${server.name} (${server.ip}): ${ms}ms`)
        } else {
          console.warn(`⚠️ ${server.name} (${server.ip}) returned invalid result: ${ms}ms`)
        }
      } catch (error) {
        const errorMessage = error.message || 'Unknown error'
        console.warn(`❌ ${server.name} (${server.ip}) failed:`, errorMessage)
        
        // Log specific error types for debugging
        if (errorMessage.includes('HostError') || errorMessage.includes('Unknown')) {
          console.warn(`  → This may indicate network connectivity issues with ${server.name}`)
        }
      }
    }

    if (results.length > 0) {
      const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length
      const minLatency = Math.min(...results.map(r => r.latency))

      return {
        type: 'speedTest',
        avgLatency: avgLatency,
        minLatency: minLatency,
        results: results,
        timestamp: new Date().toLocaleString(),
      }
    }

    return null
  } catch (error) {
    console.error('❌ Speed test failed:', error)
    throw error
  }
}

