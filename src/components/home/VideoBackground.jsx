import React, { useRef } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Video from 'react-native-video'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const VIDEO_HEIGHT = SCREEN_HEIGHT / 1.7
const GRADIENT_HEIGHT = VIDEO_HEIGHT * 0.95
const GRADIENT_LAYERS = 20

const VideoBackground = ({ insets, onBuffer, onError, onLoad }) => {
  const videoRef = useRef(null)
  const background = require('../../../assets/videos/20251027-0446-31.7698841.mp4')

  const handleError = (error) => {
    console.error('VideoBackground error:', error)
    // Call parent error handler
    if (onError) {
      onError(error)
    }
  }

  const handleLoad = () => {
    // Call parent load handler
    if (onLoad) {
      onLoad()
    }
  }

  const handleBuffer = (data) => {
    // Call parent buffer handler
    if (onBuffer) {
      onBuffer(data)
    }
  }

  return (
    <View style={{ position: 'relative', height: VIDEO_HEIGHT, marginTop: insets.top }}>
      <Video
        source={background}
        ref={videoRef}
        onBuffer={handleBuffer}
        onError={handleError}
        onLoad={handleLoad}
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

export default VideoBackground

