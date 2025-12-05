/* eslint-disable react-native/no-inline-styles */
import { View, ScrollView, Dimensions, Animated, Alert, Text } from 'react-native'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetInfo } from '@react-native-community/netinfo'
import GridPatternBackground from '../../components/GridPatternBackground'

// Components
import StatusHeader from '../../components/home/StatusHeader'
import LatencyDisplay from '../../components/home/LatencyDisplay'
import MetricsBox from '../../components/home/MetricsBox'
import IPLatencyProofs from '../../components/home/IPLatencyProofs'
import LeftPanel from '../../components/home/LeftPanel'
import CircularGauge from '../../components/home/CircularGauge'
import NetworkPulseGraph from '../../components/home/NetworkPulseGraph'
import PerformanceGraph from '../../components/home/PerformanceGraph'
import VideoBackground from '../../components/home/VideoBackground'
import BottomGradient from '../../components/home/BottomGradient'

// Utils
import { fetchDeviceInfo } from '../../utils/deviceInfo'
import { initializeGaugeAngle, createGaugePanResponder } from '../../utils/gaugeUtils'
import { startPerformanceMonitoring } from '../../utils/performanceStats'
import { startLivePing } from '../../utils/pingUtils'

// Services
import {
  startBackgroundService,
  stopBackgroundService,
  isBackgroundServiceRunning,
  getLatestLocation,
  getLatestNetworkInfo,
  getLatestTrafficStats,
} from '../../services/BackgroundLocationService'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const VIDEO_HEIGHT = SCREEN_HEIGHT / 1.7

// Terminal loading lines for Home
const homeLoadingLines = [
  { prefix: 'root@trueping:~$ ', text: 'initializing system...', delay: 150 },
  { prefix: '', text: '[OK] Loading core modules', delay: 100 },
  { prefix: '', text: '[OK] Establishing secure connection', delay: 100 },
  { prefix: '', text: '[OK] Network protocols initialized', delay: 100 },
  { prefix: '', text: '[OK] Security layer activated', delay: 100 },
  { prefix: '', text: '[OK] Encryption enabled', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'initializing network...', delay: 150 },
  { prefix: '', text: '[OK] Loading device information', delay: 100 },
  { prefix: '', text: '[OK] Establishing network connection', delay: 100 },
  { prefix: '', text: '[OK] Network interface configured', delay: 100 },
  { prefix: '', text: '[OK] Connection established', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'scanning network...', delay: 150 },
  { prefix: '', text: '> Analyzing network topology', delay: 80 },
  { prefix: '', text: '> Target acquired', delay: 80 },
  { prefix: '', text: '> Firewall bypassed', delay: 80 },
  { prefix: '', text: '> Access granted', delay: 80 },
  { prefix: '', text: '> Connection established', delay: 80 },
  { prefix: 'root@trueping:~$ ', text: 'starting services...', delay: 150 },
  { prefix: '', text: '[OK] Starting performance monitoring', delay: 100 },
  { prefix: '', text: '[OK] Initializing ping service', delay: 100 },
  { prefix: '', text: '[OK] Loading monitoring tools', delay: 100 },
  { prefix: '', text: '[OK] Service layer ready', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'running diagnostics...', delay: 150 },
  { prefix: '', text: '> CPU: OK | Memory: OK | Network: OK', delay: 100 },
  { prefix: '', text: '> All systems operational', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'verifying security...', delay: 150 },
  { prefix: '', text: '> SSL certificate validated', delay: 80 },
  { prefix: '', text: '> Authentication successful', delay: 80 },
  { prefix: '', text: '> Security check passed', delay: 80 },
  { prefix: 'root@trueping:~$ ', text: 'launching trueping...', delay: 150 },
  { prefix: '', text: '> Loading application modules', delay: 80 },
  { prefix: '', text: '> Initializing user interface', delay: 80 },
  { prefix: '', text: '> Preparing data layer', delay: 80 },
  { prefix: '', text: '████████████████████████ 100%', delay: 100 },
  { prefix: '', text: 'System ready.', delay: 150 },
]

