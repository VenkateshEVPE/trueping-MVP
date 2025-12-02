import PerformanceStats from 'react-native-performance-stats'
import DeviceInfo from 'react-native-device-info'

/**
 * Parse performance stats from the library and convert to percentages
 * @param {Object} stats - Raw stats object from PerformanceStats
 * @returns {Promise<Object>} Parsed stats with cpuUsage and ramUsage as percentages
 */
const parsePerformanceStats = async (stats) => {
  // Log raw values for debugging
  console.log('📊 RAW Performance Stats:', {
    usedCpu: stats.usedCpu,
    usedRam: stats.usedRam,
    fullStats: stats,
  })

  let cpuUsage = 0
  let ramUsage = 0
  
  // Convert CPU to percentage
  // Based on logs: usedCpu values are 116, 128, 120, 124
  // These appear to be CPU time in milliseconds per second (or percentage * 10)
  // Common interpretation: 120 = 12% CPU usage (divide by 10)
  if (stats.usedCpu !== undefined) {
    const rawCpu = typeof stats.usedCpu === 'number' ? stats.usedCpu : parseFloat(stats.usedCpu) || 0
    // Convert to percentage: divide by 10 (120 -> 12%)
    cpuUsage = rawCpu / 10
    console.log('🔍 CPU Conversion:', rawCpu, '/ 10 =', cpuUsage, '%')
  } else if (stats.cpu !== undefined) {
    cpuUsage = typeof stats.cpu === 'number' ? stats.cpu : parseFloat(stats.cpu) || 0
  } else if (stats.cpuUsage !== undefined) {
    cpuUsage = typeof stats.cpuUsage === 'number' ? stats.cpuUsage : parseFloat(stats.cpuUsage) || 0
  } else if (stats.cpuPercent !== undefined) {
    cpuUsage = typeof stats.cpuPercent === 'number' ? stats.cpuPercent : parseFloat(stats.cpuPercent) || 0
  }
  
  // Convert RAM to percentage
  // Based on logs: usedRam values are ~1800-1840 MB
  // Need total RAM to calculate percentage
  if (stats.usedRam !== undefined) {
    try {
      const usedRamMB = typeof stats.usedRam === 'number' ? stats.usedRam : parseFloat(stats.usedRam) || 0
      console.log('🔍 RAM Raw Value:', usedRamMB, 'MB')
      
      // Get total RAM from DeviceInfo (in bytes, convert to MB)
      const totalRamBytes = await DeviceInfo.getTotalMemory()
      const totalRamMB = totalRamBytes / (1024 * 1024) // Convert bytes to MB
      console.log('🔍 RAM Total:', totalRamMB, 'MB (from', totalRamBytes, 'bytes)')
      
      if (totalRamMB > 0) {
        ramUsage = (usedRamMB / totalRamMB) * 100
        console.log('🔍 RAM Percentage:', usedRamMB, '/', totalRamMB, '* 100 =', ramUsage, '%')
      } else {
        // Fallback: if we can't get total RAM, return 0
        ramUsage = 0
        console.warn('⚠️ Could not get total RAM, setting RAM usage to 0%')
      }
    } catch (error) {
      console.warn('⚠️ Error calculating RAM percentage:', error)
      ramUsage = 0
    }
  } else if (stats.memory !== undefined) {
    ramUsage = typeof stats.memory === 'number' ? stats.memory : parseFloat(stats.memory) || 0
  } else if (stats.ramUsage !== undefined) {
    ramUsage = typeof stats.ramUsage === 'number' ? stats.ramUsage : parseFloat(stats.ramUsage) || 0
  } else if (stats.ramPercent !== undefined) {
    ramUsage = typeof stats.ramPercent === 'number' ? stats.ramPercent : parseFloat(stats.ramPercent) || 0
  }
  
  // Ensure values are between 0 and 100
  cpuUsage = Math.max(0, Math.min(100, cpuUsage))
  ramUsage = Math.max(0, Math.min(100, ramUsage))
  
  console.log('📊 Converted Values:', { cpuUsage: `${cpuUsage.toFixed(1)}%`, ramUsage: `${ramUsage.toFixed(1)}%` })

  return {
    cpuUsage: Math.round(cpuUsage),
    ramUsage: Math.round(ramUsage),
  }
}

/**
 * Start performance monitoring and get CPU/RAM usage
 * @returns {Promise<Object>} Object with cpuUsage and ramUsage percentages
 */
export const getPerformanceStats = async () => {
  try {
    return new Promise((resolve) => {
      // Start monitoring with CPU usage enabled
      PerformanceStats.start(true)

      // Set up listener for performance stats
      const listener = PerformanceStats.addListener(async (stats) => {
        try {
          const parsed = await parsePerformanceStats(stats)
          
          const formattedCpu = `${parsed.cpuUsage}%`
          const formattedRam = `${parsed.ramUsage}%`

          console.log('📊 Performance Stats:', { cpuUsage: formattedCpu, ramUsage: formattedRam, rawStats: stats })

          // Remove listener and stop monitoring after getting first reading
          if (listener && typeof listener.remove === 'function') {
            listener.remove()
          }
          PerformanceStats.stop()

          resolve({
            cpuUsage: formattedCpu,
            ramUsage: formattedRam,
          })
        } catch (error) {
          console.warn('⚠️ Error parsing performance stats:', error)
          if (listener && typeof listener.remove === 'function') {
            listener.remove()
          }
          PerformanceStats.stop()
          resolve({
            cpuUsage: '0%',
            ramUsage: '0%',
          })
        }
      })

      // Set a timeout in case stats don't arrive
      setTimeout(() => {
        try {
          if (listener && typeof listener.remove === 'function') {
            listener.remove()
          }
          PerformanceStats.stop()
        } catch (e) {
          // Ignore errors during cleanup
        }
        resolve({
          cpuUsage: '0%',
          ramUsage: '0%',
        })
      }, 3000) // 3 second timeout
    })
  } catch (error) {
    console.error('❌ Error getting performance stats:', error)
    return {
      cpuUsage: '0%',
      ramUsage: '0%',
    }
  }
}

/**
 * Start continuous performance monitoring
 * @param {Function} callback - Callback function that receives stats object
 * @returns {Function} Cleanup function to stop monitoring
 */
export const startPerformanceMonitoring = (callback) => {
  try {
    PerformanceStats.start(true)

    const listener = PerformanceStats.addListener(async (stats) => {
      try {
        const parsed = await parsePerformanceStats(stats)
        
        const cpuUsageStr = `${parsed.cpuUsage}%`
        const ramUsageStr = `${parsed.ramUsage}%`
        
        console.log('📤 Sending to callback:', { cpuUsage: cpuUsageStr, ramUsage: ramUsageStr })
        
        // Display as percentages
        callback({
          cpuUsage: cpuUsageStr,
          ramUsage: ramUsageStr,
          rawStats: stats,
        })
      } catch (error) {
        console.warn('⚠️ Error parsing performance stats:', error)
      }
    })

    // Return cleanup function
    return () => {
      try {
        if (listener && typeof listener.remove === 'function') {
          listener.remove()
        }
        PerformanceStats.stop()
      } catch (error) {
        console.warn('⚠️ Error stopping performance monitoring:', error)
      }
    }
  } catch (error) {
    console.error('❌ Error starting performance monitoring:', error)
    return () => {} // Return no-op cleanup function
  }
}

