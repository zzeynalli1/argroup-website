/**
 * AR Group organizational hierarchy for TeamTree.jsx.
 *
 * `name` is a real, verified name from docs/argroup-knowledge-base.md
 * ("Leadership" section) — set to `null` where no individual is named in
 * the KB for that function, so the card shows the role only, never an
 * invented person. `positionKey` looks up the translated role/position
 * label at locales/<locale>/about.json under `leadership.items.<id>.title`.
 *
 * No fabricated names, headcounts, or department structure beyond the
 * confirmed leaders and AR Group's real service lines (engineering,
 * on-site technical work, installation/operations).
 */
export const teamData = {
  id: 'management',
  name: 'Ramin Mustafayev',
  positionKey: 'ceo',
  photo: null,
  children: [
    {
      id: 'engineering',
      name: null,
      positionKey: 'engineer',
      photo: null,
      children: [],
    },
    {
      id: 'purchasingSales',
      name: 'Cavid Allahverdiyev',
      positionKey: 'purchasingSales',
      photo: null,
      children: [],
    },
    {
      id: 'siteTeam',
      name: null,
      positionKey: 'siteTeam',
      photo: null,
      children: [],
    },
    {
      id: 'installation',
      name: null,
      positionKey: 'installation',
      photo: null,
      children: [],
    },
  ],
}
