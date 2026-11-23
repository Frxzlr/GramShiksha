import { useEffect, useRef, useState } from 'react'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { initLabScene } from '../lab/scene.js'

export default function Lab3D() {
  const mountRef = useRef(null)
  const vrContainerRef = useRef(null)

  const [debugOpen, setDebugOpen] = useState(false)
  const [debugData, setDebugData] = useState({
    fps: 60,
    target: 'None',
    dwellProgress: 0,
  })

  const [states, setStates] = useState({
    gravity: 'idle',
    ramp: 'ready',
    rampAngle: 15,
    quiz: { questionIndex: 0, score: 0, total: 5 },
    airResistance: false,
    gravityTimes: { heavy: 0, light: 0 },
  })

  // Keyboard shortcut: 'D' key toggles debug telemetry
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'd' || e.key === 'D') {
        setDebugOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Mount Three.js Lab Scene
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let lab = null
    let unsubscribe = null
    let vrButtonElement = null

    try {
      lab = initLabScene(container, {
        onDebugUpdate: (data) => {
          setDebugData({
            fps: data.fps,
            target: data.target,
            dwellProgress: data.dwellProgress,
          })
        },
      })

      // Subscribe to state machine changes
      unsubscribe = lab.stateManager.onChange((nextState) => {
        setStates(nextState)
      })

      // Check WebXR support & attach VRButton
      const setupVR = async () => {
        if (typeof navigator !== 'undefined' && 'xr' in navigator) {
          try {
            const isSupported = navigator.xr.isSessionSupported
              ? await navigator.xr.isSessionSupported('immersive-vr')
              : navigator.xr.isSupported
              ? await navigator.xr.isSupported('immersive-vr')
              : false

            if (isSupported && lab?.renderer) {
              vrButtonElement = VRButton.createButton(lab.renderer)
              if (vrButtonElement && vrContainerRef.current) {
                vrButtonElement.style.position = 'static'
                vrButtonElement.style.height = '28px'
                vrButtonElement.style.lineHeight = '26px'
                vrButtonElement.style.padding = '0 12px'
                vrButtonElement.style.fontSize = '11px'
                vrButtonElement.style.fontFamily = 'monospace'
                vrButtonElement.style.fontWeight = '600'
                vrButtonElement.style.borderRadius = '4px'
                vrButtonElement.style.border = '1px solid rgba(34, 197, 94, 0.4)'
                vrButtonElement.style.backgroundColor = 'rgba(34, 197, 94, 0.12)'
                vrButtonElement.style.color = '#22c55e'
                vrButtonElement.style.cursor = 'pointer'
                vrButtonElement.style.opacity = '1'
                vrContainerRef.current.appendChild(vrButtonElement)
              }
            }
          } catch {
            // Immersive VR not available on this device/display
          }
        }
      }

      setupVR()
    } catch (err) {
      console.error('Failed to initialize 3D Lab Scene:', err)
    }

    return () => {
      if (unsubscribe) unsubscribe()
      if (vrButtonElement && vrButtonElement.parentNode) {
        vrButtonElement.parentNode.removeChild(vrButtonElement)
      }
      if (lab) {
        lab.dispose()
      }
    }
  }, [])

  return (
    <div className="w-full space-y-4 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white dark:text-white text-zinc-900">
            3D Science Lab
          </h2>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
            Interactive virtual laboratory for Class 6–8 physics inquiry, WebXR immersion, and hands-on experiments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm" dot>
            WebXR Active
          </Badge>
          <Button
            variant={debugOpen ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setDebugOpen(!debugOpen)}
            title="Toggle telemetry debug overlay (Shortcut: D)"
            className="text-xs"
          >
            Debug (D)
          </Button>
        </div>
      </div>

      {/* 3D Viewport with In-Canvas HUD */}
      <div className="relative w-full rounded-[8px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#0a0a0c] overflow-hidden select-none">
        {/* Mount container for Three.js Canvas */}
        <div
          ref={mountRef}
          className="w-full h-[520px] sm:h-[600px] cursor-grab active:cursor-grabbing outline-none"
        />

        {/* Top In-Canvas HUD overlay */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Station Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
            <div className="px-2.5 py-1 rounded-[4px] bg-[#111214]/90 backdrop-blur-xs border border-white/[0.08] text-[11px] font-mono flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500 uppercase">Gravity:</span>
              <span
                className={
                  states.gravity === 'falling'
                    ? 'text-[#22c55e] font-semibold'
                    : states.gravity === 'landed'
                    ? 'text-amber-400'
                    : 'text-zinc-200'
                }
              >
                {states.gravity}
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-[4px] bg-[#111214]/90 backdrop-blur-xs border border-white/[0.08] text-[11px] font-mono flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500 uppercase">Ramp:</span>
              <span
                className={
                  states.ramp === 'sliding'
                    ? 'text-[#22c55e] font-semibold'
                    : 'text-zinc-200'
                }
              >
                {states.ramp} ({states.rampAngle}°)
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-[4px] bg-[#111214]/90 backdrop-blur-xs border border-white/[0.08] text-[11px] font-mono flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500 uppercase">Quiz:</span>
              <span className="text-zinc-200">
                Q{Math.min(5, (states.quiz?.questionIndex ?? 0) + 1)}/5 ({states.quiz?.score ?? 0} pts)
              </span>
            </div>
          </div>

          {/* Right: Gaze / Tap Instruction Hint and VR Button */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#111214]/90 backdrop-blur-xs border border-white/[0.08] text-[11px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span>Look at a button for 2 s or tap it</span>
            </div>

            {/* Container for WebXR Button when supported */}
            <div ref={vrContainerRef} />
          </div>
        </div>

        {/* Debug Overlay Panel (Toggled via button or D key) */}
        {debugOpen && (
          <div className="absolute bottom-3 left-3 max-w-xs sm:max-w-sm p-3 rounded-[6px] bg-[#111214]/95 border border-white/[0.12] text-[11px] font-mono space-y-1.5 pointer-events-auto text-zinc-300 shadow-xl backdrop-blur-xs">
            <div className="flex items-center justify-between text-zinc-400 border-b border-white/[0.06] pb-1">
              <span className="font-semibold text-white">TELEMETRY & RAYCAST</span>
              <span className="text-[#22c55e] font-semibold">{debugData.fps} FPS</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Gaze Target:</span>
              <span className="text-white font-medium truncate max-w-[170px]">
                {debugData.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Dwell Progress:</span>
              <span className="text-[#22c55e]">{debugData.dwellProgress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Air Drag:</span>
              <span>{states.airResistance ? 'ACTIVE' : 'OFF (Vacuum)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Fall Times:</span>
              <span>
                H: {states.gravityTimes?.heavy?.toFixed(3) || '0.000'}s | L:{' '}
                {states.gravityTimes?.light?.toFixed(3) || '0.000'}s
              </span>
            </div>
          </div>
        )}

        {/* Mobile quick reminder */}
        <div className="sm:hidden absolute bottom-3 right-3 px-2 py-1 rounded-[4px] bg-[#111214]/90 border border-white/[0.08] text-[10px] text-zinc-400 font-mono">
          Tap or Gaze 2s
        </div>
      </div>
    </div>
  )
}
