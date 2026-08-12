import { useMemo } from 'react'
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
  return useMemo(() => {
    const isEmphasized = activeGroup === groupKey || hoveredGroup === groupKey
    const isDimmed = Boolean(activeGroup) && activeGroup !== groupKey

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.color, base.roughness, base.metalness, base.emissive, groupKey, activeGroup, hoveredGroup])
}
