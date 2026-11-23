import * as THREE from 'three'

/**
 * Creates an updatable 3D text label using a high-resolution CanvasTexture mapped onto a PlaneGeometry.
 *
 * @param {string} initialText - Initial label text (supports '\n' for multi-line)
 * @param {Object} [options]
 * @param {number} [options.width=1.0] - Physical width in 3D world units (meters)
 * @param {number} [options.height=0.4] - Physical height in 3D world units (meters)
 * @param {number} [options.fontSize=44] - Canvas font size in pixels
 * @param {string} [options.fontFamily='Inter, -apple-system, sans-serif'] - Font family
 * @param {string} [options.color='#f4f4f5'] - Text color
 * @param {string} [options.bgColor='rgba(15, 18, 24, 0.94)'] - Background color or 'transparent'
 * @param {string} [options.borderColor='rgba(255, 255, 255, 0.18)'] - Border color
 * @param {number} [options.borderWidth=3] - Border width in canvas pixels
 * @param {number} [options.borderRadius=16] - Border radius in canvas pixels
 * @param {string} [options.textAlign='center'] - 'center' | 'left' | 'right'
 * @param {number} [options.padding=24] - Padding in canvas pixels
 * @param {number} [options.resolution=1024] - Base canvas resolution for high DPI crispness
 * @returns {THREE.Mesh} A Plane mesh with .update(text, opts) and .dispose() methods
 */
export function makeLabel(initialText = '', options = {}) {
  let opts = {
    width: 1.0,
    height: 0.4,
    fontSize: 48,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    bgColor: 'rgba(15, 18, 24, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderRadius: 20,
    textAlign: 'center',
    padding: 28,
    resolution: 1024,
    ...options,
  }

  // Determine canvas pixel dimensions based on aspect ratio
  const aspect = Math.max(0.1, opts.width / opts.height)
  const canvasWidth = opts.resolution
  const canvasHeight = Math.max(96, Math.round(canvasWidth / aspect))

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')

  function draw(text, currentOpts) {
    if (!ctx) return
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw background with rounded corners
    if (currentOpts.bgColor && currentOpts.bgColor !== 'transparent') {
      ctx.fillStyle = currentOpts.bgColor
      const r = currentOpts.borderRadius
      const x = currentOpts.borderWidth
      const y = currentOpts.borderWidth
      const w = canvasWidth - currentOpts.borderWidth * 2
      const h = canvasHeight - currentOpts.borderWidth * 2

      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.fill()

      if (currentOpts.borderColor && currentOpts.borderWidth > 0) {
        ctx.lineWidth = currentOpts.borderWidth
        ctx.strokeStyle = currentOpts.borderColor
        ctx.stroke()
      }
    }

    // Render multiline text with bold crisp weight
    const lines = String(text).split('\n')
    ctx.fillStyle = currentOpts.color
    ctx.font = `700 ${currentOpts.fontSize}px ${currentOpts.fontFamily}`
    ctx.textBaseline = 'middle'

    const lineHeight = currentOpts.fontSize * 1.35
    const totalTextHeight = lines.length * lineHeight
    const startY = (canvasHeight - totalTextHeight) / 2 + lineHeight / 2

    lines.forEach((line, idx) => {
      const y = startY + idx * lineHeight
      let x = canvasWidth / 2
      if (currentOpts.textAlign === 'left') {
        x = currentOpts.padding * 2
        ctx.textAlign = 'left'
      } else if (currentOpts.textAlign === 'right') {
        x = canvasWidth - currentOpts.padding * 2
        ctx.textAlign = 'right'
      } else {
        ctx.textAlign = 'center'
      }
      ctx.fillText(line, x, y)
    })
  }

  draw(initialText, opts)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.colorSpace = THREE.SRGBColorSpace

  const geometry = new THREE.PlaneGeometry(opts.width, opts.height)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = `Label_${initialText.replace(/[\n\s]+/g, '_').slice(0, 15)}`

  // Updatable API
  mesh.update = (newText, newOpts = {}) => {
    opts = { ...opts, ...newOpts }
    draw(newText, opts)
    texture.needsUpdate = true
  }

  // Cleanup helper
  mesh.dispose = () => {
    geometry.dispose()
    material.dispose()
    texture.dispose()
  }

  return mesh
}
