import * as THREE from 'three'

/**
 * GazeInteractor handles gaze dwell activation (2.0s dwell) and instant pointer/touch activation.
 * Includes a head-mounted reticle that visualizes dwell progress in VR/desktop.
 */
export class GazeInteractor {
  constructor(camera, renderer) {
    this.camera = camera
    this.renderer = renderer
    this.raycaster = new THREE.Raycaster()
    this.pointerRaycaster = new THREE.Raycaster()

    // Registered interactive objects: Array of { mesh, onActivate, label, originalEmissive, originalIntensity }
    this.registry = []

    // State tracking
    this.hoveredItem = null
    this.dwellTimer = 0
    this.cooldownTimer = 0
    this.DWELL_TIME = 2.0
    this.COOLDOWN_TIME = 1.0

    // Setup Reticle (attached to camera at z = -1.0)
    this.reticleCanvas = document.createElement('canvas')
    this.reticleCanvas.width = 128
    this.reticleCanvas.height = 128
    this.reticleCtx = this.reticleCanvas.getContext('2d')
    this.reticleTexture = new THREE.CanvasTexture(this.reticleCanvas)
    this.reticleTexture.minFilter = THREE.LinearFilter
    this.reticleTexture.magFilter = THREE.LinearFilter

    const reticleGeo = new THREE.PlaneGeometry(0.045, 0.045)
    const reticleMat = new THREE.MeshBasicMaterial({
      map: this.reticleTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    this.reticleMesh = new THREE.Mesh(reticleGeo, reticleMat)
    this.reticleMesh.position.set(0, 0, -0.9)
    this.reticleMesh.renderOrder = 9999
    this.camera.add(this.reticleMesh)

    this.drawReticle(0, false)

    // Bind instant pointer / touch tap interaction
    this.onPointerDown = this.handlePointerDown.bind(this)
    if (this.renderer?.domElement) {
      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
    }

    // WebXR controller select event
    this.onXRSelect = this.handleXRSelect.bind(this)
    if (this.renderer?.xr) {
      const controller0 = this.renderer.xr.getController(0)
      const controller1 = this.renderer.xr.getController(1)
      controller0.addEventListener('select', this.onXRSelect)
      controller1.addEventListener('select', this.onXRSelect)
      this.controllers = [controller0, controller1]
    }
  }

  drawReticle(progress = 0, isHovering = false) {
    const ctx = this.reticleCtx
    if (!ctx) return
    ctx.clearRect(0, 0, 128, 128)

    const cx = 64
    const cy = 64
    const radius = 24

    // Subtle center dot
    ctx.beginPath()
    ctx.arc(cx, cy, isHovering ? 3.5 : 2.5, 0, Math.PI * 2)
    ctx.fillStyle = isHovering ? '#22c55e' : 'rgba(255, 255, 255, 0.75)'
    ctx.fill()

    // Outer faint track
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = isHovering ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.25)'
    ctx.stroke()

    // Progress arc
    if (progress > 0) {
      ctx.beginPath()
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + progress * Math.PI * 2
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.lineWidth = 4
      ctx.strokeStyle = '#22c55e'
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    this.reticleTexture.needsUpdate = true
  }

  /**
   * Registers a 3D object for gaze and click interactions.
   * @param {Object} item - { mesh, onActivate, label }
   */
  register(item) {
    if (!item?.mesh || typeof item.onActivate !== 'function') return
    this.registry.push({
      mesh: item.mesh,
      onActivate: item.onActivate,
      label: item.label || item.mesh.name || 'Interactive Element',
      originalEmissive: null,
      originalIntensity: null,
    })
  }

  /**
   * Unregisters a 3D object.
   * @param {THREE.Object3D} mesh
   */
  unregister(mesh) {
    const idx = this.registry.findIndex((r) => r.mesh === mesh)
    if (idx !== -1) {
      if (this.hoveredItem === this.registry[idx]) {
        this.clearHover()
      }
      this.registry.splice(idx, 1)
    }
  }

  applyHoverHighlight(item) {
    const mesh = item.mesh
    if (mesh.material && 'emissive' in mesh.material) {
      if (item.originalEmissive === null) {
        item.originalEmissive = mesh.material.emissive.getHex()
        item.originalIntensity = mesh.material.emissiveIntensity ?? 0
      }
      mesh.material.emissive.setHex(0x22c55e)
      mesh.material.emissiveIntensity = 0.45
    }
  }

  restoreHoverHighlight(item) {
    if (!item) return
    const mesh = item.mesh
    if (mesh.material && 'emissive' in mesh.material && item.originalEmissive !== null) {
      mesh.material.emissive.setHex(item.originalEmissive)
      mesh.material.emissiveIntensity = item.originalIntensity ?? 0
      item.originalEmissive = null
      item.originalIntensity = null
    }
  }

  clearHover() {
    if (this.hoveredItem) {
      this.restoreHoverHighlight(this.hoveredItem)
      this.hoveredItem = null
      this.dwellTimer = 0
      this.drawReticle(0, false)
    }
  }

  /**
   * Called on every frame inside the render loop.
   * @param {number} dt - Time delta in seconds
   */
  update(dt = 0.016) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt)
    }

