import * as THREE from 'three'

/**
 * Central registry of all MeshStandardMaterial definitions for the 3D Science Lab.
 */
export function createLabMaterials() {
  const materials = {
    // Room surfaces (8 x 3 x 8 m) - brightened for crisp visual clarity
    floor: new THREE.MeshStandardMaterial({
      color: 0x8a99ad, // Polished, light architectural laboratory floor
      roughness: 0.45,
      metalness: 0.08,
      name: 'floorMaterial',
    }),
    wall: new THREE.MeshStandardMaterial({
      color: 0xd8dde6, // Bright, clean off-white / light slate laboratory walls
      roughness: 0.7,
      metalness: 0.02,
      name: 'wallMaterial',
    }),
    ceiling: new THREE.MeshStandardMaterial({
      color: 0xedf2f8, // Bright white reflective ceiling
      roughness: 0.8,
      metalness: 0.02,
      name: 'ceilingMaterial',
    }),

    // Lab bench & structural framework
    tableTop: new THREE.MeshStandardMaterial({
      color: 0x384152, // Smooth, modern scientific lab benchtop
      roughness: 0.35,
      metalness: 0.15,
      name: 'tableTopMaterial',
    }),
    tableLeg: new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      roughness: 0.45,
      metalness: 0.65,
      name: 'tableLegMaterial',
    }),
    metalFrame: new THREE.MeshStandardMaterial({
      color: 0xb0bccb,
      roughness: 0.2,
      metalness: 0.85,
      name: 'metalFrameMaterial',
    }),
    standBase: new THREE.MeshStandardMaterial({
      color: 0x28303f,
      roughness: 0.55,
      metalness: 0.25,
      name: 'standBaseMaterial',
    }),
    cushionPad: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.1,
      name: 'cushionPadMaterial',
    }),

    // Gravity station spheres
    heavyBall: new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.18,
      metalness: 0.9,
      name: 'heavyBallMaterial',
    }),
    lightBall: new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.6,
      metalness: 0.05,
      name: 'lightBallMaterial',
    }),

    // Ramp station
    rampSurface: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.3,
      name: 'rampSurfaceMaterial',
    }),
    rampBlock: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.5,
      metalness: 0.05,
      name: 'rampBlockMaterial',
    }),
    rampPivot: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.3,
      metalness: 0.8,
      name: 'rampPivotMaterial',
    }),

    // Wall Quiz Board
    quizBoard: new THREE.MeshStandardMaterial({
      color: 0x0f1117,
      roughness: 0.55,
      metalness: 0.15,
      name: 'quizBoardMaterial',
    }),
    quizFrame: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.6,
      name: 'quizFrameMaterial',
    }),

    // 3D Interactive Buttons
    buttonPrimary: new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x052e16,
      emissiveIntensity: 0.25,
      name: 'buttonPrimaryMaterial',
    }),
    buttonSecondary: new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.15,
      name: 'buttonSecondaryMaterial',
    }),
    buttonDanger: new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
      metalness: 0.15,
      name: 'buttonDangerMaterial',
    }),
    buttonCorrect: new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x16a34a,
      emissiveIntensity: 0.4,
      name: 'buttonCorrectMaterial',
    }),
    buttonWrong: new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xdc2626,
      emissiveIntensity: 0.4,
      name: 'buttonWrongMaterial',
    }),
  }

  return materials
}

/**
 * Disposes a dictionary of MeshStandardMaterials cleanly.
 * @param {Object} materials
 */
export function disposeMaterials(materials) {
  if (!materials) return
  for (const key of Object.keys(materials)) {
    const mat = materials[key]
    if (mat && typeof mat.dispose === 'function') {
      mat.dispose()
    }
  }
}
