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

/**
 * The full post-processing pipeline, split into its own lazy chunk (see
 * Hero3DScene.jsx's `lazy(() => import('./PostProcessingEffects'))`) so
 * `lowPower` scenes — which never render this component — never download
 * `@react-three/postprocessing`/`postprocessing` at all, instead of just
 * skipping the JSX at runtime after the library is already in the bundle.
 * Order matters — each effect processes the previous one's output:
 *   1. N8AO   — screen-space ambient occlusion. Seats every small
 *               connection (bolts, brackets, base plates, slab/column
 *               junctions) into real contact shadow that the directional
 *               shadow map's resolution can't resolve, without needing
 *               per-mesh geometry changes.
 *   2. Bloom  — luminance-gated, tight threshold: only true bright
 *               highlights (sun-hit specular on metal, the emissive hotspot
 *               markers) bloom, never a general glow.
 *   3. ToneMapping (AGX) — replaces the old renderer-level ACESFilmic +
 *               fixed exposure (mounting this composer forces
 *               `renderer.toneMapping` to `NoToneMapping` for as long as
 *               it's mounted, so tone mapping has to live here now). AGX
 *               (Blender's own default view transform since 4.0) rolls off
 *               bright highlights much more gracefully than ACES/Reinhard —
 *               mid-tone contrast stays intact instead of everything
 *               clipping to white.
 *   4. BrightnessContrast / HueSaturation — a very small, restrained grade
 *               (not a stylized LUT): a touch more contrast and a touch
 *               less saturation so it reads as a real render, not a
 *               color-corrected screenshot.
 *   5. Vignette — subtle edge falloff only, to hold focus on the building
 *               rather than the frame edges.
 * `multisampling` is this composer's own antialiasing (Hero3DScene's Canvas
 * sets `gl={{antialias:false}}` since the renderer never draws straight to
 * the canvas's own framebuffer once this is mounted) — 2 on desktop, 0 on
 * mobile. N8AO/Bloom stay gated on `heavyFxReady` (passed down from
 * Hero3DScene) — see that state's own comment there for why: they're the
 * two passes expensive enough to turn "compile behind the poster" into a
 * multi-second-plus main-thread stall, so they're staged a couple of
 * frames after the rest of this pipeline (which already gives the AGX
 * grade) is on screen.
 */
export default function PostProcessingEffects({ isMobile, heavyFxReady }) {
  return (
    <EffectComposer multisampling={isMobile ? 0 : 2}>
      {!isMobile && heavyFxReady ? (
        <N8AO
          aoRadius={0.45}
          distanceFalloff={1}
          intensity={3.2}
          quality="medium"
          // Half-resolution AO buffer — screen-space AO is inherently a
          // soft, low-frequency effect; rendering its own buffer at half
          // the pixel count (so a quarter the shading cost) is not visually
          // distinguishable from full-res at this effect's own blur radius.
          halfRes
          screenSpaceRadius
        />
      ) : (
        <></>
      )}
      {!isMobile && heavyFxReady ? (
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