    if (this.registry.length === 0) {
      this.clearHover()
      return
    }

    // Cast ray from center of camera view (NDC 0, 0)
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera)
    const candidateMeshes = this.registry.map((r) => r.mesh)
    const intersects = this.raycaster.intersectObjects(candidateMeshes, true)

    if (intersects.length > 0) {
      // Find top-level registered item matching hit mesh or its parent
      const hitObj = intersects[0].object
      const item = this.registry.find(
        (r) => r.mesh === hitObj || r.mesh.children.includes(hitObj)
      )

      if (item) {
        if (this.hoveredItem !== item) {
          this.clearHover()
          this.hoveredItem = item
          this.dwellTimer = 0
          this.applyHoverHighlight(item)
        }

        if (this.cooldownTimer === 0) {
          this.dwellTimer += dt
          const progress = Math.min(1.0, this.dwellTimer / this.DWELL_TIME)
          this.drawReticle(progress, true)

          if (this.dwellTimer >= this.DWELL_TIME) {
            // Activate via gaze dwell!
            this.triggerActivate(item)
          }
        } else {
          this.drawReticle(0, true)
        }
        return
      }
    }

    // No target hit
    this.clearHover()
  }

  triggerActivate(item) {
    this.dwellTimer = 0
    this.cooldownTimer = this.COOLDOWN_TIME
    this.drawReticle(0, true)
    try {
      item.onActivate()
    } catch (err) {
      console.error('Error in interactive element onActivate:', err)
    }
  }

  handlePointerDown(event) {
    if (!this.renderer?.domElement || this.registry.length === 0) return

    const rect = this.renderer.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.pointerRaycaster.setFromCamera({ x, y }, this.camera)
    const candidateMeshes = this.registry.map((r) => r.mesh)
    const intersects = this.pointerRaycaster.intersectObjects(candidateMeshes, true)

    if (intersects.length > 0) {
      const hitObj = intersects[0].object
      const item = this.registry.find(
        (r) => r.mesh === hitObj || r.mesh.children.includes(hitObj)
      )
      if (item) {
        this.triggerActivate(item)
      }
    }
  }

  handleXRSelect() {
    // Instant activate current gaze target on VR controller trigger
    if (this.hoveredItem) {
      this.triggerActivate(this.hoveredItem)
    }
  }

  getCurrentTarget() {
    if (!this.hoveredItem) return null
    return {
      label: this.hoveredItem.label,
      dwellProgress: Math.min(1.0, this.dwellTimer / this.DWELL_TIME),
      inCooldown: this.cooldownTimer > 0,
    }
  }

  dispose() {
    this.clearHover()
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    }
    if (this.camera && this.reticleMesh) {
      this.camera.remove(this.reticleMesh)
      this.reticleMesh.geometry.dispose()
      this.reticleMesh.material.dispose()
      this.reticleTexture.dispose()
    }
    if (this.controllers) {
      this.controllers.forEach((c) => {
        c.removeEventListener('select', this.onXRSelect)
      })
    }
    this.registry = []
  }
}
