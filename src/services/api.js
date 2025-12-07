import axios from 'axios'
import { BASE_URL } from '@env'

// Validate and set API base URL
let API_BASE_URL = BASE_URL || 'http://localhost:4000'

// Remove trailing slash if present
API_BASE_URL = API_BASE_URL.replace(/\/$/, '')

// Validate URL format
if (!API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  console.warn('⚠️ API_BASE_URL does not start with http:// or https://, defaulting to http://localhost:4000')
  API_BASE_URL = 'http://localhost:4000'
}

console.log('🌐 API_BASE_URL configured:', API_BASE_URL)
console.log('🌐 BASE_URL from .env:', BASE_URL || 'NOT SET')

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
  // Remove leading slash from endpoint
  let url = endpoint.replace(/^\//, '')
  
  // If BASE_URL already ends with /v1, remove v1/ from the endpoint
  if (API_BASE_URL.endsWith('/v1')) {
    url = url.replace(/^v1\//, '')
  }
  
  const fullUrl = `${API_BASE_URL}/${url}`
  
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

  // Log request details for debugging
  console.log(`🌐 API Request: ${config.method} ${fullUrl}`)
  if (config.data) {
    console.log(`📤 Request data:`, JSON.stringify(config.data, null, 2))
  }

  try {
    const response = await apiClient.request(config)
    console.log(`✅ API Response: ${fullUrl}`, response.status, response.statusText)
    return response.data
  } catch (error) {
    // Enhanced error logging
    console.error(`❌ API Error for ${fullUrl}:`, {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : null,
      request: error.request ? {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      } : null,
    })

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
      console.error(`❌ Network error details:`, {
        url: fullUrl,
        baseURL: API_BASE_URL,
        endpoint: url,
        message: error.message,
        code: error.code,
      })
      throw new Error(`Network error: Unable to reach server at ${API_BASE_URL}. Please check your internet connection and server URL.`)
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
}


