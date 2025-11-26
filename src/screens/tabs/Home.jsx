/* eslint-disable react-native/no-inline-styles */
import { View, StyleSheet, Dimensions, Text, ScrollView, TouchableOpacity, Animated, PanResponder } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import Video from 'react-native-video'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Polygon, Line, Text as SvgText } from 'react-native-svg'
import LogoIcon from '../../components/icons/LogoIcon'
import GridPatternBackground from '../../components/GridPatternBackground'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const VIDEO_HEIGHT = SCREEN_HEIGHT / 1.7
const GRADIENT_HEIGHT = VIDEO_HEIGHT * 0.95 // 70% of video height for gradient
const GRADIENT_LAYERS = 20 // More layers for smoother gradient

const Home = () => {
  const videoRef = useRef(null)
  const insets = useSafeAreaInsets()
  const [isChargingToggleOn, setIsChargingToggleOn] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState('wifi')
  const [timerMinutes, setTimerMinutes] = useState(15) // Timer value in minutes (0-45)
  const rotateAnim = useRef(new Animated.Value(0)).current
  const angleRef = useRef(0) // Track current angle in degrees
  const lastAngleRef = useRef(0) // Track last touch angle for incremental rotation
  const lastAnimatedDotRef = useRef(-1) // Track last large dot index we animated to

  const background = require('../../../assets/videos/20251027-0446-31.7698841.mp4')

  // Initialize angle based on timer value
  // Pointer starts at bottom (270°), snap to nearest large dot position
  useEffect(() => {
    // Convert minutes to large dot index (0-11, 12 positions for 0-45 minutes)
    const largeDotIndex = Math.round((timerMinutes / 45) * 12) % 12
    const clampedLargeDotIndex = Math.max(0, Math.min(11, largeDotIndex))
    const minutes = Math.round((clampedLargeDotIndex / 12) * 45)
    const initialAngle = 270 + (minutes / 45) * 360
    angleRef.current = initialAngle
    rotateAnim.setValue(initialAngle)
    lastAnimatedDotRef.current = clampedLargeDotIndex
    setTimerMinutes(minutes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // Calculate angle from touch coordinates
  const getAngle = (x, y, centerX, centerY) => {
    const deltaX = x - centerX
    const deltaY = y - centerY
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    return (angle + 360) % 360
  }

  // PanResponder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        const centerX = 175
        const centerY = 175
        const distance = Math.sqrt(
          Math.pow(locationX - centerX, 2) + Math.pow(locationY - centerY, 2)
        )
        // Only respond if touch is on the outer ring
        return distance >= 70 && distance <= 130
      },
      onMoveShouldSetPanResponder: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        const centerX = 175
        const centerY = 175
        const distance = Math.sqrt(
          Math.pow(locationX - centerX, 2) + Math.pow(locationY - centerY, 2)
        )
        // Only respond if touch is on the outer ring
        return distance >= 70 && distance <= 130
      },
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        const centerX = 175
        const centerY = 175
        const distance = Math.sqrt(
          Math.pow(locationX - centerX, 2) + Math.pow(locationY - centerY, 2)
        )
        
        // Only respond if touch is on the outer ring area
        if (distance >= 70 && distance <= 130) {
          let angle = getAngle(locationX, locationY, centerX, centerY)
          lastAngleRef.current = angle
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        const centerX = 175
        const centerY = 175
        const distance = Math.sqrt(
          Math.pow(locationX - centerX, 2) + Math.pow(locationY - centerY, 2)
        )
        
        // Only update if touch is on the outer ring (between inner and outer circle edges)
        if (distance >= 70 && distance <= 130) {
          let angle = getAngle(locationX, locationY, centerX, centerY)
          
          // Calculate angle difference
          let angleDiff = angle - lastAngleRef.current
          
          // Handle wrap-around
          if (angleDiff > 180) angleDiff -= 360
          if (angleDiff < -180) angleDiff += 360
          
          // Get current large dot index (0-11, 12 positions) - use last animated dot as current position
          const currentLargeDotIndex = lastAnimatedDotRef.current >= 0 ? lastAnimatedDotRef.current : Math.round(((angleRef.current - 270 + 360) % 360) / 30) % 12
          
          // Prevent rotation below zero
          if (currentLargeDotIndex === 0 && angleDiff < 0) {
            return
          }
          
          // Only update if movement is significant (at least 15 degrees to snap to next large dot)
          if (Math.abs(angleDiff) >= 15) {
            // Determine next large dot index
            let nextLargeDotIndex = currentLargeDotIndex + (angleDiff > 0 ? 1 : -1)
            
            // Clamp to valid range (0-11)
            if (nextLargeDotIndex < 0) nextLargeDotIndex = 0
            if (nextLargeDotIndex > 11) nextLargeDotIndex = 11
            
            // Don't allow going below 0
            if (nextLargeDotIndex === 0 && currentLargeDotIndex === 0 && angleDiff < 0) {
              return
            }
            
            // Only animate if we're moving to a different large dot
            if (nextLargeDotIndex !== lastAnimatedDotRef.current) {
              // Convert large dot index to target angle
              // Each large dot is 30 degrees apart, starting from bottom (270°)
              const targetLargeDotIndex = nextLargeDotIndex
              const minutes = Math.round((targetLargeDotIndex / 12) * 45)
              const targetAngle = 270 + (minutes / 45) * 360
              
              // Stop any ongoing animation
              rotateAnim.stopAnimation((value) => {
                // Update angleRef to current animated value
                angleRef.current = value
              })
              
              // Update angleRef for next calculation
              angleRef.current = targetAngle
              
              // Update last animated dot
              lastAnimatedDotRef.current = targetLargeDotIndex
              
              // Update last angle
              lastAngleRef.current = angle
              
              // Animate to the next large dot position
              Animated.timing(rotateAnim, {
                toValue: targetAngle,
                duration: 200,
                useNativeDriver: true,
              }).start()
              
              setTimerMinutes(minutes)
            }
          }
        }
      },
      onPanResponderRelease: () => {
        // Snap to nearest large dot position (every 30 degrees)
        const adjustedAngle = (angleRef.current - 270 + 360) % 360
        const largeDotIndex = Math.round(adjustedAngle / 30) % 12
        const clampedLargeDotIndex = Math.max(0, Math.min(11, largeDotIndex))
        
        // Convert large dot index to minutes (0-45, 12 positions)
        const minutes = Math.round((clampedLargeDotIndex / 12) * 45)
        const targetAngle = 270 + (minutes / 45) * 360
        angleRef.current = targetAngle
        lastAnimatedDotRef.current = clampedLargeDotIndex
        
        Animated.timing(rotateAnim, {
          toValue: targetAngle,
          duration: 200,
          useNativeDriver: true,
        }).start()
        
        setTimerMinutes(minutes)
      },
    })
  ).current

  const onBuffer = (data) => {
    console.log('Video buffering:', data.isBuffering)
  }

  const onError = (error) => {
    console.error('Video error:', error)
  }

  const onLoad = () => {
    console.log('Video loaded successfully')
    if (videoRef.current) {
      videoRef.current.resume()
    }
  }
 
  return (
    <View className="flex-1 bg-background dark:bg-black">
      {/* Grid Pattern Background */}
      <GridPatternBackground />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: 200,
          minHeight: Math.max(VIDEO_HEIGHT + insets.top, 1129.36 + 170 + insets.top + 200), // Ensure enough height for all content
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {/* Video background - scrollable */}
        <View style={{ position: 'relative', height: VIDEO_HEIGHT, marginTop: insets.top }}>
          <Video
            source={background}
            ref={videoRef}
            onBuffer={onBuffer}
            onError={onError}
            onLoad={onLoad}
            style={styles.backgroundVideo}
            resizeMode="cover"
            repeat
            muted
            paused={false}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
          />
          
          {/* Top gradient overlay */}
          <View className="absolute left-0 right-0 overflow-hidden" style={{ top: 0, height: GRADIENT_HEIGHT }}>
            {[...Array(GRADIENT_LAYERS)].map((_, i) => (
              <View
                key={`top-${i}`}
                className="w-full bg-black"
                style={{
                  opacity: 1 - (i / GRADIENT_LAYERS),
                  height: GRADIENT_HEIGHT / GRADIENT_LAYERS,
                }}
              />
            ))}
          </View>

          {/* Bottom gradient overlay */}
          <View className="absolute left-0 right-0 overflow-hidden" style={{ top: VIDEO_HEIGHT - GRADIENT_HEIGHT, height: GRADIENT_HEIGHT }}>
            {[...Array(GRADIENT_LAYERS)].map((_, i) => (
              <View
                key={`bottom-${i}`}
                className="w-full bg-black"
                style={{
                  opacity: i / GRADIENT_LAYERS,
                  height: GRADIENT_HEIGHT / GRADIENT_LAYERS,
                }}
              />
            ))}
          </View>

          {/* Content overlay on video */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}>
        {/* Status Container */}
        <View className="absolute flex-row items-center justify-between w-full px-5" style={{ top: 30 + insets.top }}>
          <View className="items-start">
            <Text className="text-[14px] text-white font-satoshiMedium" style={{ letterSpacing: 0.15 }}>Status</Text>
            <Text className="text-[20px] text-[#e65300] font-offBit101Bold">Active_</Text>
          </View>
          <LogoIcon color="#e65300" size={33} />
        </View>

        {/* Large Latency Display and IP Address - aligned on same bottom line */}
        <View className="absolute flex-row items-baseline justify-between w-full px-5" style={{ top: 144.44 + insets.top }}>
          {/* Large Latency Display */}
          <View className="flex-row items-baseline">
            <Text className="text-white font-offBit101 text-[100px]" >20</Text>
            <Text className="text-white font-offBit ml-[10px] text-[54px]">ms</Text>
          </View>

          {/* IP Address */}
          <View className="items-baseline">
            <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
              <Text>IP </Text>
              <Text className="text-[#e65300] font-offBit101Bold">125 639 12. 54</Text>
            </Text>
          </View>
        </View>

     

        {/* Metrics Container */}
        <View className="absolute flex-col w-full px-5" style={{ top: 272.88 + insets.top, gap: 5 }}>
          {/* Single white box containing all three values */}
          <View className="bg-[#f6f6f6] px-[15px] py-[5px] flex-row items-center justify-between rounded-[5px]">
            {/* Samples Collected */}
            <View className="flex-1 items-center">
              <Text className="text-[14px] text-[#212322] font-offBit101Bold text-center" style={{ lineHeight: 20 }}>250</Text>
            </View>

            {/* Uptime */}
            <View className="flex-1 flex-row items-center justify-center gap-2" >
              <Text className="text-[14px] text-[#212322] font-offBit101Bold text-center" style={{ lineHeight: 20 }}>25%</Text>
            </View>

            {/* Avg Latency */}
            <View className="flex-1 items-center">
              <Text className="text-[14px] text-[#212322] font-offBit101Bold text-center" style={{ lineHeight: 20 }}>45ms</Text>
            </View>
          </View>

          {/* Labels below the box - aligned with values above */}
          <View className="flex-row items-center">
            <View className="flex-1 items-center">
              <Text className="text-[12px] text-white font-satoshi text-center" style={{ letterSpacing: 0.15 }}>Samples collected</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[12px] text-white font-satoshi text-center" style={{ letterSpacing: 0.15 }}>Uptime %</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[12px] text-white font-satoshi text-center" style={{ letterSpacing: 0.15 }}>Avg latency today</Text>
            </View>
          </View>
        </View>


        {/* IP Latency Proofs Container */}
        <View className="absolute flex-row items-baseline justify-between px-5" style={{ left: SCREEN_WIDTH / 2 - 183.3105, top: 373 + insets.top, width: 366.621 }}>
          <View className="items-start" style={{ gap: 5 }}>
            {/* Proofs submitted */}
            <View className="border border-white flex-row items-stretch relative" style={{ gap: 0 }}>
              <View className="px-[5px] py-[2px] justify-center">
                <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
                  <Text>Proofs submitted today </Text>    
                </Text>
              </View>
              <View className="bg-white px-[5px] justify-center">
                <Text className="text-[12px] text-[#212322] font-offBit101Bold" >452</Text>
              </View>
            </View>
            {/* Device ID */}
            <View className="border border-white h-[20px] flex-row items-baseline justify-start w-full" style={{ gap: 0 }}>
              <View className="bg-white px-1 h-full justify-center">
                <Text className="text-[12px] text-[#212322] font-satoshi" style={{ letterSpacing: 0.15 }}>
                  <Text>Device ID</Text>
                </Text>
              </View>
              <Text className="text-[12px] text-[#e65300] font-offBit101Bold px-5" style={{ letterSpacing: 0.15 }}>25697136402</Text>
            </View>
          </View>

          {/* CPU/RAM */}
          <View className="items-baseline w-[71px]" style={{ gap: 5 }}>
            <View className="absolute bg-white" style={{ height: 17.203, left: 36.1, top: 25.8, width: 36.582 }} />
            <View className="absolute bg-white" style={{ height: 17.203, left: 36.1, top: 1.8, width: 36.582 }} />
            <View className="flex-row items-baseline" style={{ gap: 0 }}>
              <Text className="text-[14px] text-white font-satoshi text-right" style={{ letterSpacing: 0.15 }}>
                <Text>CPU </Text>
              </Text>
              <Text className="text-[14px] text-[#212322] font-offBit101Bold text-right px-2" style={{ letterSpacing: 0.15 }}>80%</Text>
            </View>
            <View className="flex-row items-baseline" style={{ gap: 0 }}>
              <Text className="text-[14px] text-white font-satoshi text-right" style={{ letterSpacing: 0.15 }}>
                <Text>RAM </Text>
              </Text>
              <Text className="text-[14px] text-[#212322] font-offBit101Bold text-right px-2" style={{ letterSpacing: 0.15 }}>50%</Text>
            </View>
          </View>
        </View>

        {/* Left Panel - Proof Interval */}
        <View className="absolute items-center w-1/2" style={{ left: 14.34, top: 530.51 + insets.top, gap: 33 }} pointerEvents="box-none">
          {/* Proof Interval */}
          <View className="items-center" style={{ gap: 4 }}>
            <Text className="text-[16px] text-[#f6f6f6] font-satoshiMedium text-center" style={{ letterSpacing: 0.15 }}>Proof Interval</Text>
            <Text className="text-[16px] text-[#e65300] font-offBit101Bold text-center">15 : 02</Text>
          </View>

          {/* Toggle */}
          <View className="items-center" style={{ gap: 10 }} pointerEvents="box-none">
            <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: -0.2, lineHeight: 18 }}>Collect data while charging</Text>
            <TouchableOpacity
              onPress={() => {
                console.log('Toggle pressed, current state:', isChargingToggleOn)
                setIsChargingToggleOn(prev => {
                  console.log('Setting new state to:', !prev)
                  return !prev
                })
              }}
              className="rounded-full justify-center"
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ 
                height: 24.314, 
                width: 40, 
                padding: 1.55, 
                backgroundColor: isChargingToggleOn ? '#e65300' : '#5a5a5a',
                zIndex: 10
              }}
            >
              <View 
                className="bg-white rounded-full" 
                pointerEvents="none"
                style={{ 
                  width: 20.929, 
                  height: 20.929, 
                  alignSelf: isChargingToggleOn ? 'flex-end' : 'flex-start',
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 2.325 }, 
                  shadowOpacity: 0.15, 
                  shadowRadius: 6.201, 
                  elevation: 3 
                }} 
              />
            </TouchableOpacity>
          </View>

          {/* Network Type Selection */}
          <View className="items-center" style={{ gap: 5 }}>
            <View className="flex-row justify-between w-full">
              <Text className="text-[10px] text-white font-satoshi text-right w-[32.341px]" style={{ letterSpacing: -0.2 }}>Wi-Fi</Text>
              <Text className="text-[10px] text-white font-satoshi text-center w-[46.438px]" style={{ letterSpacing: -0.2 }}>5G</Text>
              <Text className="text-[10px] text-white font-satoshi text-right w-[52.52px]" style={{ letterSpacing: -0.2 }}>WI-FI + 5G</Text>
            </View>
            <View className="bg-[#282828] rounded-[5px] p-[2px] flex-row items-center" style={{ gap: 2 }}>
              <TouchableOpacity
                onPress={() => setSelectedNetwork('wifi')}
                activeOpacity={0.7}
                className={`w-12 h-[39px] items-center justify-center rounded-[3px] ${selectedNetwork === 'wifi' ? 'bg-[#e65300]' : ''}`}
              >
                <Text className="text-white text-xs">Wi-Fi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedNetwork('5g')}
                activeOpacity={0.7}
                className={`w-12 h-[39px] items-center justify-center rounded-[3px] ${selectedNetwork === '5g' ? 'bg-[#e65300]' : ''}`}
              >
                <Text className="text-white text-xs">5G</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedNetwork('wifi5g')}
                activeOpacity={0.7}
                className={`w-12 h-[39.357px] items-center justify-center rounded-[3px] ${selectedNetwork === 'wifi5g' ? 'bg-[#e65300]' : ''}`}
              >
                <Text className="text-white text-xs">Both</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right Panel - Circular Gauge */}
        <View 
          className="items-center justify-center absolute " 
          style={{ 
            left: SCREEN_WIDTH/2.1, 
            top: 450 + insets.top,
            
            opacity: 1
          }}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 720],
                    outputRange: ['0deg', '720deg'],
                  }),
                },
              ],
            }}
          >
            <Svg width={350} height={350} viewBox="0 0 3300 3300"> 
              {/* Outer larger circle (background) - thicker ring */}
              <Circle
                cx="1650"
                cy="1650"
                r="1250"
                fill="#212322"
              />
              {/* Inner circle with color #c4bfb5 - scaled proportionally to maintain original visual size */}
              <Circle
                cx="1650"
                cy="1650"
                r="710"
                fill="#C4BEB6"
              />
              {/* Tick marks around inner circle - classic analog watch style (dots) */}
              {Array.from({ length: 60 }, (_, i) => {
                const angle = (i * 6 - 90) * (Math.PI / 180) // Every 6 degrees (60 marks total)
                const isHourMark = i % 5 === 0 // Every 5th mark is a larger hour mark
                const radius = isHourMark ? 780 : 750 // Position dots at outer edge
                const x = 1650 + radius * Math.cos(angle)
                const y = 1650 + radius * Math.sin(angle)
                const dotRadius = isHourMark ? "15" : "8" // Larger dots for hours
                return (
                  <Circle
                    key={`tick-${i}`}
                    cx={x}
                    cy={y}
                    r={dotRadius}
                    fill="#000000"
                  />
                )
              })}
            </Svg>
          </Animated.View>
          <Svg width={350} height={350} viewBox="0 0 3300 3300" style={{ position: 'absolute' }}>
            {/* 4 angle numbers on outer circle - fixed, don't rotate */}
            {[0, 90, 180, 270].map((angle) => {
              const angleRad = (angle - 90) * (Math.PI / 180) // Convert to radians, adjust for SVG coordinate system
              const radius = 1320 // Position numbers outside the outer circle
              const x = 1650 + radius * Math.cos(angleRad)
              const y = 1650 + radius * Math.sin(angleRad)
              return (
                <SvgText
                  key={`angle-number-${angle}`}
                  x={x}
                  y={y}
                  fontSize="50"
                  fill="#C4BEB6"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {angle}
                </SvgText>
              )
            })}
            {/* White line - fixed horizontally, doesn't rotate */}
            <Line
              x1="550"
              y1="1650"
              x2="700"
              y2="1650"
              stroke="#C4BEB6"
              strokeWidth="10"
            />
            {/* Triangular pointer mark - fixed horizontally, doesn't rotate */}
            <Polygon
              points="500,1650 390,1600 390,1700"
              fill="#000000"
            />
          </Svg>
          <View className="absolute bg-[#212322] px-[10px] py-[8px] rounded-[3px]" style={{ top: 170, left: 175, transform: [{ translateX: -35 }, { translateY: -14 }] }}>
            <Text className="text-[12px] text-[#e65300] font-offBit101Bold text-center" style={{ letterSpacing: 0.15 }}>
            00 : 00
            </Text>
          </View>
        </View>

        {/* Network Pulse Graph */}
        <View className="absolute bg-black border border-[#5a5a5a] rounded-[5px] overflow-hidden" style={{ left: SCREEN_WIDTH / 2 - 183, top: 927.69 + insets.top, width: 366, height: 170 }}>
          <View className="absolute" style={{ top: 10.31, left: 10, gap: 2 }}>
            <Text className="text-[16px] text-white font-satoshiBold" style={{ letterSpacing: 0.15 }}>Network pulse</Text>
            <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
              <Text className="font-satoshiMedium">Lowest pulse recorded </Text>
              <Text className="font-offBit101Bold">20ms</Text>
            </Text>
          </View>
          <Text className="absolute text-[16px] text-[#e65300] font-offBitDotBold text-center" style={{ top: 73.92, left: 251.74, letterSpacing: 0.15, transform: [{ translateX: -50 }] }}>20</Text>
        </View>

        {/* Performance Graph */}
        <View className="absolute bg-black border border-[#5a5a5a] rounded-[5px] overflow-hidden" style={{ left: SCREEN_WIDTH / 2 - 183, top: 1129.36 + insets.top, width: 366, height: 170 }}>
          <View className="absolute" style={{ top: 10.31, left: 10, gap: 2 }}>
            <Text className="text-[16px] text-white font-satoshiBold" style={{ letterSpacing: 0.15 }}>Performance graph</Text>
            <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
              <Text className="font-satoshiMedium">Lowest pulse recorded </Text>
              <Text className="font-offBit101Bold">20ms</Text>
            </Text>
          </View>
          <Text className="absolute text-[16px] text-[#e65300] font-offBitDotBold text-center" style={{ top: 73.92, left: 251.74, letterSpacing: 0.15, transform: [{ translateX: -50 }] }}>20</Text>
        </View>
          </View>
        </View>    
      </ScrollView>
      
      {/* Bottom screen gradient - from transparent to full black */}
      <View 
        className="absolute left-0 right-0"
        style={{ 
          bottom: 0, 
          height: 200,
          pointerEvents: 'none',
          backgroundColor: 'transparent',
        }}
      >
        {[...Array(200)].map((_, i) => {
          const progress = i / 199 // 0 to 1
          const opacity = 1 - (progress * progress) // Reversed: full black at bottom, transparent at top
          return (
            <View
              key={`bottom-screen-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: (i / 200) * 200,
                height: 1,
                backgroundColor: `rgba(0, 0, 0, ${opacity})`,
              }}
            />
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  backgroundVideo: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: VIDEO_HEIGHT,
    right: 0,
    width: SCREEN_WIDTH,
  },
})

export default Home
