import * as THREE from 'three'
import { stepFall } from '../physics.js'
import { makeLabel } from '../labels.js'

/**
 * Gravity & Free Fall Station
 * Demonstrates Galilean free-fall and aerodynamic drag comparison.
 */
export function createGravityStation({ scene, materials, interaction, stateManager, tableY = 0.9 }) {
  const group = new THREE.Group()
  group.name = 'GravityStation'
  group.position.set(-0.75, tableY, -1.8)

  const START_Y = 0.65       // Relative to station origin (world Y: 0.9 + 0.65 = 1.55)
  const BALL_RADIUS = 0.055
  const LANDING_Y = BALL_RADIUS // Relative to station (world Y: 0.9 + 0.055 = 0.955)

  let airResistance = false
  let stationState = 'idle' // 'idle' | 'falling' | 'landed'

  let heavyState = { y: START_Y, v: 0, t: 0, landed: false }
  let lightState = { y: START_Y, v: 0, t: 0, landed: false }

  const heavyPhysics = { mass: 5.0, dragCoeff: 0.45, airResistance: false, targetY: LANDING_Y }
  const lightPhysics = { mass: 0.5, dragCoeff: 0.45, airResistance: false, targetY: LANDING_Y }

  // 1. Structure / Frame
  // Base plate
  const baseGeo = new THREE.BoxGeometry(0.7, 0.02, 0.45)
  const baseMesh = new THREE.Mesh(baseGeo, materials.standBase)
  baseMesh.position.set(0, 0.01, 0)
  baseMesh.receiveShadow = true
  group.add(baseMesh)

  // Vertical support posts
  const postGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.75, 16)
  const postLeft = new THREE.Mesh(postGeo, materials.metalFrame)
  postLeft.position.set(-0.25, 0.38, 0)
  postLeft.castShadow = true
  group.add(postLeft)

  const postRight = new THREE.Mesh(postGeo, materials.metalFrame)
  postRight.position.set(0.25, 0.38, 0)
  postRight.castShadow = true
  group.add(postRight)

  // Top crossbar
  const barGeo = new THREE.BoxGeometry(0.56, 0.02, 0.04)
  const topBar = new THREE.Mesh(barGeo, materials.metalFrame)
  topBar.position.set(0, 0.74, 0)
  topBar.castShadow = true
  group.add(topBar)

  // Landing catch pads
  const padGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.01, 24)
  const padHeavy = new THREE.Mesh(padGeo, materials.cushionPad)
  padHeavy.position.set(-0.16, 0.025, 0)
  padHeavy.receiveShadow = true
  group.add(padHeavy)

  const padLight = new THREE.Mesh(padGeo, materials.cushionPad)
  padLight.position.set(0.16, 0.025, 0)
  padLight.receiveShadow = true
  group.add(padLight)

  // 2. Spheres
  const sphereGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)

  // Heavy Ball (Metal, 5kg)
  const heavyMesh = new THREE.Mesh(sphereGeo, materials.heavyBall)
  heavyMesh.position.set(-0.16, START_Y, 0)
  heavyMesh.castShadow = true
  group.add(heavyMesh)

  // Light Ball (Rubber, 0.5kg)
  const lightMesh = new THREE.Mesh(sphereGeo, materials.lightBall)
  lightMesh.position.set(0.16, START_Y, 0)
  lightMesh.castShadow = true
  group.add(lightMesh)

  // 3. Informational Labels
  const titleLabel = makeLabel('FREE FALL EXPERIMENT\nGalileo Drop Tower', {
    width: 0.65,
    height: 0.18,
    fontSize: 26,
    bgColor: 'rgba(15, 17, 21, 0.92)',
  })
  titleLabel.position.set(0, 0.88, 0)
  group.add(titleLabel)

  const heavyLabel = makeLabel('Heavy (5 kg)\n0.000 s', {
    width: 0.3,
    height: 0.14,
    fontSize: 22,
    color: '#cbd5e1',
  })
  heavyLabel.position.set(-0.16, 0.45, 0.12)
  group.add(heavyLabel)

  const lightLabel = makeLabel('Light (0.5 kg)\n0.000 s', {
    width: 0.3,
    height: 0.14,
    fontSize: 22,
    color: '#f87171',
  })
  lightLabel.position.set(0.16, 0.45, 0.12)
  group.add(lightLabel)

  const statusLabel = makeLabel('Air Resistance: OFF\n(Vacuum Mode)', {
    width: 0.45,
    height: 0.14,
    fontSize: 22,
    color: '#a1a1aa',
  })
  statusLabel.position.set(0, 0.22, 0.15)
  group.add(statusLabel)

  // 4. Interactive 3D Control Buttons
  const buttonGeo = new THREE.BoxGeometry(0.14, 0.035, 0.08)

  // DROP Button
  const dropMesh = new THREE.Mesh(buttonGeo, materials.buttonPrimary.clone())
  dropMesh.position.set(-0.16, 0.03, 0.22)
  dropMesh.castShadow = true
  group.add(dropMesh)

  const dropLabel = makeLabel('DROP', {
    width: 0.14,
    height: 0.07,
    fontSize: 24,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#ffffff',
  })
  dropLabel.position.set(-0.16, 0.05, 0.22)
  dropLabel.rotation.x = -Math.PI / 2
  group.add(dropLabel)

  // RESET Button
  const resetMesh = new THREE.Mesh(buttonGeo, materials.buttonSecondary.clone())
  resetMesh.position.set(0.16, 0.03, 0.22)
  resetMesh.castShadow = true
  group.add(resetMesh)

  const resetLabel = makeLabel('RESET', {
    width: 0.14,
    height: 0.07,
    fontSize: 24,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#ffffff',
  })
  resetLabel.position.set(0.16, 0.05, 0.22)
  resetLabel.rotation.x = -Math.PI / 2
  group.add(resetLabel)

  // AIR RESISTANCE Toggle Button
  const toggleGeo = new THREE.BoxGeometry(0.36, 0.035, 0.07)
  const toggleMesh = new THREE.Mesh(toggleGeo, materials.buttonSecondary.clone())
  toggleMesh.position.set(0, 0.03, 0.31)
  toggleMesh.castShadow = true
  group.add(toggleMesh)

  const toggleLabel = makeLabel('AIR RESISTANCE: OFF', {
    width: 0.36,
    height: 0.07,
    fontSize: 20,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#e4e4e7',
  })
  toggleLabel.position.set(0, 0.05, 0.31)
  toggleLabel.rotation.x = -Math.PI / 2
  group.add(toggleLabel)

  // Actions
  function drop() {
    if (stationState === 'falling') return
    heavyState = { y: START_Y, v: 0, t: 0, landed: false }
    lightState = { y: START_Y, v: 0, t: 0, landed: false }
    heavyPhysics.airResistance = airResistance
    lightPhysics.airResistance = airResistance
    stationState = 'falling'
    stateManager.setGravity('falling')
  }

  function reset() {
    stationState = 'idle'
    heavyState = { y: START_Y, v: 0, t: 0, landed: false }
    lightState = { y: START_Y, v: 0, t: 0, landed: false }
    heavyMesh.position.y = START_Y
    lightMesh.position.y = START_Y
    heavyLabel.update('Heavy (5 kg)\n0.000 s')
    lightLabel.update('Light (0.5 kg)\n0.000 s')
    stateManager.setGravity('idle')
    stateManager.setGravityTimes(0, 0)
  }

  function toggleAir() {
    airResistance = !airResistance
    toggleLabel.update(`AIR RESISTANCE: ${airResistance ? 'ON' : 'OFF'}`)
    statusLabel.update(
      airResistance
        ? 'Air Resistance: ON\n(Drag Active)'
        : 'Air Resistance: OFF\n(Vacuum Mode)',
      { color: airResistance ? '#38bdf8' : '#a1a1aa' }
    )
    stateManager.setAirResistance(airResistance)
    if (stationState === 'landed') {
      reset()
    }
  }

  // Register with Interaction System
  interaction.register({
    mesh: dropMesh,
    onActivate: drop,
    label: 'Gravity: Drop Spheres',
  })

  interaction.register({
    mesh: resetMesh,
    onActivate: reset,
    label: 'Gravity: Reset Tower',
  })

  interaction.register({
    mesh: toggleMesh,
    onActivate: toggleAir,
    label: 'Gravity: Toggle Air Resistance',
  })

  scene.add(group)

  // Frame update
  function update(dt) {
    if (stationState === 'falling') {
      if (!heavyState.landed) {
        heavyState = stepFall(heavyState, dt, heavyPhysics)
        heavyMesh.position.y = heavyState.y
        heavyLabel.update(`Heavy (5 kg)\n${heavyState.t.toFixed(3)} s`)
      }

      if (!lightState.landed) {
        lightState = stepFall(lightState, dt, lightPhysics)
        lightMesh.position.y = lightState.y
        lightLabel.update(`Light (0.5 kg)\n${lightState.t.toFixed(3)} s`)
      }

      if (heavyState.landed && lightState.landed) {
        stationState = 'landed'
        stateManager.setGravity('landed')
        stateManager.setGravityTimes(heavyState.t, lightState.t)
      }
    }
  }

  function dispose() {
    scene.remove(group)
    interaction.unregister(dropMesh)
    interaction.unregister(resetMesh)
    interaction.unregister(toggleMesh)
    titleLabel.dispose()
    heavyLabel.dispose()
    lightLabel.dispose()
    statusLabel.dispose()
    dropLabel.dispose()
    resetLabel.dispose()
    toggleLabel.dispose()

    baseGeo.dispose()
    postGeo.dispose()
    barGeo.dispose()
    padGeo.dispose()
    sphereGeo.dispose()
    buttonGeo.dispose()
    toggleGeo.dispose()
    dropMesh.material.dispose()
    resetMesh.material.dispose()
    toggleMesh.material.dispose()
  }

  return {
    group,
    update,
    drop,
    reset,
    toggleAir,
    dispose,
  }
}
