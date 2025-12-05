import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

const CoinIcon = ({ color = '#F6F6F6', size = 22 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="11" r="10" stroke={color} strokeWidth="1.5" />
      <Path
        d="M11 6V16M6 11H16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default CoinIcon

