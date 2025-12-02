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
  // Always start at 0 minutes, which positions 0 at 270 degrees
  const minutes = 0
  const clampedLargeDotIndex = 0
  // 0 minutes = 270 degrees (bottom position)
  const initialAngle = 270
  
  angleRef.current = initialAngle
  rotateAnim.setValue(initialAngle)
  lastAnimatedDotRef.current = clampedLargeDotIndex
  
  return { minutes, clampedLargeDotIndex }
}

/**
 * Check if touch is within the gauge area (including inner circle)
 * @param {number} locationX - Touch X coordinate
 * @param {number} locationY - Touch Y coordinate
 * @returns {boolean} True if touch is on the gauge (ring or inner circle)
 */
const isTouchOnRing = (locationX, locationY) => {
  const distance = getDistance(locationX, locationY, CENTER_X, CENTER_Y)
  // Allow touches on the ring AND on the inner circle
  return distance <= OUTER_RADIUS
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
    onStartShouldSetPanResponderCapture: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      // Capture touch early to prevent ScrollView interference
      return isTouchOnRing(locationX, locationY)
    },
    onMoveShouldSetPanResponder: () => {
      // Always respond to moves once we've started
      return true
    },
    onMoveShouldSetPanResponderCapture: () => {
      // Capture moves to prevent ScrollView interference
      return true
    },
    onPanResponderTerminationRequest: () => {
      // Don't allow other components to take over
      return false
    },
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      
      // Stop any ongoing animation immediately
      rotateAnim.stopAnimation((value) => {
        angleRef.current = value
      })
      
      const angle = getAngle(locationX, locationY, CENTER_X, CENTER_Y)
      lastAngleRef.current = angle
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      
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
        lastAngleRef.current = angle
        return
      }
      
      // Reduced threshold for smoother interaction (10 degrees instead of 15)
      if (Math.abs(angleDiff) >= 10) {
        // Determine next large dot index
        let nextLargeDotIndex = currentLargeDotIndex + (angleDiff > 0 ? 1 : -1)
        
        // Clamp to valid range (0-11)
        if (nextLargeDotIndex < 0) nextLargeDotIndex = 0
        if (nextLargeDotIndex > 11) nextLargeDotIndex = 11
        
        // Don't allow going below 0
        if (nextLargeDotIndex === 0 && currentLargeDotIndex === 0 && angleDiff < 0) {
          lastAngleRef.current = angle
          return
        }
        
        // Only animate if we're moving to a different large dot
        if (nextLargeDotIndex !== lastAnimatedDotRef.current) {
          // Convert large dot index to target angle
          const minutes = Math.round((nextLargeDotIndex / 12) * 45)
          const targetAngle = 270 + (minutes / 45) * 360
          
          // Update angleRef immediately for responsive feel
          angleRef.current = targetAngle
          
          // Update last animated dot
          lastAnimatedDotRef.current = nextLargeDotIndex
          
          // Update last angle
          lastAngleRef.current = angle
          
          // Animate with shorter duration for snappier feel
          Animated.timing(rotateAnim, {
            toValue: targetAngle,
            duration: 150,
            useNativeDriver: true,
          }).start()
          
          setTimerMinutes(minutes)
        } else {
          // Update last angle even if not moving to prevent lag
          lastAngleRef.current = angle
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

