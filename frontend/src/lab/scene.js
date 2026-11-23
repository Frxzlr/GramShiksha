import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createLabMaterials, disposeMaterials } from './materials.js'
import { GazeInteractor } from './interaction.js'
import { LabStateManager } from './state.js'
import { createGravityStation } from './stations/gravity.js'
import { createRampStation } from './stations/ramp.js'
import { createQuizStation } from './stations/quiz.js'

/**
 * Initializes and manages the full 3D Science Lab Three.js environment.
 *
 * @param {HTMLElement} container - The DOM element where WebGL canvas is mounted.
 * @param {Object} [options]
 * @param {Function} [options.onDebugUpdate] - Optional callback providing { fps, target, states }
 * @returns {Object} Lab API { scene, camera, renderer, stateManager, interaction, dispose }
 */
export function initLabScene(container, options = {}) {
  const stateManager = new LabStateManager()

  // 1. Scene, Camera, Renderer
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0c)

  const width = container.clientWidth || 800
  const height = container.clientHeight || 600

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 30)
  // Eye height at 1.6m looking towards the center table at -1.8m
  camera.position.set(0, 1.6, 0.7)
  scene.add(camera) // Needed because reticle is attached to camera

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.xr.enabled = true

  container.appendChild(renderer.domElement)

  // 2. Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 1.1, -1.8)
  controls.minDistance = 0.8
  controls.maxDistance = 3.6
  controls.maxPolarAngle = Math.PI / 2 - 0.04 // Cannot look below floor
  controls.minPolarAngle = 0.15

  // 3. Lighting
  // Soft ambient fill
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
  scene.add(ambientLight)

  // Subtle hemisphere light simulating ceiling/floor contrast
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x18181b, 0.45)
  hemiLight.position.set(0, 2.8, 0)
  scene.add(hemiLight)

  // Main directional light casting shadows
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.15)
  dirLight.position.set(1.6, 2.9, -0.6)
  dirLight.target.position.set(0, 0.9, -1.8)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 1024
  dirLight.shadow.mapSize.height = 1024
  dirLight.shadow.camera.near = 0.5
  dirLight.shadow.camera.far = 7.0
  dirLight.shadow.camera.left = -2.2
  dirLight.shadow.camera.right = 2.2
  dirLight.shadow.camera.top = 2.2
  dirLight.shadow.camera.bottom = -2.2
  dirLight.shadow.bias = -0.0004
  scene.add(dirLight)
  scene.add(dirLight.target)

  // 4. Materials
  const materials = createLabMaterials()

  // 5. Room (8 x 3 x 8 m): floor, walls, ceiling
  const roomGroup = new THREE.Group()
  roomGroup.name = 'LabRoom'

  // Floor (8 x 8 at y = 0)
  const floorGeo = new THREE.PlaneGeometry(8, 8)
  const floorMesh = new THREE.Mesh(floorGeo, materials.floor)
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.position.set(0, 0, 0)
  floorMesh.receiveShadow = true
  roomGroup.add(floorMesh)

  // Ceiling (8 x 8 at y = 3)
  const ceilingGeo = new THREE.PlaneGeometry(8, 8)
  const ceilingMesh = new THREE.Mesh(ceilingGeo, materials.ceiling)
  ceilingMesh.rotation.x = Math.PI / 2
  ceilingMesh.position.set(0, 3, 0)
  roomGroup.add(ceilingMesh)

  // Front Wall (at z = -4)
  const frontWallGeo = new THREE.PlaneGeometry(8, 3)
  const frontWall = new THREE.Mesh(frontWallGeo, materials.wall)
  frontWall.position.set(0, 1.5, -4)
  frontWall.receiveShadow = true
  roomGroup.add(frontWall)

  // Back Wall (at z = 4)
  const backWall = new THREE.Mesh(frontWallGeo, materials.wall)
  backWall.position.set(0, 1.5, 4)
  backWall.rotation.y = Math.PI
  roomGroup.add(backWall)

  // Left Wall (at x = -4)
  const sideWallGeo = new THREE.PlaneGeometry(8, 3)
  const leftWall = new THREE.Mesh(sideWallGeo, materials.wall)
  leftWall.position.set(-4, 1.5, 0)
  leftWall.rotation.y = Math.PI / 2
  leftWall.receiveShadow = true
  roomGroup.add(leftWall)

  // Right Wall (at x = 4)
  const rightWall = new THREE.Mesh(sideWallGeo, materials.wall)
  rightWall.position.set(4, 1.5, 0)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.receiveShadow = true
  roomGroup.add(rightWall)

  scene.add(roomGroup)

  // 6. Center Lab Table (width 2.6m, depth 1.2m, height 0.9m)
  const tableGroup = new THREE.Group()
  tableGroup.name = 'LabTable'
  tableGroup.position.set(0, 0, -1.8)

  const tableTopGeo = new THREE.BoxGeometry(2.6, 0.05, 1.2)
  const tableTopMesh = new THREE.Mesh(tableTopGeo, materials.tableTop)
  tableTopMesh.position.set(0, 0.875, 0)
  tableTopMesh.castShadow = true
  tableTopMesh.receiveShadow = true
  tableGroup.add(tableTopMesh)

  // 4 Table Legs
  const legGeo = new THREE.BoxGeometry(0.06, 0.85, 0.06)
  const legPositions = [
    [-1.22, 0.425, -0.52],
    [1.22, 0.425, -0.52],
    [-1.22, 0.425, 0.52],
    [1.22, 0.425, 0.52],
  ]
  legPositions.forEach(([lx, ly, lz]) => {
    const legMesh = new THREE.Mesh(legGeo, materials.tableLeg)
    legMesh.position.set(lx, ly, lz)
    legMesh.castShadow = true
    legMesh.receiveShadow = true
    tableGroup.add(legMesh)
  })

  scene.add(tableGroup)

  // 7. Optional Model: frontend/public/models/flask.glb
  let loadedFlask = null
  const loader = new GLTFLoader()
  loader.load(
    '/models/flask.glb',
    (gltf) => {
      loadedFlask = gltf.scene
      loadedFlask.position.set(0, 0.9, -1.8)
      loadedFlask.scale.set(0.15, 0.15, 0.15)
      loadedFlask.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      scene.add(loadedFlask)
    },
    undefined,
    () => {
      // Skip silently if file does not exist
    }
  )

  // 8. Interaction Subsystem (Gaze + Touch/Click)
  const interaction = new GazeInteractor(camera, renderer)

  // 9. Interactive Stations
  const gravityStation = createGravityStation({
    scene,
    materials,
    interaction,
    stateManager,
    tableY: 0.9,
  })

  const rampStation = createRampStation({
    scene,
    materials,
    interaction,
    stateManager,
    tableY: 0.9,
  })

  const quizStation = createQuizStation({
    scene,
    materials,
    interaction,
    stateManager,
  })

  // 10. Responsive Canvas Resizing
  const handleResize = () => {
    if (!container) return
    const w = container.clientWidth || 800
    const h = container.clientHeight || 600
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  const resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(container)
  window.addEventListener('resize', handleResize)

  // 11. Render Loop & FPS Monitor
  const clock = new THREE.Clock()
  let frameCount = 0
  let fpsTimer = 0
  let currentFps = 60

  renderer.setAnimationLoop(() => {
    const rawDt = clock.getDelta()
    const dt = Math.min(rawDt, 0.1) // Safety cap

    // Calculate FPS
    frameCount += 1
    fpsTimer += rawDt
    if (fpsTimer >= 0.5) {
      currentFps = Math.round((frameCount / fpsTimer))
      frameCount = 0
      fpsTimer = 0
    }

    // Update Controls (only when not in immersive VR session)
    if (!renderer.xr.isPresenting) {
      controls.update()
    }

    // Update interactions & stations
    interaction.update(dt)
    gravityStation.update(dt)
    rampStation.update(dt)
    quizStation.update(dt)

    renderer.render(scene, camera)

    if (typeof options.onDebugUpdate === 'function') {
      const target = interaction.getCurrentTarget()
      options.onDebugUpdate({
        fps: currentFps,
        target: target ? target.label : 'None',
        dwellProgress: target ? Math.round(target.dwellProgress * 100) : 0,
        states: stateManager.getState(),
      })
    }
  })

  // 12. Complete Cleanup / Dispose
  function dispose() {
    renderer.setAnimationLoop(null)
    resizeObserver.disconnect()
    window.removeEventListener('resize', handleResize)

    controls.dispose()
    interaction.dispose()
    gravityStation.dispose()
    rampStation.dispose()
    quizStation.dispose()
    stateManager.dispose()

    if (loadedFlask) {
      scene.remove(loadedFlask)
    }

    // Dispose room and table geometries
    floorGeo.dispose()
    ceilingGeo.dispose()
    frontWallGeo.dispose()
    sideWallGeo.dispose()
    tableTopGeo.dispose()
    legGeo.dispose()

    disposeMaterials(materials)

    // Remove canvas from DOM
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
    renderer.dispose()
  }

  return {
    scene,
    camera,
    renderer,
    stateManager,
    interaction,
    gravityStation,
    rampStation,
    quizStation,
    dispose,
  }
}
