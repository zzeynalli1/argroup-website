import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, OrbitControls } from '@react-three/drei'
import { Minus, Plus } from 'lucide-react'
import * as THREE from 'three'
import { useTranslation } from '../../lib/i18n/useTranslation'
import { DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_TARGET, hotspots } from '../../data/hotspots3d'

// Camera moves this much closer/farther per zoom-button click (see `zoomBy`).
const ZOOM_STEP = 0.85

// Hex values mirror tailwind.config.js tokens — three.js materials need raw
// color values, Tailwind classes don't apply inside the Canvas. `concrete`
// and `metal` are tonal variants of industrial-800/neutral-custom-400 (not
// new brand colors) picked to actually read as concrete/steel under PBR
// lighting instead of the flat dark grey the raw tokens gave.
const COLORS = {
  base50: '#FFFFFF',
  ember600: '#E31E24',
  amber500: '#E8A33D',
  neutral600: '#6B7075',
  concrete: '#8A8D91',
  metal: '#8B98A3',
}

// Vertical gradient, dark blue-grey — a plain <color> would read as flat
// black; this sits between industrial-950 and a lighter blue-grey stop.
const BACKDROP_TOP = '#20242B'
const BACKDROP_BOTTOM = '#141414'
const FOG_COLOR = '#23262C'

const HALF_W = 3
const HALF_D = 2
const FLOOR_Y = [0, 1.2, 2.4, 3.6]

function GradientBackdrop() {
  const { scene } = useThree()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, BACKDROP_TOP)
    gradient.addColorStop(1, BACKDROP_BOTTOM)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useEffect(() => {
    // three.js scene is an imperative escape hatch (the standard R3F pattern
    // for background/fog), not React state — safe to mutate directly.
    /* eslint-disable react-hooks/immutability */
    scene.background = texture
    return () => {
      scene.background = null
    }
    /* eslint-enable react-hooks/immutability */
  }, [scene, texture])

  return null
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[24, 24]} />
      <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.02} />
    </mesh>
  )
}

function Building() {
  return (
    <group>
      {FLOOR_Y.map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[HALF_W * 2, 0.15, HALF_D * 2]} />
          <meshStandardMaterial color={COLORS.concrete} roughness={0.85} metalness={0.05} />
        </mesh>
      ))}

      {/* Back wall */}
      <mesh position={[0, 1.8, -HALF_D]} castShadow receiveShadow>
        <boxGeometry args={[HALF_W * 2, 3.6, 0.15]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-HALF_W, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 3.6, HALF_D * 2]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Right wall, shortened near the front to leave room for the curtain-wall panel */}
      <mesh position={[HALF_W, 1.8, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 3.6, HALF_D * 2 - 1.4]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Curtain-wall glazing panel */}
      <mesh position={[HALF_W, 1.8, 1.65]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.4, 3.4]} />
        <meshStandardMaterial
          color={COLORS.base50}
          transparent
          opacity={0.22}
          roughness={0.1}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Structural joint seam, back-left corner */}
      <mesh position={[-HALF_W, 1.8, -HALF_D]} castShadow>
        <boxGeometry args={[0.06, 3.6, 0.06]} />
        <meshStandardMaterial color={COLORS.neutral600} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Cable tray — parallel cylinder bundle */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-2, 0.95 + i * 0.1, -1.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
          <meshStandardMaterial color={COLORS.neutral600} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Metal pipe riser */}
      <mesh position={[0, 1.2, -1]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.8, 16]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* PVC pipe riser */}
      <mesh position={[1.6, 1.2, -1]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 1.8, 16]} />
        <meshStandardMaterial color={COLORS.amber500} metalness={0.05} roughness={0.6} />
      </mesh>

      {/* HVAC duct */}
      <mesh position={[-1.2, 2.4, -1]} castShadow>
        <boxGeometry args={[1.4, 0.45, 0.45]} />
        <meshStandardMaterial color={COLORS.neutral600} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Hotspot({ hotspot, isActive, isHovered, onHover, onSelect }) {
  const { t } = useTranslation('home')
  const emphasized = isActive || isHovered

  return (
    <group position={hotspot.position}>
      {/* Larger invisible sphere carries the pointer handlers — the visible
          marker below is only 0.09 world units, too small a raycast target
          to hit/tap reliably on its own. `visible=false` would skip it during
          raycasting too, so it stays "visible" with a fully transparent,
          non-depth-writing material instead. */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(hotspot.key)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(hotspot)
        }}
      >
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh scale={emphasized ? 1.5 : 1}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={emphasized ? '#FF4D52' : COLORS.ember600}
          emissive={COLORS.ember600}
          emissiveIntensity={emphasized ? 0.9 : 0.5}
        />
      </mesh>
      <Html distanceFactor={8} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
        <div className="relative flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-ember-600 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ember-600" />
          {isHovered && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-white/10 bg-industrial-950/90 px-2 py-1 text-xs text-base-50">
              {t(`building3d.hotspots.${hotspot.key}.name`)}
            </span>
          )}
        </div>
      </Html>
    </group>
  )
}

