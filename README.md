# AR Group Construction Services — Sayt (Developer Handoff)

Vite + React + Tailwind CSS v4 + react-three-fiber əsasında qurulmuş, Supabase
ilə idarə olunan CMS-ə malik korporativ sayt. AR Group Construction
Services-in (https://www.argroup.az) real şirkət saytının yenidən qurulmuş
versiyasıdır.

Sayt istifadəyə hazırdır və Vercel-də deploy olunub. Bu sənəd developer üçün
texniki bələdçidir. Admin/CMS istifadəçisi üçün bax `docs/CMS-GUIDE.md`.

## Texnologiya yığını (tech stack)

- **React 19** + **Vite** — UI və build alətləri
- **Tailwind CSS v4** — stil sistemi (`tailwind.config.js`-dəki tokenlər)
- **react-three-fiber** / **drei** / **@react-three/postprocessing** /
  **three** — Ana səhifədəki interaktiv 3D bina səhnəsi
- **framer-motion**, **gsap**, **lenis** — animasiya və smooth-scroll
- **react-router-dom** — client-side routing (SPA)
- **Supabase** (`@supabase/supabase-js`) — CMS backend: Postgres verilənlər
  bazası, Auth (admin girişi), Storage (şəkillər)
- **lucide-react** — ikonlar
- **Vercel** — hostinq/deployment

Dəqiq versiyalar üçün `package.json`-a baxın.

## Yerli inkişaf (local development)

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # production build (dist/)
npm run lint     # ESLint
```

`npm run dev`-i işə salmazdan əvvəl `.env` faylını yaradın (aşağıdakı
"Environment variables" bölməsinə baxın) — Supabase konfiqurasiyası
olmadan CMS-bağlı bölmələr boş görünəcək (sayt sınmır, sadəcə CMS
məzmunu yüklənmir).

## Qovluq strukturu (əsas hissələr)

```
src/
  components/
    layout/       # Header, Footer
    sections/     # Home/About/Services/Products/Projects/Contact bölmələri
    ui/           # Paylaşılan UI komponentləri (Button, Section, modallar)
    3d/           # Ana səhifənin 3D bina səhnəsi (react-three-fiber)
    admin/        # Admin-only paylaşılan komponentlər (ConfirmDialog, ProtectedRoute)
  pages/          # Route-lara bağlı səhifələr (Home, About, Products, ...)
  pages/admin/    # /admin altındakı bütün CMS admin səhifələri (8 modul)
  hooks/          # useProjects, useBrands, ... — hər CMS varlığı üçün fetch hook-u
  lib/
    cms/          # Hər CMS varlığı üçün Supabase CRUD funksiyaları
    auth/         # Supabase Auth konteksti (admin sessiyası)
    i18n/         # Tərcümə sistemi (useTranslation)
    supabase.js   # Tək Supabase client instance-ı
  data/           # Frontend-owned statik data (categoryMaterials.js, servicesDetail.js, ...)
  locales/        # az/en/ru/tr — hər namespace üçün ayrı JSON
supabase/
  migrations/     # SQL migration tarixçəsi (bax aşağıda)
  seed/           # Tək dəfəlik məzmun köçürmə skriptləri (tarixi, təkrar işlədilməməlidir)
docs/
  CMS-GUIDE.md          # Admin istifadəçi üçün bələdçi
  DOMAIN-CUTOVER.md     # argroup.az domen keçidi üçün DNS planı
  HANDOFF-CHECKLIST.md  # Mülkiyyət təhvili checklist-i
  argroup-knowledge-base.md  # Real şirkət məlumatlarının mənbəyi
```

## Environment variables

Frontend (brauzerdə görünən, **publik** olması təhlükəsiz olan) dəyişənlər:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Bunlar Supabase-in "publishable" açar cütüdür — hər cədvəl/bucket Row Level
Security (RLS) ilə qorunduğu üçün brauzer kodunda olması təhlükəsizdir.
Real dəyərləri `.env` faylına yazın (`.env.example`-ə baxın) — **`.env`
heç vaxt commit edilməməlidir** (artıq `.gitignore`-dadır).

`supabase/seed/*.mjs` skriptləri (tarixi, tək dəfəlik məzmun köçürmələri)
lokal olaraq bu iki dəyişəni də oxuya bilər:

```
ADMIN_EMAIL
ADMIN_PASSWORD
```

Bunlar **yalnız** bu Node.js skriptləri üçündür (RLS-in admin yazma
icazəsini test etmək məqsədilə) — **heç vaxt** brauzer kodunda istifadə
olunmur, **heç vaxt** hostinq mühitinə (Vercel) əlavə edilməməlidir və
**heç vaxt** commit edilməməlidir.

`service_role` açarı və ya verilənlər bazası şifrəsi bu layihənin heç bir
yerində saxlanılmamalıdır — nə frontend-də, nə də sənədləşdirmədə.

## Supabase arxitekturası

### Cədvəllər (7 CMS varlığı + Contact)

| Cədvəl | Təsvir |
|---|---|
| `projects` | Layihələr |
| `brands` | Brendlər |
| `partners` | Tərəfdaşlar |
| `customers` | Müştərilər |
| `awards` | Mükafatlar |
| `team_members` | Komanda (parent_id ilə iyerarxiya) |
| `products` | Məhsullar (kateqoriya frontend-owned, sabit 9 dəyər) |
| `contact_messages` | Əlaqə formu müraciətləri |

### Storage

Tək public bucket: **`media`** — qovluq konvensiyası: `media/projects/`,
`media/brands/`, `media/partners/`, `media/customers/`, `media/awards/`,
`media/team/`, `media/products/`. Maksimum fayl ölçüsü **5 MB**, icazə
verilən formatlar: `image/webp`, `image/jpeg`, `image/png`.

### Auth

- Admin girişi Supabase Auth (e-poçt/şifrə) ilə həyata keçirilir.
- **Public qeydiyyat (sign-up) formu saytda yoxdur və olmamalıdır.**
- **Anonim giriş (anonymous sign-in) deaktiv olmalıdır** — Supabase
  Dashboard → Authentication → Settings-də yoxlanılmalıdır.
- Yeni admin istifadəçisi yalnız Supabase Dashboard → Authentication →
  Users → Add user vasitəsilə əlavə olunur — saytda ictimai qeydiyyat
  yolu qəsdən yoxdur.

### Row Level Security (RLS) — yüksək səviyyəli izah

- 7 CMS cədvəli: anonim/public istifadəçi yalnız `published = true`
  sətirləri oxuya bilər; heç bir yazma (insert/update/delete) icazəsi
  yoxdur. Authenticated admin sessiyası bütün sətirləri oxuya və idarə
  edə bilər.
- `contact_messages`: anonim istifadəçi yalnız **yeni mesaj əlavə edə**
  bilər (`INSERT`) — öz və ya başqasının mesajını **oxuya, dəyişə və ya
  silə bilməz**. Yalnız authenticated admin mesajları oxuya, statusunu
  dəyişə və silə bilər.

**RLS siyasətləri zəiflədilməməli və ya dəyişdirilməməlidir** —
dəyişiklik lazımdırsa, yeni bir migration faylı yazılmalıdır (bax aşağı).

## Migrationlar

```
supabase/migrations/0001_init_schema.sql    — 7 CMS cədvəli + RLS
supabase/migrations/0002_storage.sql        — `media` bucket + Storage policy-ləri
supabase/migrations/0003_contact_messages.sql — Əlaqə formu cədvəli + RLS
```

Bu fayllar **tarixi migration qeydləridir** — production-a tətbiq
olunduqdan sonra **təsadüfən redaktə edilməməlidir**. Sxemdə dəyişiklik
lazımdırsa, yeni bir `0004_...sql` faylı yaradılmalıdır.

`supabase/seed/*.mjs` skriptləri **tək dəfəlik** məzmun köçürmə
alətləridir (real `src/data/*.js` fayllarından Supabase-ə köçürmək
üçün istifadə olunub, o fayllar artıq mövcud deyil). **Bu skriptləri
yenidən işə salmayın** — bəzi köhnə skriptlər artıq mövcud olmayan
lokal fayllara istinad edir və işə düşməyəcək; bu, real problem deyil,
sadəcə tarixi alətlərin öz məqsədini artıq yerinə yetirmiş olmasıdır.

## Deployment

| | |
|---|---|
| Provayder | **Vercel** |
| Layihə | `firestop-site` (Vercel hesabı: `zzeynalli1`) |
| Production URL | https://firestop-site.vercel.app |
| Repository | `github.com/zzeynalli1/argroup-website` |
| Production branch | `main` |

`main` branch-ə push edildikdə Vercel avtomatik yeni deployment yaradır
(GitHub inteqrasiyası artıq qoşulub).

`vercel.json` faylı SPA routing üçündür: bu, tam client-side React Router
tətbiqidir (server route-ları yoxdur), ona görə `/about`, `/projects` və
s. birbaşa açılanda/refresh ediləndə Vercel-in bu faylı `/index.html`-ə
yönləndirməsi lazımdır — əks halda həmin route-lar 404 verər.

Custom domen (`argroup.az`) keçidi üçün bax `docs/DOMAIN-CUTOVER.md`.

Mövcud işləyən deployment konfiqurasiyası (env variables, `vercel.json`,
build ayarları) real bir problem aşkar olunmadıqca dəyişdirilməməlidir.

## Ehtiyat nüsxə / bərpa qeydləri (backup & recovery)

- **GitHub** — mənbə kodun tam tarixçəsi. Bu, layihənin əsas "kod ehtiyat
  nüsxəsi"dir.
- **Supabase** — bütün CMS məzmunu, verilənlər bazası və yüklənmiş
  şəkillər (Storage) burada saxlanılır. **Repository CMS
  məzmununun/verilənlər bazasının ehtiyat nüsxəsi DEYİL** — yalnız
  sxemin necə qurulduğunu (migrationlar) əks etdirir, real məlumatları
  yox.
- Supabase-in özünün avtomatik backup siyasəti/tarixçəsi bu sənəddə
  **təsdiqlənməyib** — bu, Supabase layihəsinin planına (free/pro/vs.)
  bağlıdır və Supabase Dashboard-dan yoxlanılmalıdır.
- DNS dəyişikliyi lazım olarsa geri qaytarma (rollback) dəyərləri
  `docs/DOMAIN-CUTOVER.md`-də sənədləşdirilib.
- Vercel köhnə deployment-ləri saxlayır — problem yaranarsa əvvəlki
  uğurlu deployment-ə "promote" etmək mümkündür (Vercel Dashboard və ya
  `vercel rollback`).

## Təhlükəsizlik qeydləri

### 1. Asılılıqlar (dependencies)
- `npm audit` mütəmadi işlədilməlidir. Yalnız təhlükəsiz, minor/patch
  səviyyəli düzəlişlər `npm audit fix` ilə tətbiq edilməlidir — major
  versiya sıçrayışları (`--force`) diqqətli təhlil olmadan edilməməlidir.
- `package-lock.json` mütləq commit edilməlidir (artıq edilib).

### 2. Əlaqə forması
- `ContactForm.jsx` real Supabase backend-ə qoşulub (`contact_messages`
  cədvəli, bax yuxarı). Client-side validasiya yalnız UX üçündür —
  əsas qorunma DB-dəki CHECK constraint-lər və RLS-dir.
- v1-də CAPTCHA/honeypot/rate-limiting yoxdur (qəsdən sadə saxlanılıb) —
  bu, anonim `INSERT` icazəsinin yaratdığı bilinən bir spam səthidir.

### 3. Environment variables (.env)
- Bax yuxarıdakı "Environment variables" bölməsi.

### 4. Git təhlükəsizliyi
- `.gitignore`-da `node_modules`, `.env*`, `dist`, `.vercel`,
  `supabase/.temp/` artıq mövcuddur.
- Səhvən gizli məlumat commit edilərsə, faylı silmək kifayət etmir —
  commit tarixçəsindən də təmizlənməlidir.

### 5. HTTP təhlükəsizlik başlıqları
Vercel-in panelində əlavə HTTP header-lər (CSP, X-Frame-Options,
X-Content-Type-Options) konfiqurasiya edilə bilər — hazırda tətbiq
edilməyib, gələcək təkmilləşdirmə kimi qeyd olunur.

### 6. Xarici linklər
Bütün `target="_blank"` linklərdə `rel="noopener noreferrer"`
istifadə olunur.

## Content Guidelines

Saytdakı bütün başlıq və mətnlər üçün keçərli qayda:

- **Yalnız təsdiq cümlələri.** Reklam-üslubu sual formaları qadağandır —
  mətnlər həmişə iddia/təsdiq şəklində yazılır.
- **Minimal və birbaşa.** Uzun izahat əvəzinə qısa, konkret cümlələr.
- Yalnız real AR Group məzmunundan istifadə edilir — uydurma məzmun,
  statistika və ya tarixçə yazılmır (bax `docs/argroup-knowledge-base.md`
  və `CLAUDE.md`).

## Digər sənədlər

- `docs/CMS-GUIDE.md` — admin/CMS istifadəçisi üçün bələdçi
- `docs/DOMAIN-CUTOVER.md` — `argroup.az` domen keçidi planı
- `docs/HANDOFF-CHECKLIST.md` — mülkiyyət təhvili checklist-i
- `docs/argroup-knowledge-base.md` — real şirkət məlumatlarının mənbəyi
- `CLAUDE.md` — layihə qaydaları (məzmun, dizayn, iş axını)
