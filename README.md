# Firestop — Korporativ Sayt

Vite + React + Tailwind CSS v4 + react-three-fiber əsasında qurulan premium
korporativ sayt. Bu mərhələdə layihə **skeleton/boilerplate** vəziyyətindədir:
səhifə strukturu, routing və qovluq təşkilatı hazırdır, lakin real 3D səhnə,
son dizayn və animasiyalar hələ əlavə edilməyib.

## Layihəni işə salmaq

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # production build
npm run lint      # ESLint
```

## Qovluq strukturu

```
src/
  components/
    layout/     # Header, Footer
    sections/   # Hero3D, Projects, TeamTree, Services, ContactForm (placeholder-lar)
    ui/         # Button, Section — paylaşılan UI komponentləri
  pages/        # Home, About, ServicesPage, Contact — route-lara bağlı səhifələr
  hooks/        # xüsusi React hook-ları (hələ boş)
  lib/          # lenis.js — smooth-scroll setup
```

## Təhlükəsizlik qeydləri (proqramçı olmayan sahibkar üçün)

Bu bölmə saytı hostinq edərkən nələrə diqqət etməli olduğunuzu izah edir.

### 1. Asılılıqlar (dependencies)
- `npm audit` mütəmadi işlədilməlidir ki, istifadə olunan kitabxanalarda
  bilinən təhlükəsizlik boşluqları olub-olmadığı yoxlanılsın.
- `package-lock.json` faylı **mütləq** repo-ya commit edilməlidir (artıq
  edilib) — bu, hər kəsdə eyni, təsdiqlənmiş versiyaların quraşdırılmasını
  təmin edir və gözlənilməz major versiya sıçrayışlarının qarşısını alır.

### 2. Əlaqə forması
- Hazırkı forma (`ContactForm.jsx`) yalnız **client-side validasiya** edir
  (boş sahə, e-poçt formatı, mətn uzunluğu limiti) və heç bir backend-ə
  məlumat göndərmir — bu, sırf UI test məqsədi daşıyır.
- Backend qurulanda əlavə ediləcəklər: server-side validasiya, SQL
  injection-a qarşı parametrli sorğular, spam/bot qorunması (məs.
  CAPTCHA və ya honeypot sahə) və rate limiting. Bunlar client-side
  kodda təmin edilə **bilməz**, çünki brauzerdəki kod istifadəçi
  tərəfindən asanlıqla dəyişdirilə/bypass edilə bilər.

### 3. Environment variables (.env)
- Bütün API açarları və gizli konfiqurasiyalar `.env` faylında
  saxlanılmalıdır. `.env` `.gitignore`-dadır və **heç vaxt** GitHub-a
  push edilməməlidir.
- `.env.example` faylı yalnız açar adlarını göstərir, real dəyərlər
  olmadan — yeni mühit qurarkən nümunə kimi istifadə olunur.

### 4. Git təhlükəsizliyi
- `.gitignore` faylında `node_modules`, `.env`, `dist`, `build`
  qovluqları artıq mövcuddur.
- Əgər səhvən gizli məlumat commit edilibsə, sadəcə faylı silmək kifayət
  etmir — commit tarixçəsindən də təmizlənməlidir (bu, ayrıca diqqət
  tələb edən bir addımdır).

### 5. HTTP təhlükəsizlik başlıqları (hostinq mərhələsində)
Sayt Vercel, Netlify və ya bənzər bir provayderdə host ediləndə,
provayderin panelində aşağıdakı HTTP başlıqları konfiqurasiya
edilməlidir (kod səviyyəsində deyil, hostinq səviyyəsində):
- `Content-Security-Policy` — hansı mənbələrdən skript/şəkil/font
  yüklənə biləcəyini məhdudlaşdırır.
- `X-Frame-Options` — saytın başqa saytların içində iframe kimi
  göstərilməsinin (clickjacking) qarşısını alır.
- `X-Content-Type-Options: nosniff` — brauzerin fayl tipini "təxmin
  etməsinin" qarşısını alır.

### 6. Xarici linklər
- Bütün xarici linklərdə (sosial media və s.) `rel="noopener noreferrer"`
  istifadə olunur (bax: `Footer.jsx`) ki, yeni açılan səhifə əvvəlki
  səhifəyə (`window.opener`) giriş əldə edərək onu dəyişə bilməsin
  ("tabnabbing" adlı hücum növü).

## Content Guidelines

Saytdakı bütün başlıq və mətnlər üçün keçərli qayda:

- **Yalnız təsdiq cümlələri.** Reklam-üslubu sual formaları ("Səs sizi
  narahat edir?" tipli) qadağandır — mətnlər həmişə iddia/təsdiq şəklində
  yazılır (məs. "Yanğın təhlükəsizliyi. Mühəndislik dəqiqliyi.").
- **Minimal və birbaşa.** Uzun izahat əvəzinə qısa, konkret cümlələr.
- **Struktur nümunəsi (hero və bənzər bölmələr üçün):** kiçik rəng
  vurğusu (xətt) → böyük başlıq (adətən 2 sətir) → qısa açıqlayıcı
  mətn → tək bir aydın CTA düyməsi.

Bu qayda gələcəkdə əlavə olunan bütün bölmələrin (Services, Projects,
Contact və s.) mətnlərinə də tətbiq olunmalıdır.
