import React from 'react'
import { View, Text, Animated, Dimensions } from 'react-native'
import Svg, { Circle, Polygon, Line, Text as SvgText } from 'react-native-svg'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const CircularGauge = ({ insets, rotateAnim, panHandlers, timerMinutes }) => {
  return (
    <View
      className="items-center justify-center absolute"
      style={{
        left: SCREEN_WIDTH / 2.1,
        top: 450 + insets.top,
        opacity: 1
      }}
      {...panHandlers}
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
          <Circle cx="1650" cy="1650" r="1250" fill="#212322" />
          {/* Inner circle with color #c4bfb5 */}
          <Circle cx="1650" cy="1650" r="710" fill="#C4BEB6" />
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
  )
}

export default CircularGauge

