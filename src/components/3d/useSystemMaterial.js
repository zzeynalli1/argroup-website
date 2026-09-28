import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

/**
 * Material for a mesh belonging to one of the discipline groups in
 * components/3d/groups/. Each group gets its own small material instance
 * (not shared) because dimming the unselected groups must not affect the
 * selected one — see buildingMaterials.js for why the generic shell doesn't
 * need this. Recomputed only when `activeGroup`/`hoveredGroup` change, i.e.
 * on hotspot select/hover, not per frame.
 *
 * @param {{color: string, roughness?: number, metalness?: number, emissive?: string}} base
 * @param {string} groupKey - the group id this mesh belongs to (see groups/index.js)
 * @param {string|null} activeGroup - currently selected group id, or null
 * @param {string|null} hoveredGroup - currently hovered group id, or null
 */
export function useSystemMaterial(base, groupKey, activeGroup, hoveredGroup) {
  // Derived first (outside the memo) so the memo itself only depends on the
  // two booleans that actually determine this material's appearance, not on
  // the raw `activeGroup`/`hoveredGroup` values. Every group/hotspot shares
  // those two pieces of state (lifted in Hero3DScene.jsx), so without this,
  // hovering/selecting ANY one hotspot changed the `hoveredGroup`/
  // `activeGroup` dependency for EVERY OTHER group's material too — even
  // ones whose own isEmphasized/isDimmed result didn't change — recreating
  // a brand new THREE.MeshStandardMaterial (and its GPU-side program/
  // uniforms) for every system-material mesh in the scene on every single
  // hover transition, not just the one mesh whose look actually changed.
  // Memoizing on the booleans instead means only the (at most) 1-2 groups
  // whose emphasis/dim state actually flips recompute; every unrelated
  // group's material instance is untouched, identical before/after.
  const isEmphasized = activeGroup === groupKey || hoveredGroup === groupKey
  const isDimmed = Boolean(activeGroup) && activeGroup !== groupKey

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: base.color,
      roughness: base.roughness ?? 0.5,
      metalness: base.metalness ?? 0.5,
      emissive: isEmphasized ? (base.emissive ?? '#000000') : '#000000',
      emissiveIntensity: isEmphasized ? 0.35 : 0,
      transparent: isDimmed,
      opacity: isDimmed ? 0.3 : 1,
      depthWrite: true,
    })
  }, [base.color, base.roughness, base.metalness, base.emissive, isEmphasized, isDimmed])

  // This material is handed to a mesh via a plain `material={material}` prop
  // (not a JSX `<meshStandardMaterial>` child), so R3F never takes ownership
  // of it for auto-dispose — only the mesh's OWN fiber unmount would trigger
  // that, which doesn't happen here since these meshes are static/always
  // mounted. Without this, every material instance replaced above (now rare,
  // post-fix, but not zero — it still happens for the 1-2 groups whose own
  // emphasis actually changes) leaked: the old THREE.Material and its
  // compiled GPU program/uniforms stayed resident with nothing left
  // referencing it. Cleanup runs right before the *next* material is created
  // (or on this mesh's real unmount), by which point the mesh has already
  // moved on to the new instance, so disposing the old one here is safe.
  useEffect(() => () => material.dispose(), [material])

  return material
}
