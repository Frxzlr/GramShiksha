/**
 * PURE physics calculation functions (no Three.js or external library imports).
 */

export const DEFAULT_GRAVITY = 9.8

/**
 * Calculates one simulation step of a falling object under gravity and optional air resistance.
 *
 * @param {Object} state - { y: number, v: number, t: number, landed: boolean }
 * @param {number} dt - Time delta in seconds
 * @param {Object} options
 * @param {number} [options.mass=1] - Mass in kg
 * @param {number} [options.dragCoeff=0.5] - Air drag coefficient k (F_drag = k * v^2)
 * @param {boolean} [options.airResistance=false] - Whether air resistance is active
 * @param {number} [options.g=9.8] - Acceleration due to gravity (m/s^2)
 * @param {number} [options.targetY=0] - Ground / landing plane height
 * @returns {Object} Next state { y, v, t, landed }
 */
export function stepFall(
  state,
  dt,
  { mass = 1, dragCoeff = 0.5, airResistance = false, g = DEFAULT_GRAVITY, targetY = 0 } = {}
) {
  if (state.landed) {
    return { ...state }
  }

  const currentY = typeof state.y === 'number' ? state.y : 1
  const currentV = typeof state.v === 'number' ? state.v : 0
  const currentT = typeof state.t === 'number' ? state.t : 0

  let dragAcc = 0
  if (airResistance && dragCoeff > 0 && mass > 0) {
    // Air resistance opposes velocity direction: a_drag = - (dragCoeff / mass) * |v| * v
    dragAcc = -(dragCoeff / mass) * Math.abs(currentV) * currentV
  }

  const acceleration = -g + dragAcc
  const nextV = currentV + acceleration * dt
  const nextY = currentY + nextV * dt

  if (nextY <= targetY) {
    // Precise linear interpolation to compute exact touchdown time
    const fraction = currentY !== nextY ? Math.max(0, Math.min(1, (currentY - targetY) / (currentY - nextY))) : 1
    return {
      y: targetY,
      v: 0,
      t: currentT + fraction * dt,
      landed: true,
    }
  }

  return {
    y: nextY,
    v: nextV,
    t: currentT + dt,
    landed: false,
  }
}

/**
 * Checks whether an object on an inclined plane slides under gravity given angle and coefficient of friction.
 * An object slides if tan(theta) > mu.
 *
 * @param {number} angleDeg - Inclination angle in degrees
 * @param {number} mu - Coefficient of friction
 * @returns {boolean} True if object slides, false if static
 */
export function slides(angleDeg, mu) {
  const rad = (angleDeg * Math.PI) / 180
  return Math.tan(rad) > mu
}

/**
 * Calculates net linear acceleration down an inclined plane with friction.
 * If the object does not slide, returns 0.
 *
 * @param {number} angleDeg - Inclination angle in degrees
 * @param {number} mu - Coefficient of friction
 * @param {number} [g=9.8] - Acceleration due to gravity (m/s^2)
 * @returns {number} Acceleration in m/s^2
 */
export function rampAcceleration(angleDeg, mu, g = DEFAULT_GRAVITY) {
  if (!slides(angleDeg, mu)) {
    return 0
  }
  const rad = (angleDeg * Math.PI) / 180
  const a = g * (Math.sin(rad) - mu * Math.cos(rad))
  return Math.max(0, a)
}
