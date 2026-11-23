import test from 'node:test'
import assert from 'node:assert/strict'
import { stepFall, slides, rampAcceleration } from './physics.js'

test('both balls land at the same time without air resistance', () => {
  const dt = 0.005
  let heavyState = { y: 2.0, v: 0, t: 0, landed: false }
  let lightState = { y: 2.0, v: 0, t: 0, landed: false }

  const heavyOpts = { mass: 5.0, dragCoeff: 0.5, airResistance: false, targetY: 0 }
  const lightOpts = { mass: 0.5, dragCoeff: 0.5, airResistance: false, targetY: 0 }

  while (!heavyState.landed || !lightState.landed) {
    if (!heavyState.landed) heavyState = stepFall(heavyState, dt, heavyOpts)
    if (!lightState.landed) lightState = stepFall(lightState, dt, lightOpts)
  }

  assert.equal(heavyState.landed, true)
  assert.equal(lightState.landed, true)
  assert.ok(Math.abs(heavyState.t - lightState.t) < 0.0001, `Landing times differ: heavy=${heavyState.t}, light=${lightState.t}`)
})

test('light ball lands later with air resistance', () => {
  const dt = 0.005
  let heavyState = { y: 2.0, v: 0, t: 0, landed: false }
  let lightState = { y: 2.0, v: 0, t: 0, landed: false }

  const heavyOpts = { mass: 5.0, dragCoeff: 0.5, airResistance: true, targetY: 0 }
  const lightOpts = { mass: 0.5, dragCoeff: 0.5, airResistance: true, targetY: 0 }

  while (!heavyState.landed || !lightState.landed) {
    if (!heavyState.landed) heavyState = stepFall(heavyState, dt, heavyOpts)
    if (!lightState.landed) lightState = stepFall(lightState, dt, lightOpts)
  }

  assert.equal(heavyState.landed, true)
  assert.equal(lightState.landed, true)
  assert.ok(
    lightState.t > heavyState.t + 0.02,
    `Expected light ball to land significantly later. light=${lightState.t}, heavy=${heavyState.t}`
  )
})

test('block does not slide at 15 deg with mu 0.4, slides at 30 and 45', () => {
  const mu = 0.4

  // 15 degrees: should NOT slide
  assert.equal(slides(15, mu), false, 'Block should not slide at 15 degrees')
  assert.equal(rampAcceleration(15, mu), 0, 'Ramp acceleration at 15 degrees should be 0')

  // 30 degrees: should slide
  assert.equal(slides(30, mu), true, 'Block should slide at 30 degrees')
  const a30 = rampAcceleration(30, mu)
  assert.ok(a30 > 0, `Ramp acceleration at 30 degrees should be > 0, got ${a30}`)

  // 45 degrees: should slide and have higher acceleration than 30 deg
  assert.equal(slides(45, mu), true, 'Block should slide at 45 degrees')
  const a45 = rampAcceleration(45, mu)
  assert.ok(a45 > a30, `Ramp acceleration at 45 degrees (${a45}) should be > 30 degrees (${a30})`)
})
