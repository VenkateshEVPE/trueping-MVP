import React from 'react'
import { View } from 'react-native'

const BottomGradient = () => {
  return (
    <View
      className="absolute left-0 right-0"
      style={{
        bottom: 0,
        height: 200,
        pointerEvents: 'none',
        backgroundColor: 'transparent',
      }}
    >
      {[...Array(200)].map((_, i) => {
        const progress = i / 199 // 0 to 1
        const opacity = 1 - (progress * progress) // Reversed: full black at bottom, transparent at top
        return (
          <View
            key={`bottom-screen-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: (i / 200) * 200,
              height: 1,
              backgroundColor: `rgba(0, 0, 0, ${opacity})`,
            }}
          />
        )
      })}
    </View>
  )
}

export default BottomGradient

