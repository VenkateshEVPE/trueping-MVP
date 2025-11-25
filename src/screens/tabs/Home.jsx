/* eslint-disable react-native/no-inline-styles */
import { View, StyleSheet, Dimensions, Text, ScrollView, Image, TouchableOpacity } from 'react-native'
import React, { useRef, useState } from 'react'
import Video from 'react-native-video'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoIcon from '../../components/icons/LogoIcon'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const VIDEO_HEIGHT = SCREEN_HEIGHT / 1.7
const GRADIENT_HEIGHT = VIDEO_HEIGHT * 0.95 // 70% of video height for gradient
const GRADIENT_LAYERS = 20 // More layers for smoother gradient

// Image URLs from Figma
const imgGroup2 = "https://www.figma.com/api/mcp/asset/0a76f91d-0396-4e06-be65-1ef497f14400"
const imgHeroiconsSolidWifi = "https://www.figma.com/api/mcp/asset/5f37f93b-5ab0-43e5-a80a-48c577c37bce"
const imgFluentCellular5G24Filled = "https://www.figma.com/api/mcp/asset/9bcc8dc7-08ae-4007-851d-d6f857260128"
const imgStreamlineCellularNetwork5GSolid = "https://www.figma.com/api/mcp/asset/fed257fa-9b2d-411f-af6d-e6fc9e879776"
const imgEllipse61 = "https://www.figma.com/api/mcp/asset/c626909b-013d-421d-ba8e-e2d921d92874"
const imgStar1 = "https://www.figma.com/api/mcp/asset/0ce1db46-a2a8-47f1-878f-da30cfac6798"
const imgEllipse62 = "https://www.figma.com/api/mcp/asset/5bd0bb4d-f1c2-4bea-ae50-3ab3cee04657"
const imgVector16 = "https://www.figma.com/api/mcp/asset/57a2da8b-59ef-426d-9dff-ea3e8fc162ca"
const imgVector17 = "https://www.figma.com/api/mcp/asset/f0f6be1a-1ca8-4519-97bc-05ed9bd3c139"
const imgVector18 = "https://www.figma.com/api/mcp/asset/ae3da8a2-7adc-4b8d-8519-a366f5b73288"
const imgGroup46 = "https://www.figma.com/api/mcp/asset/0056667e-825d-4417-a28e-0d05207b2155"
const imgVector = "https://www.figma.com/api/mcp/asset/76947382-2aea-4c93-9919-da759141af4d"
const imgGroup47 = "https://www.figma.com/api/mcp/asset/eac1dddb-114a-4b08-b37a-2958d9267552"



