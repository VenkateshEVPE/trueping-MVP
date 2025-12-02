/* eslint-disable react-native/no-inline-styles */
import { View, ScrollView, Dimensions, Animated, Alert } from 'react-native'
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

  // Initialize angle - always start at 0 (270 degrees position)
  useEffect(() => {
    // Always initialize to 0 minutes, which positions 0 at 270 degrees
    const initialMinutes = 0
    const { minutes } = initializeGaugeAngle(initialMinutes, angleRef, rotateAnim, lastAnimatedDotRef)
    setTimerMinutes(minutes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch device information
  useEffect(() => {
    const loadDeviceInfo = async () => {
      const info = await fetchDeviceInfo(netInfoState)
      setDeviceInfo((prev) => ({
        ...prev,
        ...info,
      }))
    }

    loadDeviceInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netInfoState?.details?.ipAddress])

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
        <VideoBackground
          insets={insets}
            onBuffer={onBuffer}
            onError={onError}
            onLoad={onLoad}
        />

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
