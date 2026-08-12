import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, OrbitControls } from '@react-three/drei'
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Minus, Plus } from 'lucide-react'
import * as THREE from 'three'
import { useTranslation } from '../../lib/i18n/useTranslation'
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  NARROW_CAMERA_POSITION,
  NARROW_CAMERA_TARGET,
  hotspots,
} from '../../data/hotspots3d'
import { COLORS, groundMaterial } from './buildingMaterials'
import Building from './Building'

// Camera moves this much closer/farther per zoom-button click (see `zoomBy`).
const ZOOM_STEP = 0.85

// Coarse, dependency-free "is this a phone/tablet, or a small/touch
// viewport" check — used only to drop the most expensive post-processing
// settings (SSAO quality, Bloom, multisampling, shadow-map size) a notch,
// per the brief's "adaptive settings for mobile" requirement. Deliberately
// not using GPU-benchmark detection (e.g. drei's `useDetectGPU`, which
// fetches a benchmark table from a CDN) — that adds a network dependency
// and latency to a marketing homepage for a call this simple heuristic
// already answers well enough. Computed once; screen size/pointer type
// don't change during a session in any way that matters here.
function detectMobile() {
  if (typeof window === 'undefined') return false
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const smallViewport = window.innerWidth < 768
  return coarsePointer || smallViewport
}

// Same one-time-at-mount pattern as `detectMobile` above, but answering a
// different question: is this viewport's own aspect ratio portrait/
// near-square? This governs which of the two default camera framings from
// data/hotspots3d.js applies (see the comment there) — a landscape-vs-mobile
// device check wouldn't be the right signal here, since e.g. a tablet in
// portrait and a resized narrow desktop browser window need the same
// (safer, less zoomed) framing a phone does, while a tablet in landscape
// doesn't.
function detectPortraitAspect() {
  if (typeof window === 'undefined') return false
  return window.innerWidth / window.innerHeight < 1.15
}

