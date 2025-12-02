import { Animated, PanResponder } from 'react-native'
import { getAngle, getDistance } from './angleUtils'

const CENTER_X = 175
const CENTER_Y = 175
const INNER_RADIUS = 70
const OUTER_RADIUS = 130

/**
 * Initialize gauge angle based on timer minutes
 * @param {number} timerMinutes - Timer value in minutes (0-45)
 * @param {Object} angleRef - Ref to store current angle
 * @param {Object} rotateAnim - Animated value for rotation
 * @param {Object} lastAnimatedDotRef - Ref to store last animated dot index
 * @returns {Object} Initial state with angle and dot index
 */
export const initializeGaugeAngle = (timerMinutes, angleRef, rotateAnim, lastAnimatedDotRef) => {
  // Convert minutes to large dot index (0-11, 12 positions for 0-45 minutes)
  const largeDotIndex = Math.round((timerMinutes / 45) * 12) % 12
  const clampedLargeDotIndex = Math.max(0, Math.min(11, largeDotIndex))
  const minutes = Math.round((clampedLargeDotIndex / 12) * 45)
  const initialAngle = 270 + (minutes / 45) * 360
  
  angleRef.current = initialAngle
  rotateAnim.setValue(initialAngle)
  lastAnimatedDotRef.current = clampedLargeDotIndex
  
  return { minutes, clampedLargeDotIndex }
}

/**
 * Check if touch is within the gauge ring
 * @param {number} locationX - Touch X coordinate
 * @param {number} locationY - Touch Y coordinate
 * @returns {boolean} True if touch is on the ring
 */
const isTouchOnRing = (locationX, locationY) => {
  const distance = getDistance(locationX, locationY, CENTER_X, CENTER_Y)
  return distance >= INNER_RADIUS && distance <= OUTER_RADIUS
}

/**
 * Create PanResponder for gauge rotation
 * @param {Object} params - Parameters object
 * @param {Object} params.angleRef - Ref to store current angle
 * @param {Object} params.lastAngleRef - Ref to store last touch angle
 * @param {Object} params.lastAnimatedDotRef - Ref to store last animated dot index
 * @param {Object} params.rotateAnim - Animated value for rotation
 * @param {Function} params.setTimerMinutes - Function to update timer minutes
 * @returns {Object} PanResponder instance
 */
export const createGaugePanResponder = ({
  angleRef,
  lastAngleRef,
  lastAnimatedDotRef,
  rotateAnim,
  setTimerMinutes,
}) => {
  return PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      return isTouchOnRing(locationX, locationY)
    },
    onMoveShouldSetPanResponder: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      return isTouchOnRing(locationX, locationY)
    },
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      
      if (isTouchOnRing(locationX, locationY)) {
        const angle = getAngle(locationX, locationY, CENTER_X, CENTER_Y)
        lastAngleRef.current = angle
      }
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      
      if (isTouchOnRing(locationX, locationY)) {
        const angle = getAngle(locationX, locationY, CENTER_X, CENTER_Y)
        
        // Calculate angle difference
        let angleDiff = angle - lastAngleRef.current
        
        // Handle wrap-around
        if (angleDiff > 180) angleDiff -= 360
        if (angleDiff < -180) angleDiff += 360
        
        // Get current large dot index (0-11, 12 positions)
        const currentLargeDotIndex = lastAnimatedDotRef.current >= 0 
          ? lastAnimatedDotRef.current 
          : Math.round(((angleRef.current - 270 + 360) % 360) / 30) % 12
        
        // Prevent rotation below zero
        if (currentLargeDotIndex === 0 && angleDiff < 0) {
          return
        }
        
        // Only update if movement is significant (at least 15 degrees to snap to next large dot)
        if (Math.abs(angleDiff) >= 15) {
          // Determine next large dot index
          let nextLargeDotIndex = currentLargeDotIndex + (angleDiff > 0 ? 1 : -1)
          
          // Clamp to valid range (0-11)
          if (nextLargeDotIndex < 0) nextLargeDotIndex = 0
          if (nextLargeDotIndex > 11) nextLargeDotIndex = 11
          
          // Don't allow going below 0
          if (nextLargeDotIndex === 0 && currentLargeDotIndex === 0 && angleDiff < 0) {
            return
          }
          
          // Only animate if we're moving to a different large dot
          if (nextLargeDotIndex !== lastAnimatedDotRef.current) {
            // Convert large dot index to target angle
            const minutes = Math.round((nextLargeDotIndex / 12) * 45)
            const targetAngle = 270 + (minutes / 45) * 360
            
            // Stop any ongoing animation
            rotateAnim.stopAnimation((value) => {
              angleRef.current = value
            })
            
            // Update angleRef for next calculation
            angleRef.current = targetAngle
            
            // Update last animated dot
            lastAnimatedDotRef.current = nextLargeDotIndex
            
            // Update last angle
            lastAngleRef.current = angle
            
            // Animate to the next large dot position
            Animated.timing(rotateAnim, {
              toValue: targetAngle,
              duration: 200,
              useNativeDriver: true,
            }).start()
            
            setTimerMinutes(minutes)
          }
        }
      }
    },
    onPanResponderRelease: () => {
      // Snap to nearest large dot position (every 30 degrees)
      const adjustedAngle = (angleRef.current - 270 + 360) % 360
      const largeDotIndex = Math.round(adjustedAngle / 30) % 12
      const clampedLargeDotIndex = Math.max(0, Math.min(11, largeDotIndex))
      
      // Convert large dot index to minutes (0-45, 12 positions)
      const minutes = Math.round((clampedLargeDotIndex / 12) * 45)
      const targetAngle = 270 + (minutes / 45) * 360
      angleRef.current = targetAngle
      lastAnimatedDotRef.current = clampedLargeDotIndex
      
      Animated.timing(rotateAnim, {
        toValue: targetAngle,
        duration: 200,
        useNativeDriver: true,
      }).start()
      
      setTimerMinutes(minutes)
    },
  })
}

