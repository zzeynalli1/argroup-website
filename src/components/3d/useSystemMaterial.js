import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// How long an opacity/emissive change (hotspot select/hover/deselect) takes
// to visually settle, in ms — see the `useFrame` lerp below.
const TRANSITION_MS = 200

/**
 * Material for a mesh belonging to one of the discipline groups in
 * components/3d/groups/. Each group gets its own small material instance
 * (not shared) because dimming the unselected groups must not affect the
 * selected one — see buildingMaterials.js for why the generic shell doesn't
 * need this.
 *
 * Created ONCE per mesh (empty-deps `useMemo`, keyed only on the base
 * params, which are constant for a given call site) and never recreated
 * afterward. `transparent` is permanently `true` (even at full opacity 1),
 * so this material's compiled shader VARIANT/program key never changes —
 * only `opacity`/`emissive`/`emissiveIntensity` are mutated in place on
 * hover/select, which are plain uniform updates, not a program relink. The
 * previous version recreated a brand new `THREE.MeshStandardMaterial`
 * (toggling `transparent` itself) on every hover/select change, forcing a
 * synchronous shader variant compile + a full re-render of every mesh
 * sharing this hook on every single hotspot hover — the cause of the
 * multi-second (sometimes total) freeze on hotspot click, especially on
 * mobile GPUs.
 *
 * @param {{color: string, roughness?: number, metalness?: number, emissive?: string}} base
 * @param {string} groupKey - the group id this mesh belongs to (see groups/index.js)
 * @param {string|null} activeGroup - currently selected group id, or null
 * @param {string|null} hoveredGroup - currently hovered group id, or null
 */
export function useSystemMaterial(base, groupKey, activeGroup, hoveredGroup) {
  const { invalidate } = useThree()

  const isEmphasized = activeGroup === groupKey || hoveredGroup === groupKey
  const isDimmed = Boolean(activeGroup) && activeGroup !== groupKey

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: base.color,
      roughness: base.roughness ?? 0.5,
      metalness: base.metalness ?? 0.5,
      emissive: '#000000',
      emissiveIntensity: 0,
      // Always transparent (even at opacity 1) so toggling dim/highlight
      // never changes which shader variant this material compiles to — see
      // the file-level comment above.
      transparent: true,
      opacity: 1,
      depthWrite: true,
    })
  }, [base.color, base.roughness, base.metalness])

  // This material is handed to a mesh via a plain `material={material}` prop
  // (not a JSX `<meshStandardMaterial>` child), so R3F never takes ownership
  // of it for auto-dispose — only the mesh's OWN fiber unmount would trigger
  // that, which doesn't happen here since these meshes are static/always
  // mounted. Disposed only on this hook's own real unmount now (the material
  // itself is never replaced during the component's lifetime anymore).
  useEffect(() => () => material.dispose(), [material])

  const targetOpacity = isDimmed ? 0.3 : 1
  const targetEmissiveIntensity = isEmphasized ? 0.35 : 0
  const emissiveColor = base.emissive ?? '#000000'

  const fromOpacityRef = useRef(material.opacity)
  const fromEmissiveRef = useRef(material.emissiveIntensity)
  const transitionStartRef = useRef(null)

  // Kicks off a short lerp toward the new target whenever the resolved
  // emphasis/dim state actually changes (hover/select/deselect) — not a
  // per-frame effect, this only re-runs on those rare, user-driven
  // transitions. `material` is a THREE.js imperative object (same escape-
  // hatch convention as Hero3DScene.jsx's `scene.background`/`gl.shadowMap`
  // mutations) — intentionally mutated in place rather than replaced, which
  // is the entire point of this hook (see the file-level comment above).
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    material.emissive.set(emissiveColor)
    material.depthWrite = true
    fromOpacityRef.current = material.opacity
    fromEmissiveRef.current = material.emissiveIntensity
    transitionStartRef.current = performance.now()
    invalidate()
  }, [targetOpacity, targetEmissiveIntensity, emissiveColor, material, invalidate])

  // Mutates the already-created material's uniforms in place — no
  // `needsUpdate`, no new material, no program relink. Only requests
  // further frames (`invalidate`, needed under this scene's
  // `frameloop="demand"`) while a transition is actually in flight.
  useFrame(() => {
    if (transitionStartRef.current == null) return
    const elapsed = performance.now() - transitionStartRef.current
    const t = Math.min(elapsed / TRANSITION_MS, 1)
    material.opacity = THREE.MathUtils.lerp(fromOpacityRef.current, targetOpacity, t)
    material.emissiveIntensity = THREE.MathUtils.lerp(fromEmissiveRef.current, targetEmissiveIntensity, t)
    if (t >= 1) {
      transitionStartRef.current = null
    } else {
      invalidate()
    }
  })
  /* eslint-enable react-hooks/immutability */

  return material
}
