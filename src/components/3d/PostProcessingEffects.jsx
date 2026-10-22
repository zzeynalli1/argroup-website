import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * The full post-processing pipeline, split into its own lazy chunk (see
 * Hero3DScene.jsx's `lazy(() => import('./PostProcessingEffects'))`) so
 * `lowPower` scenes — which never render this component — never download
 * `@react-three/postprocessing`/`postprocessing` at all, instead of just
 * skipping the JSX at runtime after the library is already in the bundle.
 * N8AO (screen-space AO) was removed entirely — ~20+ extra shader programs
 * plus several full-screen passes every frame, cheap enough under real GPU
 * `compileAsync` but a multi-second main-thread stall on weaker/software
 * WebGL, and it used to mount in a SECOND pass after `onReady` had already
 * fired (a visible second freeze + color pop). Everything below now mounts
 * together, in the SAME first compile Hero3DScene's `onReady` waits for —
 * no deferred second mount. Order matters — each effect processes the
 * previous one's output:
 *   1. Bloom  — luminance-gated, tight threshold: only true bright
 *               highlights (sun-hit specular on metal, the emissive hotspot
 *               markers) bloom, never a general glow. Skipped on `isMobile`.
 *   2. ToneMapping (AGX) — replaces the old renderer-level ACESFilmic +
 *               fixed exposure (mounting this composer forces
 *               `renderer.toneMapping` to `NoToneMapping` for as long as
 *               it's mounted, so tone mapping has to live here now). AGX
 *               (Blender's own default view transform since 4.0) rolls off
 *               bright highlights much more gracefully than ACES/Reinhard —
 *               mid-tone contrast stays intact instead of everything
 *               clipping to white.
 *   3. BrightnessContrast / HueSaturation — a very small, restrained grade
 *               (not a stylized LUT): a touch more contrast and a touch
 *               less saturation so it reads as a real render, not a
 *               color-corrected screenshot.
 *   4. Vignette — subtle edge falloff only, to hold focus on the building
 *               rather than the frame edges.
 * `multisampling` is this composer's own antialiasing (Hero3DScene's Canvas
 * sets `gl={{antialias:false}}` since the renderer never draws straight to
 * the canvas's own framebuffer once this is mounted) — 2 on desktop, 0 on
 * mobile.
 */
export default function PostProcessingEffects({ isMobile }) {
  return (
    <EffectComposer multisampling={isMobile ? 0 : 2}>
      {!isMobile ? (
        <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.25} intensity={0.4} mipmapBlur />
      ) : (
        <></>
      )}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <BrightnessContrast brightness={0.015} contrast={0.06} />
      <HueSaturation hue={0} saturation={-0.05} />
      <Vignette offset={0.32} darkness={0.45} />
    </EffectComposer>
  )
}