function CameraRig({ orbitRef, desiredPosRef, desiredTargetRef, transitioningRef }) {
  useEffect(() => {
    const controls = orbitRef.current
    if (!controls) return undefined

    // OrbitControls unconditionally sets touch-action:none on its domElement
    // when it connects, which blocks native page scroll on touch devices
    // entirely (independent of enableZoom/enablePan). Override it so a
    // one-finger vertical swipe still scrolls the page.
    controls.domElement.style.touchAction = 'pan-y'

    const stopTransition = () => {
      transitioningRef.current = false
    }
    controls.addEventListener('start', stopTransition)
    return () => controls.removeEventListener('start', stopTransition)
  }, [orbitRef, transitioningRef])

  useFrame((state, delta) => {
    if (!transitioningRef.current) return

    const t = 1 - Math.exp(-delta * 6)
    state.camera.position.lerp(desiredPosRef.current, t)

    const controls = orbitRef.current
    if (controls) {
      controls.target.lerp(desiredTargetRef.current, t)
      controls.update()
    }

    if (state.camera.position.distanceTo(desiredPosRef.current) < 0.01) {
      transitioningRef.current = false
    }
  })

  return null
}

const Hero3DScene = forwardRef(function Hero3DScene({ onHotspotChange }, ref) {
  const { t } = useTranslation('home')
  const orbitRef = useRef(null)
  const desiredPosRef = useRef(new THREE.Vector3(...DEFAULT_CAMERA_POSITION))
  const desiredTargetRef = useRef(new THREE.Vector3(...DEFAULT_CAMERA_TARGET))
  const transitioningRef = useRef(false)
  const [activeKey, setActiveKey] = useState(null)
  const [hoveredKey, setHoveredKey] = useState(null)

  // Zoom now lives here instead of on the mouse wheel (see OrbitControls'
  // enableZoom={false} below) — this moves the camera along the existing
  // target->camera direction, clamped to the same min/maxDistance the wheel
  // used to respect.
  function zoomBy(factor) {
    const controls = orbitRef.current
    if (!controls) return

    const camera = controls.object
    const offset = camera.position.clone().sub(controls.target)
    const nextDistance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)
    offset.setLength(nextDistance)
    camera.position.copy(controls.target).add(offset)
    controls.update()
  }

  function selectHotspot(hotspot) {
    setActiveKey(hotspot.key)
    desiredPosRef.current.set(...hotspot.cameraTarget)
    desiredTargetRef.current.set(...hotspot.position)
    transitioningRef.current = true
    onHotspotChange?.(hotspot)
  }

  function resetCamera() {
    setActiveKey(null)
    desiredPosRef.current.set(...DEFAULT_CAMERA_POSITION)
    desiredTargetRef.current.set(...DEFAULT_CAMERA_TARGET)
    transitioningRef.current = true
    onHotspotChange?.(null)
  }

  function selectHotspotByKey(key) {
    const hotspot = hotspots.find((h) => h.key === key)
    if (hotspot) selectHotspot(hotspot)
  }

  useImperativeHandle(ref, () => ({ resetCamera, selectHotspot: selectHotspotByKey }))

  return (
    <>
      <Canvas shadows camera={{ position: DEFAULT_CAMERA_POSITION, fov: 45 }} dpr={[1, 1.5]}>
        <GradientBackdrop />
        <fog attach="fog" args={[FOG_COLOR, 8, 25]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[6, 10, 5]}
          intensity={1.2}
          color={COLORS.base50}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
        />
        <directionalLight position={[-6, 3, -5]} intensity={0.3} color={COLORS.amber500} />
        {/* Scoped to its own Suspense so the CDN-fetched HDRI reflections never
            block the building/hotspots from rendering — without this boundary
            the whole R3F tree suspends (see useEnvironment -> useLoader) and
            nothing commits, which is why only the Html markers were visible. */}
        <Suspense fallback={null}>
          <Environment preset="warehouse" />
        </Suspense>

        <Ground />
        <Building />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.55} scale={14} blur={2.4} far={4} />

        {hotspots.map((hotspot) => (
          <Hotspot
            key={hotspot.id}
            hotspot={hotspot}
            isActive={activeKey === hotspot.key}
            isHovered={hoveredKey === hotspot.key}
            onHover={setHoveredKey}
            onSelect={selectHotspot}
          />
        ))}

        <OrbitControls
          ref={orbitRef}
          target={DEFAULT_CAMERA_TARGET}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={13}
          maxPolarAngle={Math.PI / 2.05}
          touches={{ ONE: undefined, TWO: undefined }}
        />
        <CameraRig
          orbitRef={orbitRef}
          desiredPosRef={desiredPosRef}
          desiredTargetRef={desiredTargetRef}
          transitioningRef={transitioningRef}
        />
      </Canvas>

      <div className="pointer-events-none absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => zoomBy(ZOOM_STEP)}
          aria-label={t('building3d.zoomIn')}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 backdrop-blur-sm transition-colors hover:border-ember-600 hover:text-ember-600"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          aria-label={t('building3d.zoomOut')}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-industrial-950/80 text-base-50 backdrop-blur-sm transition-colors hover:border-ember-600 hover:text-ember-600"
        >
          <Minus size={16} />
        </button>
      </div>
    </>
  )
})

export default Hero3DScene
