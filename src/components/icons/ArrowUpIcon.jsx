import React from 'react'
import Svg, { Path } from 'react-native-svg'

const ArrowUpIcon = ({ color = '#E65300', size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4V20M12 4L6 10M12 4L18 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default ArrowUpIcon

