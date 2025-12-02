/* eslint-disable react-native/no-inline-styles */
import { View, ScrollView, Dimensions, Animated } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const VIDEO_HEIGHT = SCREEN_HEIGHT / 1.7

const Home = () => {
  const insets = useSafeAreaInsets()
  const [isChargingToggleOn, setIsChargingToggleOn] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState('wifi')
  const [timerMinutes, setTimerMinutes] = useState(15) // Timer value in minutes (0-45)
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

  // Initialize angle based on timer value
  useEffect(() => {
    const { minutes } = initializeGaugeAngle(timerMinutes, angleRef, rotateAnim, lastAnimatedDotRef)
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
          <LatencyDisplay insets={insets} ipAddress={deviceInfo.ipAddress} />

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
