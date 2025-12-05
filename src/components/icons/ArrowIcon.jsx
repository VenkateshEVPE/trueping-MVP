import React from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

const ArrowIcon = ({ color = '#F6F6F6', size = 20, rotation = 270 }) => {
  // Calculate rotated path for right arrow (270 = right, 0 = down, 90 = left, 180 = up)
  const getRotatedPath = () => {
    if (rotation === 270) {
      // Right arrow
      return 'M7 4L13 10L7 16'
    } else if (rotation === 0) {
      // Down arrow
      return 'M4 7L10 13L16 7'
    } else if (rotation === 90) {
      // Left arrow
      return 'M13 4L7 10L13 16'
    } else {
      // Up arrow
      return 'M4 13L10 7L16 13'
    }
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 20 20" 
        fill="none"
      >
        <Path
          d={getRotatedPath()}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

export default ArrowIcon

