import * as THREE from 'three'
import { slides, rampAcceleration } from '../physics.js'
import { makeLabel } from '../labels.js'

/**
 * Friction & Inclined Plane (Ramp) Station
 * Demonstrates static friction threshold and inclined plane acceleration.
 */
export function createRampStation({ scene, materials, interaction, stateManager, tableY = 0.9 }) {
  const group = new THREE.Group()
  group.name = 'RampStation'
  group.position.set(0.75, tableY, -1.8)

  const MU = 0.4
  const ANGLES = [15, 30, 45]
  let angleIndex = 0 // starts at 15 deg
  let currentAngle = ANGLES[angleIndex]

  let stationState = 'ready' // 'idle' | 'rotating' | 'ready' | 'sliding' | 'stopped'

  // Ramp geometry dimensions
  const RAMP_LENGTH = 0.65
  const RAMP_WIDTH = 0.22
  const RAMP_THICKNESS = 0.02
  const BLOCK_SIZE = 0.06
  const MAX_SLIDE_DIST = RAMP_LENGTH - BLOCK_SIZE - 0.06

  let blockDist = 0 // 0 = at top, MAX_SLIDE_DIST = at bottom
  let blockVel = 0
  let currentAcc = 0

  // Rotation animation state
  let isRotating = false
  let rotTimer = 0
  const ROT_DURATION = 0.5
  let rotStartAngle = currentAngle
  let rotTargetAngle = currentAngle

  // 1. Station Base
  const baseGeo = new THREE.BoxGeometry(0.8, 0.02, 0.48)
  const baseMesh = new THREE.Mesh(baseGeo, materials.standBase)
  baseMesh.position.set(0, 0.01, 0.04)
  baseMesh.receiveShadow = true
  group.add(baseMesh)

  // 2. Incline Pivot Assembly
  const pivotGroup = new THREE.Group()
  pivotGroup.position.set(0, 0.03, 0.14)
  group.add(pivotGroup)

  // Ramp Board
  const rampGeo = new THREE.BoxGeometry(RAMP_WIDTH, RAMP_THICKNESS, RAMP_LENGTH)
  const rampMesh = new THREE.Mesh(rampGeo, materials.rampSurface)
  rampMesh.position.set(0, RAMP_THICKNESS / 2, -RAMP_LENGTH / 2)
  rampMesh.castShadow = true
  rampMesh.receiveShadow = true
  pivotGroup.add(rampMesh)

  // Bottom stopper
  const stopperGeo = new THREE.BoxGeometry(RAMP_WIDTH, 0.03, 0.02)
  const stopperMesh = new THREE.Mesh(stopperGeo, materials.rampPivot)
  stopperMesh.position.set(0, 0.025, -0.01)
  pivotGroup.add(stopperMesh)

  // 3. Sliding Block
  const blockGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE * 0.7, BLOCK_SIZE)
  const blockMesh = new THREE.Mesh(blockGeo, materials.rampBlock)
  blockMesh.castShadow = true
  pivotGroup.add(blockMesh)

  function updateBlockPosition() {
    const zPos = -(RAMP_LENGTH - BLOCK_SIZE / 2 - 0.02) + blockDist
    blockMesh.position.set(0, RAMP_THICKNESS + (BLOCK_SIZE * 0.7) / 2, zPos)
  }

  function applyRampRotation(angleDeg) {
    pivotGroup.rotation.x = -(angleDeg * Math.PI) / 180
  }

  // 4. Information Labels - Enlarged for clear viewing from default camera
  const titleLabel = makeLabel('INCLINED PLANE & FRICTION\nCoefficient μ = 0.40', {
    width: 0.85,
    height: 0.22,
    fontSize: 34,
    bgColor: 'rgba(15, 18, 24, 0.94)',
  })
  titleLabel.position.set(0, 0.94, 0)
  group.add(titleLabel)

  const infoLabel = makeLabel('', {
    width: 0.72,
    height: 0.24,
    fontSize: 28,
    lineHeight: 1.35,
  })
  infoLabel.position.set(0, 0.60, 0.08)
  group.add(infoLabel)

  function refreshInfoLabel() {
    const isSliding = slides(currentAngle, MU)
    currentAcc = rampAcceleration(currentAngle, MU)
    const statusText = isSliding
      ? 'Status: SLIDES (tan θ > μ)'
      : 'Status: STATIC (Friction holds)'
    const statusColor = isSliding ? '#22c55e' : '#f59e0b'

    infoLabel.update(
      `Incline: ${currentAngle}°  (μ = 0.40)\n${statusText}\nAcceleration: ${currentAcc.toFixed(2)} m/s²`,
      { color: statusColor }
    )
  }

  applyRampRotation(currentAngle)
  updateBlockPosition()
  refreshInfoLabel()

  // 5. Interactive Control Buttons - Angled toward camera
  const btnGeo = new THREE.BoxGeometry(0.26, 0.04, 0.09)

  // CHANGE ANGLE Button
  const angleBtnMesh = new THREE.Mesh(btnGeo, materials.buttonSecondary.clone())
  angleBtnMesh.position.set(-0.18, 0.035, 0.27)
  angleBtnMesh.castShadow = true
  group.add(angleBtnMesh)

  const angleBtnLabel = makeLabel('ANGLE: 15°', {
    width: 0.26,
    height: 0.08,
    fontSize: 28,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#ffffff',
  })
  angleBtnLabel.position.set(-0.18, 0.065, 0.27)
  angleBtnLabel.rotation.x = -Math.PI / 4 // 45 degree tilt toward camera
  group.add(angleBtnLabel)

  // RELEASE Button
  const releaseBtnMesh = new THREE.Mesh(btnGeo, materials.buttonPrimary.clone())
  releaseBtnMesh.position.set(0.18, 0.035, 0.27)
  releaseBtnMesh.castShadow = true
  group.add(releaseBtnMesh)

  const releaseBtnLabel = makeLabel('RELEASE', {
    width: 0.26,
    height: 0.08,
    fontSize: 28,
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: '#ffffff',
  })
  releaseBtnLabel.position.set(0.18, 0.065, 0.27)
  releaseBtnLabel.rotation.x = -Math.PI / 4 // 45 degree tilt toward camera
  group.add(releaseBtnLabel)

  // Action Functions
  function changeAngle() {
    if (isRotating) return
    angleIndex = (angleIndex + 1) % ANGLES.length
    rotStartAngle = currentAngle
    rotTargetAngle = ANGLES[angleIndex]
    rotTimer = 0
    isRotating = true

    // Reset block to top
    blockDist = 0
    blockVel = 0
    updateBlockPosition()

    stationState = 'rotating'
    stateManager.setRamp('rotating')
    angleBtnLabel.update(`ANGLE: ${rotTargetAngle}°`)
  }

  function release() {
    if (isRotating) return
    blockDist = 0
    blockVel = 0
    updateBlockPosition()

    const willSlide = slides(currentAngle, MU)
    if (willSlide) {
      stationState = 'sliding'
      stateManager.setRamp('sliding')
    } else {
      stationState = 'stopped'
      stateManager.setRamp('stopped')
    }
  }

  // Register with Interaction System
  interaction.register({
    mesh: angleBtnMesh,
    onActivate: changeAngle,
    label: 'Ramp: Change Angle',
  })

  interaction.register({
    mesh: releaseBtnMesh,
    onActivate: release,
    label: 'Ramp: Release Block',
  })

  scene.add(group)

  // Frame update
  function update(dt) {
    if (isRotating) {
      rotTimer += dt
      const progress = Math.min(1.0, rotTimer / ROT_DURATION)
      const eased = progress * progress * (3 - 2 * progress)
      const interpolated = rotStartAngle + (rotTargetAngle - rotStartAngle) * eased
      applyRampRotation(interpolated)

      if (progress >= 1.0) {
        isRotating = false
        currentAngle = rotTargetAngle
        applyRampRotation(currentAngle)
        stationState = 'ready'
        stateManager.setRamp('ready')
        stateManager.setRampAngle(currentAngle)
        refreshInfoLabel()
      }
    }

    if (stationState === 'sliding') {
      const acc = rampAcceleration(currentAngle, MU)
      blockVel += acc * dt
      blockDist += blockVel * dt
      updateBlockPosition()

      if (blockDist >= MAX_SLIDE_DIST) {
        blockDist = MAX_SLIDE_DIST
        blockVel = 0
        stationState = 'stopped'
        stateManager.setRamp('stopped')
      }
    }
  }

  function dispose() {
    scene.remove(group)
    interaction.unregister(angleBtnMesh)
    interaction.unregister(releaseBtnMesh)
    titleLabel.dispose()
    infoLabel.dispose()
    angleBtnLabel.dispose()
    releaseBtnLabel.dispose()

    baseGeo.dispose()
    rampGeo.dispose()
    stopperGeo.dispose()
    blockGeo.dispose()
    btnGeo.dispose()
    angleBtnMesh.material.dispose()
    releaseBtnMesh.material.dispose()
  }

  return {
    group,
    update,
    changeAngle,
    release,
    dispose,
  }
}
