/**
 * Calculate angle from touch coordinates
 * @param {number} x - Touch X coordinate
 * @param {number} y - Touch Y coordinate
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @returns {number} Angle in degrees (0-360)
 */
export const getAngle = (x, y, centerX, centerY) => {
  const deltaX = x - centerX
  const deltaY = y - centerY
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  return (angle + 360) % 360
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export const getDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

