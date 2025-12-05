import React from 'react'
import { View, Text, Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PANEL_HEIGHT = 176 // h-44 = 44 * 4 = 176
const DOT_SPACING = 16 // Increased gap between dots
const PANEL_WIDTH = SCREEN_WIDTH - 30 // left: 15 + right: 15 = 30

const PerformanceGraph = ({ insets }) => {
  const gridCols = Math.floor(PANEL_WIDTH / DOT_SPACING)
  const gridRows = Math.floor(PANEL_HEIGHT / DOT_SPACING)

  return (
    <View 
      className="absolute bg-black border border-[#5a5a5a] rounded-[5px] h-44 overflow-hidden" 
      style={{ 
        top: 1020 + insets.top,
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

      <View className="absolute" style={{ top: 10.31, left: 10, gap: 2 }}>
        <Text className="text-[16px] text-white font-satoshiBold" style={{ letterSpacing: 0.15 }}>Performance graph</Text>
        <Text className="text-[12px] text-white font-satoshi" style={{ letterSpacing: 0.15 }}>
          <Text className="font-satoshiMedium">Lowest pulse recorded </Text>
          <Text className="font-offBit101Bold">20ms</Text>
        </Text>
      </View>
      <Text className="absolute text-[16px] text-[#e65300] font-offBitDotBold text-center" style={{ top: 73.92, left: 251.74, letterSpacing: 0.15, transform: [{ translateX: -50 }] }}>20</Text>
    </View>
  )
}

export default PerformanceGraph

