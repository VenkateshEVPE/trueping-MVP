import axios from 'axios'
import { BASE_URL } from '@env'

const API_BASE_URL = BASE_URL || 'http://localhost:4000'

console.log('API_BASE_URL', API_BASE_URL)

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., 'v1/auth/signup')
 * @param {object} options - Axios options (method, data, headers, etc.)
 * @returns {Promise<object>} - Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.replace(/^\//, '')
  
  const config = {
    url,
    method: options.method || 'GET',
    ...options,
  }

  // Rename 'body' to 'data' for axios compatibility
  if (options.body) {
    config.data = options.body
    delete config.body
  }

  try {
    const response = await apiClient.request(config)
    return response.data
  } catch (error) {
    // Handle axios errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.message || error.response.data?.error || `HTTP error! status: ${error.response.status}`
      const apiError = new Error(errorMessage)
      apiError.status = error.response.status
      apiError.data = error.response.data
      throw apiError
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Network error. Please check your internet connection.')
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
}


