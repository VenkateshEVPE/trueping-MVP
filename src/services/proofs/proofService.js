import { apiRequest } from '../api'

/**
 * Upload a single proof to the server
 * @param {object} proofData - Proof data object
 * @param {string} proofData.device_id - Device ID (required for proof)
 * @param {string} proofData.unique_id - Unique device ID (for device upsert)
 * @param {string} proofData.device_name - Device name
 * @param {string} proofData.os - Operating system
 * @param {string} proofData.os_version - OS version
 * @param {string} proofData.ip_address - IP address
 * @param {string} proofData.network_type - Network type
 * @param {number} proofData.airplane_mode - Airplane mode (0 or 1)
 * @param {number} proofData.internet_reachable - Internet reachable (0 or 1)
 * @param {number} proofData.latitude - Latitude
 * @param {number} proofData.longitude - Longitude
 * @param {number} proofData.altitude - Altitude
 * @param {number} proofData.accuracy - Location accuracy
 * @param {string} proofData.upload_speed - Upload speed
 * @param {string} proofData.download_speed - Download speed
 * @param {number} proofData.avg_latency - Average latency
 * @param {number} proofData.best_latency - Best latency
 * @param {string} proofData.server_tested - Server tested
 * @param {number} proofData.timestamp - Timestamp (auto-generated if not provided)
 * @returns {Promise<object>} - Response data with device and proof information
 */
export const uploadProof = async (proofData) => {
  try {
    // Format data according to API specification
    const formattedData = {
      device_id: proofData.device_id || null,
      unique_id: proofData.unique_id || null,
      device_name: proofData.device_name || null,
      os: proofData.os || null,
      os_version: proofData.os_version || null,
      ip_address: proofData.ip_address || null,
      network_type: proofData.network_type || null,
      airplane_mode: proofData.airplane_mode === 1 || proofData.airplane_mode === true ? 1 : 0,
      internet_reachable: proofData.internet_reachable === 1 || proofData.internet_reachable === true ? 1 : 0,
      latitude: proofData.latitude || null,
      longitude: proofData.longitude || null,
      altitude: proofData.altitude || null,
      accuracy: proofData.accuracy || null,
      upload_speed: proofData.upload_speed || null,
      download_speed: proofData.download_speed || null,
      avg_latency: proofData.avg_latency || null,
      best_latency: proofData.best_latency || null,
      server_tested: proofData.server_tested || null,
      timestamp: proofData.timestamp || Date.now(),
    }

    console.log('📤 Uploading proof with data:', {
      device_id: formattedData.device_id,
      unique_id: formattedData.unique_id,
      timestamp: formattedData.timestamp,
      hasLocation: !!(formattedData.latitude && formattedData.longitude),
    })

    const response = await apiRequest('proofs', {
      method: 'POST',
      body: formattedData,
    })

    console.log('✅ Proof upload response:', response)
    return response
  } catch (error) {
    console.error('❌ Error uploading proof:', {
      message: error.message,
      status: error.status,
      data: error.data,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Upload multiple proofs to the server
 * @param {Array<object>} proofs - Array of proof data objects
 * @returns {Promise<object>} - Upload summary with success/failure counts
 */
export const uploadProofs = async (proofs) => {
  if (!proofs || proofs.length === 0) {
    return {
      success: true,
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    }
  }

  console.log(`📤 Uploading ${proofs.length} proofs to server...`)

  let successCount = 0
  let failureCount = 0
  const errors = []

  for (let i = 0; i < proofs.length; i++) {
    const proof = proofs[i]
    try {
      const response = await uploadProof(proof)
      
      if (response && response.success) {
        successCount++
        console.log(`✅ Proof ${i + 1}/${proofs.length} uploaded successfully`)
      } else {
        failureCount++
        const errorMsg = `Upload response indicates failure for proof ${i + 1}`
        errors.push({ index: i, error: errorMsg, data: response })
        console.warn(`⚠️ ${errorMsg}:`, response)
      }
    } catch (error) {
      failureCount++
      const errorMsg = error.message || 'Unknown error'
      errors.push({ index: i, error: errorMsg, data: proof })
      console.error(`❌ Error uploading proof ${i + 1}/${proofs.length}:`, errorMsg)
      // Continue with next proof even if one fails
    }
  }

  console.log(`📊 Upload summary: ${successCount} succeeded, ${failureCount} failed out of ${proofs.length} total`)

  return {
    success: successCount > 0,
    total: proofs.length,
    succeeded: successCount,
    failed: failureCount,
    errors: errors,
  }
}

