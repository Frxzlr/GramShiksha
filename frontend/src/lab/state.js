/**
 * Minimal observable state machine for the 3D Science Lab stations.
 * Allows stations and React HUD to synchronize state seamlessly.
 */

export class LabStateManager {
  constructor() {
    this.state = {
      gravity: 'idle', // 'idle' | 'falling' | 'landed'
      ramp: 'ready',   // 'idle' | 'rotating' | 'ready' | 'sliding' | 'stopped'
      quiz: {
        questionIndex: 0,
        score: 0,
        total: 5,
        status: 'ready', // 'ready' | 'feedback' | 'finished'
      },
      airResistance: false,
      rampAngle: 15,
      gravityTimes: { heavy: 0, light: 0 },
    }
    this.listeners = new Set()
  }

  getState() {
    return { ...this.state }
  }

  notify() {
    const current = this.getState()
    this.listeners.forEach((cb) => {
      try {
        cb(current)
      } catch (err) {
        console.error('LabState listener error:', err)
      }
    })
  }

  setGravity(status) {
    if (this.state.gravity !== status) {
      this.state.gravity = status
      this.notify()
    }
  }

  setGravityTimes(heavyTime, lightTime) {
    this.state.gravityTimes = { heavy: heavyTime, light: lightTime }
    this.notify()
  }

  setAirResistance(enabled) {
    this.state.airResistance = Boolean(enabled)
    this.notify()
  }

  setRamp(status) {
    if (this.state.ramp !== status) {
      this.state.ramp = status
      this.notify()
    }
  }

  setRampAngle(angle) {
    if (this.state.rampAngle !== angle) {
      this.state.rampAngle = angle
      this.notify()
    }
  }

  setQuiz(quizPartial) {
    this.state.quiz = { ...this.state.quiz, ...quizPartial }
    this.notify()
  }

  /**
   * Subscribes a callback to state mutations.
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    this.listeners.add(callback)
    // Immediately invoke with current state
    callback(this.getState())
    return () => {
      this.listeners.delete(callback)
    }
  }

  dispose() {
    this.listeners.clear()
  }
}