const Home = () => {
  const insets = useSafeAreaInsets()
  const [isChargingToggleOn, setIsChargingToggleOn] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState('wifi')
  const [timerMinutes, setTimerMinutes] = useState(0) // Timer value in minutes (0-45) - always start at 0
  const rotateAnim = useRef(new Animated.Value(0)).current
  const angleRef = useRef(0) // Track current angle in degrees
  const lastAngleRef = useRef(0) // Track last touch angle for incremental rotation
  const lastAnimatedDotRef = useRef(-1) // Track last large dot index we animated to

  // Use NetInfo hook to get network information
  const netInfoState = useNetInfo()

  // Device info state
  const [deviceInfo, setDeviceInfo] = useState({
    ipAddress: 'Loading...',
    deviceId: 'Loading...',
    cpuUsage: '0%',
    ramUsage: '0%',
  })

  // Ping latency state
  const [pingLatency, setPingLatency] = useState(null) // null means not started yet

  // Background service state
  const [isBackgroundServiceActive, setIsBackgroundServiceActive] = useState(false)
  const [backgroundLocation, setBackgroundLocation] = useState(null)
  const [backgroundNetworkInfo, setBackgroundNetworkInfo] = useState(null)
  const [backgroundTrafficStats, setBackgroundTrafficStats] = useState(null)

  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [displayedText, setDisplayedText] = useState('')
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [hasVideoError, setHasVideoError] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const cursorOpacity = useRef(new Animated.Value(1)).current
  const loadingStartTime = useRef(Date.now())
  const [dataLoaded, setDataLoaded] = useState(false)

  // Initialize angle - always start at 0 (270 degrees position)
  useEffect(() => {
    // Always initialize to 0 minutes, which positions 0 at 270 degrees
    const initialMinutes = 0
    const { minutes } = initializeGaugeAngle(initialMinutes, angleRef, rotateAnim, lastAnimatedDotRef)
    setTimerMinutes(minutes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Terminal animation effects
  useEffect(() => {
    if (!isLoading) return

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()

    // Cursor blink animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [isLoading, fadeAnim, cursorOpacity])

  useEffect(() => {
    if (!isLoading || currentLineIndex >= homeLoadingLines.length) {
      return
    }

    // Reset displayed text when starting a new line
    setDisplayedText('')
    
    const currentLine = homeLoadingLines[currentLineIndex]
    const fullText = currentLine.prefix + currentLine.text
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.substring(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1)
        }, currentLine.delay)
      }
    }, 5)

    return () => clearInterval(typeInterval)
  }, [currentLineIndex, isLoading])

  // Fetch device information
  useEffect(() => {
    const loadDeviceInfo = async () => {
      const info = await fetchDeviceInfo(netInfoState)
      setDeviceInfo((prev) => ({
        ...prev,
        ...info,
      }))
      // Mark data as loaded
      setDataLoaded(true)
    }

    loadDeviceInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netInfoState?.details?.ipAddress])

  // Ensure loading screen shows for at least 1 second
  useEffect(() => {
    if (!dataLoaded) return

    const checkMinimumTime = () => {
      const elapsed = Date.now() - loadingStartTime.current
      const minimumTime = 5000 // 5 seconds in milliseconds

      if (elapsed >= minimumTime) {
        setIsLoading(false)
      } else {
        // Wait for remaining time
        setTimeout(() => {
          setIsLoading(false)
        }, minimumTime - elapsed)
      }
    }

    checkMinimumTime()
  }, [dataLoaded])

  // Render terminal loading screen
  const renderTerminalLines = () => {
    return homeLoadingLines.slice(0, currentLineIndex).map((line, index) => {
      const fullLine = line.prefix + line.text
      return (
        <Text key={index} style={{ fontSize: 14, lineHeight: 20, fontFamily: 'monospace', color: '#E65300' }}>
          {fullLine}
        </Text>
      )
    })
  }

  // Start continuous performance monitoring for CPU and RAM
  useEffect(() => {
    const cleanup = startPerformanceMonitoring((stats) => {
      console.log('🔄 Updating device info with stats:', stats)
      setDeviceInfo((prev) => {
        const updated = {
          ...prev,
          cpuUsage: stats.cpuUsage,
          ramUsage: stats.ramUsage,
        }
        console.log('🔄 Updated deviceInfo state:', updated)
        return updated
      })
    })

    // Cleanup on unmount
    return cleanup
  }, [])

  // Start live ping monitoring
  useEffect(() => {
    console.log('🏓 Starting live ping monitoring...')
    const cleanup = startLivePing((latency) => {
      setPingLatency(latency)
    })
        
    // Cleanup on unmount
    return cleanup
  }, [])

  // Check background service status on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const isRunning = await isBackgroundServiceRunning()
        setIsBackgroundServiceActive(isRunning)
        console.log('📍 Background service status:', isRunning)
      } catch (error) {
        console.error('Error checking background service status:', error)
      }
    }
    checkServiceStatus()
  }, [])

  // Update background data in UI periodically when service is active
  useEffect(() => {
    if (isBackgroundServiceActive) {
      const updateBackgroundData = () => {
        const bgLocation = getLatestLocation()
        const bgNetwork = getLatestNetworkInfo()
        const bgTraffic = getLatestTrafficStats()

        if (bgLocation) {
          setBackgroundLocation(bgLocation)
          console.log('📍 Background Location Update:', bgLocation)
        }
        if (bgNetwork) {
          setBackgroundNetworkInfo(bgNetwork)
          console.log('📡 Background Network Update:', bgNetwork)
        }
        if (bgTraffic) {
          setBackgroundTrafficStats(bgTraffic)
          console.log('📊 Background Traffic Update:', bgTraffic)
        }
            }
            
      // Update immediately
      updateBackgroundData()

      // Set up interval to update every 2 seconds
      const interval = setInterval(updateBackgroundData, 2000)

      return () => {
        if (interval) {
          clearInterval(interval)
        }
      }
    }
  }, [isBackgroundServiceActive])
              
  // Expose handlers for potential UI controls (can be used later)
  // These are available but not currently used in UI
  // You can add buttons to start/stop background service if needed
  // handleStartBackgroundService and handleStopBackgroundService are ready to use

  // Create PanResponder for gauge rotation
  const panResponder = useRef(
    createGaugePanResponder({
      angleRef,
      lastAngleRef,
      lastAnimatedDotRef,
      rotateAnim,
      setTimerMinutes,
    })
  ).current

  // Video handlers
  const onBuffer = (data) => {
    console.log('Video buffering:', data.isBuffering)
  }

  const onError = (error) => {
    console.error('Video error:', error)
    // Set error state to hide video and show fallback
    setHasVideoError(true)
  }

  const onLoad = () => {
    console.log('Video loaded successfully')
  }

  // Background service handlers
  const handleStartBackgroundService = useCallback(async () => {
    try {
      const started = await startBackgroundService()
      if (started) {
        setIsBackgroundServiceActive(true)
        Alert.alert('Success', 'Background tracking started successfully!')
      }
    } catch (error) {
      console.error('Failed to start background service:', error)
      Alert.alert('Error', `Failed to start background service: ${error.message}`)
    }
  }, [])

  const handleStopBackgroundService = useCallback(async () => {
    try {
      const stopped = await stopBackgroundService()
      if (stopped) {
        setIsBackgroundServiceActive(false)
        setBackgroundLocation(null)
        setBackgroundNetworkInfo(null)
        setBackgroundTrafficStats(null)
        Alert.alert('Success', 'Background tracking stopped.')
      }
    } catch (error) {
      console.error('Failed to stop background service:', error)
      Alert.alert('Error', `Failed to stop background service: ${error.message}`)
    }
  }, [])

  // Show loading screen
  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        <Animated.View 
          className="flex-1 justify-between"
          style={{ opacity: fadeAnim, paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* Terminal content */}
          <View style={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15, flex: 1, backgroundColor: '#0a0a0a' }}>
            {renderTerminalLines()}
            {currentLineIndex < homeLoadingLines.length && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: 'monospace', color: '#E65300' }}>
                  {displayedText}
                </Text>
                <Animated.Text 
                  style={{ 
                    fontSize: 14, 
                    fontFamily: 'monospace', 
                    color: '#E65300',
                    opacity: cursorOpacity 
                  }}
                >
                  ▊
                </Animated.Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    )
  }
 
  return (
    <View className="flex-1 bg-background dark:bg-black">
      {/* Grid Pattern Background */}
      <GridPatternBackground />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: 200,
          minHeight: Math.max(VIDEO_HEIGHT + insets.top, 1129.36 + 170 + insets.top + 200),
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        {/* Video background - scrollable */}
        {!hasVideoError ? (
          <VideoBackground
            insets={insets}
            onBuffer={onBuffer}
            onError={onError}
            onLoad={onLoad}
          />
        ) : (
          <View style={{ 
            position: 'relative', 
            height: VIDEO_HEIGHT, 
            marginTop: insets.top,
            backgroundColor: '#000000'
          }} />
        )}

          {/* Content overlay on video */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}>
        {/* Status Container */}
          <StatusHeader insets={insets} />

          {/* Large Latency Display and IP Address */}
          <LatencyDisplay 
            insets={insets} 
            ipAddress={deviceInfo.ipAddress}
            pingLatency={pingLatency}
          />

        {/* Metrics Container */}
          <MetricsBox insets={insets} />

        {/* IP Latency Proofs Container */}
          <IPLatencyProofs 
            insets={insets} 
            deviceId={deviceInfo.deviceId}
            cpuUsage={deviceInfo.cpuUsage}
            ramUsage={deviceInfo.ramUsage}
          />

        {/* Left Panel - Proof Interval */}
          <LeftPanel
            insets={insets}
            isChargingToggleOn={isChargingToggleOn}
            setIsChargingToggleOn={setIsChargingToggleOn}
            selectedNetwork={selectedNetwork}
            setSelectedNetwork={setSelectedNetwork}
          />

        {/* Right Panel - Circular Gauge */}
          <CircularGauge
            insets={insets}
            rotateAnim={rotateAnim}
            panHandlers={panResponder.panHandlers}
            timerMinutes={timerMinutes}
          />

        {/* Network Pulse Graph */}
          <NetworkPulseGraph insets={insets} />

        {/* Performance Graph */}
          <PerformanceGraph insets={insets} />
        </View>    
      </ScrollView>
      
      {/* Bottom screen gradient */}
      <BottomGradient />
    </View>
  )
}

export default Home
