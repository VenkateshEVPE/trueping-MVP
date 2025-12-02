import * as Keychain from 'react-native-keychain'

/**
 * Store private key securely in keychain
 * @param {number} walletId - Wallet ID
 * @param {string} privateKey - Private key to store
 * @returns {Promise<boolean>} - Success status
 */
export const storePrivateKey = async (walletId, privateKey) => {
  try {
    const username = `wallet_${walletId}`
    const password = privateKey

    await Keychain.setGenericPassword(username, password, {
      service: 'com.trueping.wallet',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })

    console.log(`Private key stored securely for wallet ${walletId}`)
    return true
  } catch (error) {
    console.error('Error storing private key:', error)
    throw error
  }
}

/**
 * Retrieve private key from keychain
 * @param {number} walletId - Wallet ID
 * @returns {Promise<string|null>} - Private key or null if not found
 */
export const getPrivateKey = async (walletId) => {
  try {
    const username = `wallet_${walletId}`

    const credentials = await Keychain.getGenericPassword({
      service: 'com.trueping.wallet',
    })

    if (credentials && credentials.username === username) {
      return credentials.password
    }

    return null
  } catch (error) {
    console.error('Error retrieving private key:', error)
    return null
  }
}

/**
 * Delete private key from keychain
 * @param {number} walletId - Wallet ID
 * @returns {Promise<boolean>} - Success status
 */
export const deletePrivateKey = async (walletId) => {
  try {
    const username = `wallet_${walletId}`

    const result = await Keychain.resetGenericPassword({
      service: 'com.trueping.wallet',
    })

    // Also try to delete by username if resetGenericPassword doesn't work
    try {
      await Keychain.resetGenericPassword({
        service: 'com.trueping.wallet',
        username: username,
      })
    } catch (e) {
      // Ignore if already deleted
    }

    console.log(`Private key deleted for wallet ${walletId}`)
    return true
  } catch (error) {
    console.error('Error deleting private key:', error)
    return false
  }
}

/**
 * Check if private key exists for wallet
 * @param {number} walletId - Wallet ID
 * @returns {Promise<boolean>} - True if key exists
 */
export const hasPrivateKey = async (walletId) => {
  try {
    const key = await getPrivateKey(walletId)
    return key !== null
  } catch (error) {
    return false
  }
}

