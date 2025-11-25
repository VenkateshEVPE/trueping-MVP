import { apiRequest } from '../api'

/**
 * Sign up a new user
 * @param {object} userData - User data { name, email, password, role }
 * @returns {Promise<object>} - Response data
 */
export const signUp = async (userData) => {
  return apiRequest('auth/signup', {
    method: 'POST',
    body: userData,
  })
}

/**
 * Sign in a user
 * @param {object} credentials - Login credentials { email, password }
 * @returns {Promise<object>} - Response data with token/user info
 */
export const signIn = async (credentials) => {
  return apiRequest('auth/signin', {
    method: 'POST',
    body: credentials,
  })
}

/**
 * Send OTP to email
 * @param {string} email - User email address
 * @returns {Promise<object>} - Response data { message, email }
 */
export const sendOTP = async (email) => {
  return apiRequest('auth/send-otp', {
    method: 'POST',
    body: { email },
  })
}

/**
 * Verify OTP
 * @param {object} otpData - OTP data { email, otp }
 * @returns {Promise<object>} - Response data { message, email, email_verified }
 */
export const verifyOTP = async (otpData) => {
  return apiRequest('auth/verify-otp', {
    method: 'POST',
    body: otpData,
  })
}

/**
 * Reset password
 * @param {object} resetData - Reset data { email, password, confirmPassword }
 * @returns {Promise<object>} - Response data
 */
export const resetPassword = async (resetData) => {
  return apiRequest('auth/reset-password', {
    method: 'POST',
    body: resetData,
  })
}

