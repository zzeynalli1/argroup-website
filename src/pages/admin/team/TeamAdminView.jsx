import { useState } from 'react'
import TeamMembersAdminView from './TeamMembersAdminView'
import TeamCategoriesAdminView from './TeamCategoriesAdminView'

// Tabs instead of a 3rd sidebar nesting level — AdminShell's NAV_GROUPS is a
// flat single-activeKey switch today (see its own header comment); adding
// real nested sidebar navigation just for this one section would be a much
// bigger change to a shared component than the approved spec asks for.
const TABS = [
  { key: 'members', label: 'Komanda üzvləri' },
  { key: 'categories', label: 'Kateqoriyalar' },
]

export default function TeamAdminView() {
  const [tab, setTab] = useState('members')

  return (
    <div>
      <div>
        <h1 className="font-heading text-2xl font-bold text-industrial-950">Komandamız</h1>
        <p className="mt-1 text-sm text-neutral-custom-600">
          Haqqımızda səhifəsindəki komanda iyerarxiyası və təşkilati kateqoriyaların idarə edilməsi.
        </p>
      </div>

      <div className="mt-5 flex gap-1 border-b border-industrial-950/10">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === item.key
                ? 'border-ember-600 text-industrial-950'
                : 'border-transparent text-neutral-custom-600 hover:text-industrial-950'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'members' ? (
          <TeamMembersAdminView onGoToCategories={() => setTab('categories')} />
        ) : (
          <TeamCategoriesAdminView />
        )}
      </div>
    </div>
  )
}
