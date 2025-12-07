import React from 'react'
import { View, Text, Dimensions } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PANEL_HEIGHT = 176 // h-44 = 44 * 4 = 176
const DOT_SPACING = 16 // Increased gap between dots
const PANEL_WIDTH = SCREEN_WIDTH - 30 // left: 15 + right: 15 = 30

const NetworkPulseGraph = ({ insets }) => {
  const gridCols = Math.floor(PANEL_WIDTH / DOT_SPACING)
  const gridRows = Math.floor(PANEL_HEIGHT / DOT_SPACING)

  // Graph dimensions
  const GRAPH_TOP = 50 // Start graph below text
  const GRAPH_HEIGHT = PANEL_HEIGHT - GRAPH_TOP - 10 // Leave some bottom margin
  const GRAPH_LEFT = 10
  const GRAPH_WIDTH = PANEL_WIDTH * 0.65 // Line takes 65% of container width
  const GRAPH_BOTTOM = GRAPH_TOP + GRAPH_HEIGHT

  // Sample data points for the line graph (creating different undulating wave pattern from high to low)
  // These represent network pulse values over time
  const dataPoints = [
    { x: 0, y: 0.2 },      // Start high (near top)
    { x: 0.2, y: 0.35 },   // Slight dip
    { x: 0.35, y: 0.25 },  // Peak
    { x: 0.5, y: 0.5 },    // Valley
    { x: 0.65, y: 0.4 },   // Peak
    { x: 0.8, y: 0.7 },    // Valley
    { x: 0.9, y: 0.65 },   // Mid
    { x: 1.0, y: 0.70 },    // End point low (near bottom, where marker is)
  ]

  // Convert normalized points to actual coordinates
  const points = dataPoints.map((point, index) => {
    const x = GRAPH_LEFT + point.x * GRAPH_WIDTH
    const y = GRAPH_TOP + point.y * GRAPH_HEIGHT
    return { x, y }
  })

  // Create path for the line
  let linePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    // Use smooth curves between points
    const prevPoint = points[i - 1]
    const currentPoint = points[i]
    const controlX1 = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5
    const controlY1 = prevPoint.y
    const controlX2 = currentPoint.x - (currentPoint.x - prevPoint.x) * 0.5
    const controlY2 = currentPoint.y
    linePath += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${currentPoint.x} ${currentPoint.y}`
  }

  // Create path for filled area (line + bottom line + close path)
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${GRAPH_BOTTOM} L ${points[0].x} ${GRAPH_BOTTOM} Z`

  // Marker position (right side, at the last data point)
  const markerX = points[points.length - 1].x
  const markerY = points[points.length - 1].y

  return (
    <View 
      className="absolute bg-black border border-[#5a5a5a] rounded-[5px] h-44 overflow-hidden" 
      style={{ 
        top: 825 + insets.top,
        left: 15,
        right: 15,
      }}
    >
      {/* Grid pattern - small white dots */}
      <View className="absolute inset-0">
        {[...Array(gridRows)].map((_row, row) => 
          [...Array(gridCols)].map((_col, col) => (
            <View
              key={`grid-${row}-${col}`}
              className="absolute rounded-full bg-white"
              style={{
                left: col * DOT_SPACING,
                top: row * DOT_SPACING,
                width: 1.5,
                height: 1.5,
                opacity: 0.10,
              }}
            />
          ))
        )}
      </View>

      {/* Text labels */}
      <View className="absolute" style={{ top: 10.31, left: 10, gap: 2 }}>
        <Text className="text-[16px] text-white font-satoshiBold" style={{ letterSpacing: 0.15 }}>Network pulse</Text>
        <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
          <Text className="font-satoshiMedium">Lowest pulse recorded </Text>
          <Text className="font-offBit101Bold">20ms</Text>
        </Text>
      </View>

      {/* SVG Graph */}
      <Svg
        width={PANEL_WIDTH}
        height={PANEL_HEIGHT}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id="networkPulseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#2a2a2a" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Filled area under the line */}
        <Path
          d={fillPath}
          fill="url(#networkPulseGradient)"
        />

        {/* Line graph */}
        <Path
          d={linePath}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical line above the marker dot */}
        <Path
          d={`M ${markerX} ${markerY - 16} L ${markerX} ${markerY}`}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Marker dot at the end of the line */}
        <Circle
          cx={markerX}
          cy={markerY}
          r="3"
          fill="black"
          stroke="white"
          strokeWidth="1"
        />
      </Svg>

      {/* Orange value marker - positioned above the vertical line */}
      <View
        className="absolute"
        style={{
          top: markerY - 16 - 20, // Above the vertical line (line is 16px, add 20px for text height)
          left: markerX - 10, // Center horizontally (approximate center for "20")
        }}
      >
        <Text
          className="text-[16px] text-[#e65300] font-offBitDotBold"
          style={{ letterSpacing: 0.15 }}
        >
          20
        </Text>
      </View>
    </View>
  )
}

export default NetworkPulseGraph

