import React from 'react'
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const GAUGE_SIZE = 350
const CENTER_X = GAUGE_SIZE / 2
const CENTER_Y = GAUGE_SIZE / 2
// SVG viewBox is 3300x3300, so we scale: 1250/3300 * 350 = ~132.6
const OUTER_RADIUS = 133
// Inner circle: 710/3300 * 350 = ~75.3
const INNER_RADIUS = 75
// Scale marks: 780/3300 * 350 = ~82.7
const SCALE_RADIUS = 83

const CircularGauge = ({ insets, rotateAnim, panHandlers, timerMinutes }) => {
  // Calculate positions for numbers and dots (0-45 range)
  // 0 should be at 270 degrees (bottom), so we start from 270 and go counter-clockwise
  const startAngle = 270 // Bottom (0 value position)
  const totalAngle = 270 // 270 degrees total arc (counter-clockwise from 270° to 0°)

  // Format timer minutes to display
  const formatTime = (minutes) => {
    const mins = Math.floor(minutes)
    const secs = Math.floor((minutes - mins) * 60)
    return `${String(mins).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`
  }

  return (
    <View
      className="items-center justify-center absolute"
      style={{
        left: SCREEN_WIDTH / 2.1,
        top: 450 + insets.top,
        width: GAUGE_SIZE,
        height: GAUGE_SIZE,
      }}
      {...panHandlers}
      collapsable={false}
    >
      <Animated.View
        style={[
          styles.gaugeContainer,
          {
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 720],
                  outputRange: ['0deg', '720deg'],
                }),
              },
            ],
          },
        ]}
      >
        {/* Outer circle with gray border and subtle gradient */}
        <View style={styles.outerCircle}>
          {/* Base dark gray circle */}
          <View style={styles.outerCircleBase} />
          
          {/* Gray border at outer edge */}
          <View style={styles.grayBorder} />
          
          {/* Very subtle gradient layers - only on outer edge */}
          {[...Array(20)].map((_, i) => {
            const progress = i / 19 // 0 to 1
            // Very subtle gradient from gray border to dark gray
            // Start from gray border (around #808080 or rgb(128, 128, 128))
            const startGray = 128 // Gray border color
            const endGray = 33 // Dark gray (#212322 = rgb(33, 35, 34))
            const grayValue = Math.round(startGray - (startGray - endGray) * progress)
            const color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`
            // Very narrow gradient - only on outer 10% of the ring
            const gradientWidth = OUTER_RADIUS * 0.1
            const radius = OUTER_RADIUS - (i * (gradientWidth / 20)) // Very narrow gradient
            
            return (
              <View
                key={`gradient-layer-${i}`}
                style={[
                  styles.gradientLayer,
                  {
                    width: radius * 2,
                    height: radius * 2,
                    borderRadius: radius,
                    backgroundColor: color,
                  },
                ]}
              />
            )
          })}
        </View>

        {/* Inner light circle */}
        <View style={styles.innerCircle} />

        {/* Numbers and dots - positioned absolutely */}
        {Array.from({ length: 46 }, (_, i) => {
          // Start at 270° (bottom) for 0, go counter-clockwise
          // 270° - (i / 45) * 270° gives us the angle for each mark
          const angle = startAngle - (i / 45) * totalAngle
          const angleRad = (angle * Math.PI) / 180
          const isNumberMark = i % 5 === 0

          // Calculate position
          const x = CENTER_X + SCALE_RADIUS * Math.cos(angleRad)
          const y = CENTER_Y + SCALE_RADIUS * Math.sin(angleRad)

          if (isNumberMark) {
            // Show number
            return (
              <View
                key={`number-${i}`}
                  style={[
                    styles.numberContainer,
                    {
                      left: x - 5, // Center the number (approximate width)
                      top: y - 4.5, // Center the number (approximate height)
                    },
                  ]}
              >
                <Text style={styles.numberText}>{i}</Text>
              </View>
            )
          } else {
            // Show small dot
            return (
              <View
                key={`dot-${i}`}
                  style={[
                    styles.dot,
                    {
                      left: x - 1.5,
                      top: y - 1.5,
                    },
                  ]}
              />
            )
          }
        })}
      </Animated.View>

      {/* Fixed pointer elements (don't rotate) */}
      <View style={styles.pointerContainer}>
        {/* Left horizontal line - from outer edge to inner circle */}
        <View style={[styles.pointerLine, styles.pointerLineLeft]} />
        {/* Right horizontal line - from outer edge to inner circle */}
        <View style={[styles.pointerLine, styles.pointerLineRight]} />
      </View>

      {/* Fixed angle degree indicators at 4 positions (0°, 90°, 180°, 270°) - don't rotate */}
      {/* {[0, 90, 180, 270].map((deg) => {
        // In standard coordinates: 0°=right, 90°=bottom, 180°=left, 270°=top
        // We want 270° at bottom, so we need to shift by 180°:
        // 270° - 180° = 90° (which is bottom in standard coordinates)
        const adjustedDeg = deg - 180
        const angleRad = (adjustedDeg * Math.PI) / 180
        const x = CENTER_X + (OUTER_RADIUS + 15) * Math.cos(angleRad)
        const y = CENTER_Y + (OUTER_RADIUS + 15) * Math.sin(angleRad)
        
        return (
          <View
            key={`angle-${deg}`}
            style={[
              styles.angleIndicator,
              {
                left: x - 15,
                top: y - 10,
              },
            ]}
          >
            <Text style={styles.angleText}>{deg}°</Text>
          </View>
        )
      })} */}

      {/* Digital time display in center */}
      <View style={styles.timeDisplay}>
        <Text style={styles.timeText}>{formatTime(timerMinutes)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    position: 'absolute',
    width: OUTER_RADIUS * 2,
    height: OUTER_RADIUS * 2,
    borderRadius: OUTER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outerCircleBase: {
    position: 'absolute',
    width: OUTER_RADIUS * 2,
    height: OUTER_RADIUS * 2,
    borderRadius: OUTER_RADIUS,
    backgroundColor: '#212322',
  },
  grayBorder: {
    position: 'absolute',
    width: OUTER_RADIUS * 2,
    height: OUTER_RADIUS * 2,
    borderRadius: OUTER_RADIUS,
    borderWidth: 1,
    borderColor: '#808080',
  },
  gradientLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    position: 'absolute',
    width: INNER_RADIUS * 2,
    height: INNER_RADIUS * 2,
    borderRadius: INNER_RADIUS,
    backgroundColor: '#C4BEB6',
    zIndex: 1,
  },
  numberContainer: {
    position: 'absolute',
    zIndex: 2,
  },
  numberText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    textAlign: 'center',
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  pointerContainer: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  pointerLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#FFFFFF',
    top: CENTER_Y - 1,
  },
  pointerLineLeft: {
    width: OUTER_RADIUS - INNER_RADIUS - 30, // From outer edge to inner circle edge with more padding
    left: CENTER_X - OUTER_RADIUS + 15, // More padding from outer edge
  },
  pointerLineRight: {
    width: OUTER_RADIUS - INNER_RADIUS - 30, // From outer edge to inner circle edge with more padding
    left: CENTER_X + INNER_RADIUS + 15, // More padding from inner circle edge
  },
  timeDisplay: {
    position: 'absolute',
    top: '50%',
    left: '47.5%',
    transform: [{ translateX: -35 }, { translateY: -14 }],
    backgroundColor: '#212322',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 3,
    zIndex: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#e65300',
    fontFamily: 'offBit101Bold',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
  angleIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    zIndex: 100,
  },
  angleText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
})

export default CircularGauge
