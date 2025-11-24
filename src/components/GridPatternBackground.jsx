import { View, Dimensions } from 'react-native'
import React from 'react'
import { useColorScheme } from 'nativewind'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const GRID_SIZE = 65 // Size of each grid cell
const CROSS_SIZE = 4 // Size of the "+" shape (half-length of each arm)

// Grid Pattern Component - Shows only intersections as "+" shapes with gradient opacity
const GridPatternBackground = () => {
  const { colorScheme } = useColorScheme()
  const rows = Math.ceil(SCREEN_HEIGHT / GRID_SIZE)
  const cols = Math.ceil(SCREEN_WIDTH / GRID_SIZE)
  
  // Calculate offsets to center the grid
  const horizontalOffset = (SCREEN_WIDTH % GRID_SIZE) / 2
  const verticalOffset = (SCREEN_HEIGHT % GRID_SIZE) / 2

  // Generate all intersection points with gradient opacity
  const intersections = []
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const y = verticalOffset + (row * GRID_SIZE)
      // Calculate opacity based on Y position (0 at top, 0.2 at bottom)
      // Normalize Y position to 0-1 range based on screen height
      const normalizedY = Math.max(0, Math.min(1, y / SCREEN_HEIGHT))
      const opacity = normalizedY * 0.2 // Gradient from 0 to 0.2
      
      intersections.push({
        x: horizontalOffset + (col * GRID_SIZE),
        y: y,
        opacity: opacity,
      })
    }
  }

  return (
    <>
      {/* Grid pattern background */}
      <View className="absolute top-0 left-0 right-0 bottom-0">
        {intersections.map((point, index) => (
          <View
            key={`intersection-${index}`}
            className="absolute w-2 h-2"
            style={{
              left: point.x - CROSS_SIZE,
              top: point.y - CROSS_SIZE,
            }}
          >
            {/* Horizontal line of the "+" */}
            <View
              className="absolute left-0 w-2 h-px"
              style={{
                top: CROSS_SIZE - 0.5,
                backgroundColor: colorScheme === 'dark' 
                  ? `rgba(255, 255, 255, ${point.opacity})`
                  : `rgba(0, 0, 0, ${point.opacity * 0.3})`,
              }}
            />
            {/* Vertical line of the "+" */}
            <View
              className="absolute top-0 w-px h-2"
              style={{
                left: CROSS_SIZE - 0.5,
                backgroundColor: colorScheme === 'dark'
                  ? `rgba(255, 255, 255, ${point.opacity})`
                  : `rgba(0, 0, 0, ${point.opacity * 0.3})`,
              }}
            />
          </View>
        ))}
      </View>
      
      {/* Gradient overlay */}
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/15 dark:bg-white/5" />
    </>
  )
}

export default GridPatternBackground