const Home = () => {
  const videoRef = useRef(null)
  const insets = useSafeAreaInsets()
  const [isChargingToggleOn, setIsChargingToggleOn] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState('wifi')

  const background = require('../../../assets/videos/20251027-0446-31.7698841.mp4')

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
      <Video
        source={background}
        ref={videoRef}
        onBuffer={onBuffer}
        onError={onError}
        onLoad={onLoad}
        style={[styles.backgroundVideo, { top: insets.top, zIndex: 0 }]}
        resizeMode="cover"
        repeat
        muted
        paused={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
      />
      
      {/* Top gradient overlay */}
      <View className="absolute left-0 right-0 overflow-hidden" style={{ top: insets.top, height: GRADIENT_HEIGHT }}>
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
      <View className="absolute left-0 right-0 overflow-hidden" style={{ top: insets.top + VIDEO_HEIGHT - GRADIENT_HEIGHT, height: GRADIENT_HEIGHT }}>
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
      <ScrollView 
        className="flex-1 absolute top-0 left-0 right-0 bottom-0"
        contentContainerStyle={{ 
          paddingTop: insets.top, 
          paddingBottom: 200, 
          minHeight: 1129.36 + 170 + insets.top + 200 // Performance Graph bottom + padding
        }}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 1 }}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
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
              <Image source={{ uri: imgGroup2 }} className="w-[14px] h-[14px]" />
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
                <Image source={{ uri: imgHeroiconsSolidWifi }} className="w-12 h-[39px]" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedNetwork('5g')}
                activeOpacity={0.7}
                className={`w-12 h-[39px] items-center justify-center rounded-[3px] ${selectedNetwork === '5g' ? 'bg-[#e65300]' : ''}`}
              >
                <Image source={{ uri: imgFluentCellular5G24Filled }} className="w-12 h-[39px]" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedNetwork('wifi5g')}
                activeOpacity={0.7}
                className={`w-12 h-[39.357px] items-center justify-center rounded-[3px] ${selectedNetwork === 'wifi5g' ? 'bg-[#e65300]' : ''}`}
              >
                <Image source={{ uri: imgStreamlineCellularNetwork5GSolid }} className="w-12 h-[39.357px]" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right Panel - Circular Gauge */}
        <View className="absolute items-center justify-center" style={{ left: SCREEN_WIDTH / 2 - 180, top: 465.25 + insets.top, width: 360.006, height: 360.006 }}>
          <View className="absolute" style={{ width: 360.006, height: 360.006, transform: [{ rotate: '180deg' }] }}>
            <Image source={{ uri: imgEllipse61 }} className="w-full h-full" />
          </View>
          <View className="absolute" style={{ top: 159.12, left: 154.51, width: 50.987, height: 50.987, transform: [{ rotate: '90deg' }] }}>
            <Image source={{ uri: imgStar1 }} className="w-full h-full" />
          </View>
          <View className="absolute bg-[#c4beb6] rounded-[99px]" style={{ top: 184.08, left: 182.18, width: 35.65, height: 1.051, transform: [{ rotate: '180deg' }] }} />
          <View className="absolute" style={{ top: 93.67, left: 93.66, width: 172.678, height: 172.678 }}>
            <Image source={{ uri: imgEllipse62 }} className="w-full h-full" />
          </View>
          <View className="absolute bg-[#212322] px-[10px] py-[8px] rounded-[3px]" style={{ top: 166.19, left: 180.35 }}>
            <Text className="text-[12px] text-[#e65300] font-offBit101Bold text-center" style={{ letterSpacing: 0.15 }}>15 : 02</Text>
          </View>
        </View>

        {/* Network Pulse Graph */}
        <View className="absolute bg-black border border-[#5a5a5a] rounded-[5px] overflow-hidden" style={{ left: SCREEN_WIDTH / 2 - 183, top: 927.69 + insets.top, width: 366, height: 170 }}>
          <Image source={{ uri: imgVector16 }} className="absolute" style={{ top: 27.67, left: '50%', marginLeft: -193.9865, width: 387.973, height: 145.199 }} />
          <Image source={{ uri: imgVector17 }} className="absolute" style={{ top: 79.14, left: '50%', marginLeft: -193.9865, width: 387.973, height: 106.891 }} />
          <Image source={{ uri: imgVector18 }} className="absolute" style={{ top: 153.28, left: '50%', marginLeft: -193.9865, width: 387.973, height: 39.589 }} />
          <View className="absolute" style={{ top: 10.31, left: 10, gap: 2 }}>
            <Text className="text-[16px] text-white font-satoshiBold" style={{ letterSpacing: 0.15 }}>Network pulse</Text>
            <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
              <Text className="font-satoshiMedium">Lowest pulse recorded </Text>
              <Text className="font-offBit101Bold">20ms</Text>
            </Text>
          </View>
          <Image source={{ uri: imgGroup46 }} className="absolute" style={{ top: 91.92, left: 9.03, width: 246.995, height: 87.341 }} />
          <Text className="absolute text-[16px] text-[#e65300] font-offBitDotBold text-center" style={{ top: 73.92, left: 251.74, letterSpacing: 0.15, transform: [{ translateX: -50 }] }}>20</Text>
        </View>

        {/* Performance Graph */}
        <View className="absolute bg-black border border-[#5a5a5a] rounded-[5px] overflow-hidden" style={{ left: SCREEN_WIDTH / 2 - 183, top: 1129.36 + insets.top, width: 366, height: 170 }}>
          <Image source={{ uri: imgVector16 }} className="absolute" style={{ top: 27.67, left: '50%', marginLeft: -193.9865, width: 387.973, height: 145.199 }} />
          <Image source={{ uri: imgVector17 }} className="absolute" style={{ top: 79.14, left: '50%', marginLeft: -193.9865, width: 387.973, height: 106.891 }} />
          <Image source={{ uri: imgVector18 }} className="absolute" style={{ top: 153.28, left: '50%', marginLeft: -193.9865, width: 387.973, height: 39.589 }} />
          <View className="absolute" style={{ top: 10.31, left: 10, gap: 2 }}>
            <Text className="text-[16px] text-white font-satoshiBold" style={{ letterSpacing: 0.15 }}>Performance graph</Text>
            <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
              <Text className="font-satoshiMedium">Lowest pulse recorded </Text>
              <Text className="font-offBit101Bold">20ms</Text>
            </Text>
          </View>
          <Image source={{ uri: imgGroup47 }} className="absolute" style={{ top: 91.92, left: 9.63, width: 246.402, height: 23.902 }} />
          <Image source={{ uri: imgVector }} className="absolute" style={{ top: '53.95%', left: '30.79%', right: '2.73%', bottom: '-5.32%' }} />
          <Text className="absolute text-[16px] text-[#e65300] font-offBitDotBold text-center" style={{ top: 73.92, left: 251.74, letterSpacing: 0.15, transform: [{ translateX: -50 }] }}>20</Text>
        </View>    
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  backgroundVideo: {
    position: 'absolute',
    left: 0,
    height: VIDEO_HEIGHT,
    right: 0,
    width: SCREEN_WIDTH,
  },
})

export default Home
