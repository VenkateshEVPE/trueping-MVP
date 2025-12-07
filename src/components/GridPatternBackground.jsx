/* eslint-disable react-native/no-inline-styles */
import { View, Dimensions } from 'react-native'
import React from 'react'
import { useColorScheme } from 'nativewind'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const GRID_SIZE = 65 // Size of each grid cell
const CROSS_SIZE = 4 // Size of the "+" shape (half-length of each arm)
const OUTER_CROSS_SIZE = 8 // Size of the outer thin "+" shape (half-length of each arm)
const CENTER_SQUARE_SIZE = 2 // Size of the center square

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
      <View 
        className="absolute top-0 left-0 right-0 bottom-0"
        pointerEvents="none"
      >
        {intersections.map((point, index) => {
          const containerSize = OUTER_CROSS_SIZE * 5
          const containerOffset = containerSize / 2
          
          return (
          <View
            key={`intersection-${index}`}
            className="absolute"
            style={{
                left: point.x - containerOffset,
                top: point.y - containerOffset,
                width: containerSize,
                height: containerSize,
              }}
            >
              {/* Outer thin plus - horizontal line (behind) */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: containerOffset - 0.5,
                  width: containerSize,
                  height: 0.5,
                  backgroundColor: colorScheme === 'dark' 
                    ? `rgba(255, 255, 255, ${point.opacity * 0.5})`
                    : `rgba(0, 0, 0, ${point.opacity * 0.15})`,
                  zIndex: 1,
                }}
              />
              {/* Outer thin plus - vertical line (behind) */}
              <View
                style={{
                  position: 'absolute',
                  left: containerOffset - 0.5,
                  top: 0,
                  width: 0.5,
                  height: containerSize,
                  backgroundColor: colorScheme === 'dark'
                    ? `rgba(255, 255, 255, ${point.opacity * 0.5})`
                    : `rgba(0, 0, 0, ${point.opacity * 0.15})`,
                  zIndex: 1,
                }}
              />
              
              {/* Inner bold plus container (in front) */}
              <View
                style={{
                  position: 'absolute',
                  left: containerOffset - CROSS_SIZE,
                  top: containerOffset - CROSS_SIZE,
              width: CROSS_SIZE * 2,
              height: CROSS_SIZE * 2,
                  zIndex: 2,
            }}
          >
              {/* Center square */}
              <View
                style={{
                  position: 'absolute',
                  left: CROSS_SIZE - CENTER_SQUARE_SIZE / 2,
                  top: CROSS_SIZE - CENTER_SQUARE_SIZE / 2,
                  width: CENTER_SQUARE_SIZE,
                  height: CENTER_SQUARE_SIZE,
                  backgroundColor: colorScheme === 'dark' 
                    ? `rgba(255, 255, 255, ${point.opacity})`
                    : `rgba(0, 0, 0, ${point.opacity * 0.3})`,
                }}
              />
              {/* Inner bold plus - horizontal line */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                  top: CROSS_SIZE - 1,
                width: CROSS_SIZE * 2,
                  height: 2,
                backgroundColor: colorScheme === 'dark' 
                  ? `rgba(255, 255, 255, ${point.opacity})`
                  : `rgba(0, 0, 0, ${point.opacity * 0.3})`,
              }}
            />
              {/* Inner bold plus - vertical line */}
            <View
              style={{
                position: 'absolute',
                  left: CROSS_SIZE - 1,
                top: 0,
                  width: 2,
                height: CROSS_SIZE * 2,
                backgroundColor: colorScheme === 'dark'
                  ? `rgba(255, 255, 255, ${point.opacity})`
                  : `rgba(0, 0, 0, ${point.opacity * 0.3})`,
              }}
            />
          </View>
            </View>
          )
        })}
      </View>
      
      {/* Gradient overlay */}
      <View 
        className="absolute top-0 left-0 right-0 bottom-0"
        style={{
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(0, 0, 0, 0.15)'
            : 'rgba(255, 255, 255, 0.05)',
        }}
        pointerEvents="none"
      />
    </>
  )
}

export default GridPatternBackground