// Vertical gradient, dark blue-grey — a plain <color> would read as flat
// black; this sits between industrial-950 and a lighter blue-grey stop.
const BACKDROP_TOP = '#20242B'
const BACKDROP_BOTTOM = '#141414'
const FOG_COLOR = '#23262C'

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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={groundMaterial} dispose={null}>
      <planeGeometry args={[24, 24]} />
    </mesh>
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
  const [isMobile] = useState(detectMobile)
  const [isPortrait] = useState(detectPortraitAspect)
  // See data/hotspots3d.js for why there are two presets and how each was
  // derived/verified — this is the only place that picks between them.
  const defaultCameraPosition = isPortrait ? NARROW_CAMERA_POSITION : DEFAULT_CAMERA_POSITION
  const defaultCameraTarget = isPortrait ? NARROW_CAMERA_TARGET : DEFAULT_CAMERA_TARGET
  const desiredPosRef = useRef(new THREE.Vector3(...defaultCameraPosition))
  const desiredTargetRef = useRef(new THREE.Vector3(...defaultCameraTarget))
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
    desiredPosRef.current.set(...hotspot.cameraPosition)
    desiredTargetRef.current.set(...hotspot.position)
    transitioningRef.current = true
    onHotspotChange?.(hotspot)
  }

  function resetCamera() {
    setActiveKey(null)
    desiredPosRef.current.set(...defaultCameraPosition)
    desiredTargetRef.current.set(...defaultCameraTarget)
    transitioningRef.current = true
    onHotspotChange?.(null)
  }

  function selectHotspotByKey(key) {
    const hotspot = hotspots.find((h) => h.key === key)
    if (hotspot) selectHotspot(hotspot)
  }

  useImperativeHandle(ref, () => ({ resetCamera, selectHotspot: selectHotspotByKey }))

  // Groups (components/3d/groups) are what actually highlight/dim — resolved
  // here from the hotspot's own `group` field rather than passed straight
  // through as the raw hotspot key, so a future hotspot whose `group`
  // differs from its `key` still highlights the right thing without any
  // change to Building.jsx or the group components.
  const activeGroup = hotspots.find((h) => h.key === activeKey)?.group ?? null
  const hoveredGroup = hotspots.find((h) => h.key === hoveredKey)?.group ?? null

  return (
    <>
      <Canvas
        shadows
        camera={{ position: defaultCameraPosition, fov: 45 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        // `antialias` off deliberately: once `<EffectComposer>` is mounted,
        // the 3D scene is rendered into the composer's own render target,
        // never the canvas's default (potentially MSAA) framebuffer — the
        // composer's own `multisampling` prop below is what actually
        // controls edge antialiasing now, so paying for a second, unused
        // native AA context would be pure waste.
        gl={{ antialias: false, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <GradientBackdrop />
        <fog attach="fog" args={[FOG_COLOR, 16, 30]} />

        {/* Restrained key/fill/rim rig. Ambient kept deliberately low — the
            `Environment` IBL below and the post-processing SSAO now do the
            job flat ambient used to do, so a high ambient here would just
            wash the contrast back out. */}
        <ambientLight intensity={0.14} />
        <directionalLight
          position={[6, 7, 5.5]}
          intensity={1.9}
          color={COLORS.base50}
          castShadow
          shadow-mapSize-width={isMobile ? 1024 : 2048}
          shadow-mapSize-height={isMobile ? 1024 : 2048}
          // Frustum derived from projecting the building's bounding box
          // (x:-3..3, y:0..4.1 incl. rooftop rail, z:-2..2) onto this light's
          // own local left/up axes — the projected extent is left/right
          // ±3.46, top 5.35, bottom -2.83; the values below add a safety
          // margin on top of that rather than guessing a round symmetric
          // number, so nothing at the model's real edges (e.g. the rooftop
          // rail's far corner) clips. near/far left at their original safe
          // values since they only affect depth precision, not the map's
          // effective resolution.
          shadow-camera-left={-3.9}
          shadow-camera-right={3.9}
          shadow-camera-top={5.6}
          shadow-camera-bottom={-3.2}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          // Prevents shadow acne now that resolution is effectively higher
          // (tighter frustum + bigger map) — a small fixed depth bias offsets
          // the comparison just enough to avoid self-shadowing artifacts on
          // the concrete's own chamfered faces.
          shadow-bias={-0.0015}
        />
        {/* Warm rim/accent from the back-left, opposite the key — separates
            the building's silhouette from the dark backdrop and gives the
            concrete a warm/cool split instead of one flat white light. */}
        <directionalLight position={[-6, 3.2, -5]} intensity={0.45} color={COLORS.amber500} />
        {/* Cool fill from the opposite side — keeps the shadow side of the
            cutaway readable instead of crushed to black now that ambient is
            low. */}
        <directionalLight position={[-4, 2, 6]} intensity={0.24} color="#8FA3B8" />
        {/* Scoped to its own Suspense so the CDN-fetched HDRI reflections never
            block the building/hotspots from rendering — without this boundary
            the whole R3F tree suspends (see useEnvironment -> useLoader) and
            nothing commits, which is why only the Html markers were visible.
            "city" reads as a moody, window-lit night skyline (fits the dark
            industrial backdrop) and gives metal/glass reflections actual
            shape/variation instead of "warehouse"'s flat, uniform bright
            dome. `environmentIntensity` keeps that IBL contribution
            restrained so reflections read as real without blowing out. */}
        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.7} />
        </Suspense>

        <Ground />
        <Building activeGroup={activeGroup} hoveredGroup={hoveredGroup} />
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.6}
          scale={14}
          blur={2.2}
          far={4.2}
          resolution={isMobile ? 128 : 256}
        />

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
          target={defaultCameraTarget}
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

        {/* Post-processing pipeline. Order matters — each effect processes
            the previous one's output:
              1. N8AO   — screen-space ambient occlusion. Seats every small
                          connection (bolts, brackets, base plates, slab/
                          column junctions) into real contact shadow that the
                          directional shadow map's resolution can't resolve,
                          without needing per-mesh geometry changes.
              2. Bloom  — luminance-gated, tight threshold: only true bright
                          highlights (sun-hit specular on metal, the emissive
                          hotspot markers) bloom, never a general glow — the
                          brief's explicit "no bloom/glow overuse".
              3. ToneMapping (AGX) — replaces the old renderer-level
                          ACESFilmic + fixed exposure (mounting this composer
                          forces `renderer.toneMapping` to `NoToneMapping`
                          for as long as it's mounted, so tone mapping has to
                          live here now). AGX (Blender's own default view
                          transform since 4.0) rolls off bright highlights
                          much more gracefully than ACES/Reinhard, which is
                          the direct fix for "washed out" — mid-tone contrast
                          stays intact instead of everything clipping to white.
              4. BrightnessContrast / HueSaturation — a very small, restrained
                          grade (not a stylized LUT): a touch more contrast
                          and a touch less saturation so it reads as a real
                          render, not a color-corrected screenshot.
              5. Vignette — subtle edge falloff only, to hold focus on the
                          building rather than the frame edges.
            `multisampling` is this composer's own antialiasing (see the
            `gl={{antialias:false}}` note above) — reduced, not removed, on
            mobile; N8AO's quality/resolution and Bloom (skipped entirely on
            mobile) are the two genuinely expensive settings, so those are
            what actually adapt for phones/tablets. */}
        <EffectComposer multisampling={isMobile ? 0 : 4}>
          <N8AO
            aoRadius={0.45}
            distanceFalloff={1}
            intensity={isMobile ? 2.2 : 3.2}
            quality={isMobile ? 'performance' : 'medium'}
            halfRes={isMobile}
            screenSpaceRadius
          />
          {isMobile ? (
            <></>
          ) : (
            <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.25} intensity={0.4} mipmapBlur />
          )}
          <ToneMapping mode={ToneMappingMode.AGX} />
          <BrightnessContrast brightness={-0.02} contrast={0.06} />
          <HueSaturation hue={0} saturation={-0.05} />
          <Vignette offset={0.32} darkness={0.45} />
        </EffectComposer>
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
