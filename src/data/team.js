/**
 * Org-chart data for TeamTree.jsx. Names are intentionally "Ad Soyad"
 * placeholders (not the real CEO/Sales/Engineer names from
 * docs/argroup-knowledge-base.md) — the real KB only has 3 named
 * executives, which don't map cleanly onto this 4-department structure, so
 * inventing which real person leads which department here would be
 * fabricating an org relationship that isn't verified. Fill in real names
 * once the actual department structure is confirmed.
 *
 * `company` is optional — set it (e.g. "AR Group Construction Services")
 * only when a person belongs to a different company/division than the rest
 * of the tree. `photo` is an optional path; leave null for the default
 * silhouette avatar.
 */
export const teamData = {
  id: 1,
  name: 'Ad Soyad',
  position: 'Direktor',
  company: null,
  photo: null,
  children: [
    {
      id: 2,
      name: 'Ad Soyad',
      position: 'Fire Protection Şöbəsinin Müdiri',
      company: null,
      photo: null,
      children: [
        { id: 6, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
        { id: 7, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
      ],
    },
    {
      id: 3,
      name: 'Ad Soyad',
      position: 'Construction Şöbəsinin Müdiri',
      company: null,
      photo: null,
      children: [
        { id: 8, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
        { id: 9, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
      ],
    },
    {
      id: 4,
      name: 'Ad Soyad',
      position: 'Design Engineering Şöbəsinin Müdiri',
      company: null,
      photo: null,
      children: [
        { id: 10, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
        { id: 11, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
      ],
    },
    {
      id: 5,
      name: 'Ad Soyad',
      position: 'Testing/QA Şöbəsinin Müdiri',
      company: null,
      photo: null,
      children: [
        { id: 12, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
        { id: 13, name: 'Ad Soyad', position: 'Mühəndis', company: null, photo: null, children: [] },
      ],
    },
  ],
}
