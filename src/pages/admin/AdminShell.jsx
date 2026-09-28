import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../lib/auth/useAuth'
import ProjectsAdminView from './projects/ProjectsAdminView'
import BrandsAdminView from './brands/BrandsAdminView'
import PartnersAdminView from './partners/PartnersAdminView'
import CustomersAdminView from './customers/CustomersAdminView'
import AwardsAdminView from './awards/AwardsAdminView'
import TeamAdminView from './team/TeamAdminView'
import ProductsAdminView from './products/ProductsAdminView'
import MessagesAdminView from './messages/MessagesAdminView'

// Mirrors the seven CMS content areas defined in
// supabase/migrations/0001_init_schema.sql. All seven now have real CRUD:
// Projects (Phase 3), Brands/Partners/Customers (Phase 4), Awards/Team
// (Phase 5), Products (Phase 6). "Mesajlar" (Phase 8.1) is the eighth,
// standalone area for public ContactForm.jsx submissions
// (0003_contact_messages.sql) — read/manage only, no create/edit form.
const NAV_GROUPS = [
  {
    label: null,
    items: [{ key: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Ana səhifə',
    items: [
      { key: 'projects', label: 'Layihələr' },
      { key: 'brands', label: 'Brendlər' },
      { key: 'partners', label: 'Tərəfdaşlar' },
      { key: 'customers', label: 'Müştərilər' },
    ],
  },
  {
    label: 'Haqqımızda',
    items: [
      { key: 'awards', label: 'Mükafatlar' },
      { key: 'team', label: 'Komandamız' },
    ],
  },
  {
    label: 'Məhsullar',
    items: [{ key: 'products', label: 'Məhsullar' }],
  },
  {
    label: 'Əlaqə',
    items: [{ key: 'messages', label: 'Mesajlar' }],
  },
]

const CONTENT_AREAS = NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.key !== 'dashboard')

export default function AdminShell() {
  const { user, signOut } = useAuth()
  const [activeKey, setActiveKey] = useState('dashboard')

  const activeLabel = CONTENT_AREAS.find((item) => item.key === activeKey)?.label

  return (
    <div className="flex min-h-screen w-full bg-base-100">
      <aside className="flex w-64 shrink-0 flex-col bg-industrial-950 text-base-50">
        <div className="border-b border-base-50/10 px-6 py-6">
          <p className="font-heading text-lg font-bold leading-none">
            <span className="text-ember-600">AR</span>Group
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-neutral-custom-400">CMS</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {NAV_GROUPS.map((group, idx) => (
            <div key={group.label ?? `group-${idx}`} className={idx > 0 ? 'mt-6' : ''}>
              {group.label && (
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-custom-400">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeKey === item.key
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => setActiveKey(item.key)}
                        className={`block w-full rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-industrial-800 text-ember-600'
                            : 'text-base-50/80 hover:bg-industrial-900 hover:text-base-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-base-50/10 px-4 py-4">
          <p className="truncate px-2 text-xs text-neutral-custom-400" title={user?.email}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-base-50/80 transition-colors hover:bg-industrial-900 hover:text-ember-600"
          >
            <LogOut size={15} />
            Çıxış
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-10 py-10">
          {activeKey === 'dashboard' ? (
            <DashboardView onSelect={setActiveKey} />
          ) : activeKey === 'projects' ? (
            <ProjectsAdminView />
          ) : activeKey === 'brands' ? (
            <BrandsAdminView />
          ) : activeKey === 'partners' ? (
            <PartnersAdminView />
          ) : activeKey === 'customers' ? (
            <CustomersAdminView />
          ) : activeKey === 'awards' ? (
            <AwardsAdminView />
          ) : activeKey === 'team' ? (
            <TeamAdminView />
          ) : activeKey === 'products' ? (
            <ProductsAdminView />
          ) : activeKey === 'messages' ? (
            <MessagesAdminView />
          ) : (
            <PlaceholderView label={activeLabel} />
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardView({ onSelect }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-industrial-950">AR Group CMS</h1>
      <p className="mt-2 text-sm text-neutral-custom-600">Sayt məzmununun idarə edilməsi.</p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENT_AREAS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className="rounded-sm border border-industrial-950/10 bg-base-50 px-5 py-4 text-left transition-colors hover:border-ember-600"
          >
            <span className="text-sm font-semibold text-industrial-950">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PlaceholderView({ label }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-industrial-950">{label}</h1>
      <span aria-hidden="true" className="mt-3 block h-px w-10 bg-ember-600" />
      <div className="mt-8 rounded-sm border border-industrial-950/10 bg-base-50 px-6 py-16 text-center">
        <p className="text-sm text-neutral-custom-600">Bu bölmə növbəti mərhələdə aktivləşdiriləcək.</p>
      </div>
    </div>
  )
}
