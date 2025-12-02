import Ping from 'react-native-ping'

/**
 * Start live ping monitoring - pings continuously
 * @param {Function} onPingUpdate - Callback function that receives latency in ms
 * @returns {Function} Cleanup function to stop monitoring
 */
export const startLivePing = (onPingUpdate) => {
  const pingServer = '8.8.8.8' // Use Google DNS for live ping
  let pingCount = 0

  const performLivePing = async () => {
    try {
      const ms = await Ping.start(pingServer, { timeout: 2000 })

      // Round to whole number and update
      const roundedLatency = Math.round(ms)
      onPingUpdate(roundedLatency)

      pingCount++
      console.log(`🏓 Live ping #${pingCount}: ${roundedLatency}ms`)
    } catch (error) {
      console.warn(`❌ Live ping failed:`, error.message)
      onPingUpdate(999) // Show error state
    }
  }

  // Perform initial ping
  performLivePing()

  // Set up interval for continuous pinging (every 2 seconds)
  const interval = setInterval(performLivePing, 2000)

  // Return cleanup function
  return () => {
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

        results.push({
          server: server.name,
          ip: server.ip,
          latency: ms,
          testTime: endTime - startTime,
        })

        console.log(`✅ ${server.name} (${server.ip}): ${ms}ms`)
      } catch (error) {
        console.warn(`❌ ${server.name} (${server.ip}) failed:`, error.message)
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

