// Years of experience is the only stat with a verified source: the AR Group
// CS presentation states the company has done Firestop passive fire
// protection installation in Azerbaijan since 2018. Completed-project count,
// certification count, and employee count are NOT included here — none of
// them has a confirmed current number (docs/argroup-knowledge-base.md flags
// the "61 completed projects" figure as unverified against the live site,
// and no certification/headcount figures exist anywhere in the KB or
// presentation). Do not add them back without a confirmed source.
const FOUNDED_YEAR = 2018

export const stats = [{ value: new Date().getFullYear() - FOUNDED_YEAR, label: 'stats.experience' }]
