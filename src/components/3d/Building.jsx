import { SYSTEM_GROUPS } from './groups'

/**
 * Thin composer over the group registry (`groups/index.js`) — no mesh
 * geometry lives here. Each registered group owns its own meshes and
 * decides its own highlight/dim behavior; adding a new group later means
 * adding one file + one registry entry, not touching this file or any
 * existing group.
 *
 * `activeGroup`/`hoveredGroup` are already-resolved group ids (Hero3DScene
 * looks up the selected/hovered hotspot's `group` field before passing
 * these down) — not the raw hotspot key. For all 10 current hotspots
 * `group === key`, but keeping this resolved rather than passing the raw
 * hotspot key straight through means a future hotspot whose `group` differs
 * from its own `key` (e.g. two hotspots sharing one group) still highlights
 * correctly without touching this file.
 */
export default function Building({ activeGroup = null, hoveredGroup = null }) {
  return (
    <group>
      {SYSTEM_GROUPS.map(({ id, Component, defaultVisible }) => (
        <Component key={id} activeGroup={activeGroup} hoveredGroup={hoveredGroup} visible={defaultVisible} />
      ))}
    </group>
  )
}
