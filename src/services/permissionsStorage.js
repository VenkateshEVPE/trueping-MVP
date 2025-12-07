import AsyncStorage from '@react-native-async-storage/async-storage'

const PERMISSIONS_GRANTED_KEY = '@TruePing:permissions_granted'

/**
 * Check if permissions have been granted
 * @returns {Promise<boolean>} True if permissions granted, false otherwise
 */
export const arePermissionsGranted = async () => {
  try {
    const value = await AsyncStorage.getItem(PERMISSIONS_GRANTED_KEY)
    return value === 'true'
  } catch (error) {
    console.error('Error checking permissions status:', error)
    return false
  }
}

/**
 * Mark permissions as granted
 * @returns {Promise<boolean>} Success status
 */
export const markPermissionsAsGranted = async () => {
  try {
    await AsyncStorage.setItem(PERMISSIONS_GRANTED_KEY, 'true')
    console.log('✅ Permissions marked as granted in AsyncStorage')
    return true
  } catch (error) {
    console.error('❌ Error marking permissions as granted:', error)
    return false
  }
}

/**
 * Clear permissions status (for logout or reset)
 * @returns {Promise<boolean>} Success status
 */
export const clearPermissionsStatus = async () => {
  try {
    await AsyncStorage.removeItem(PERMISSIONS_GRANTED_KEY)
    console.log('✅ Permissions status cleared')
    return true
  } catch (error) {
    console.error('❌ Error clearing permissions status:', error)
    return false
  }
}

