# CLAUDE.md

## Layihə
Bu, AR Group Construction Services-in (https://www.argroup.az) premium,
interaktiv korporativ saytının yenidən qurulmasıdır. Bu, ŞABLON (template)
sayt DEYİL — hər bölmə həm təhsil verməli, həm də maraqlı təcrübə təqdim
etməlidir.

Məzmun üçün əsas mənbə: `docs/argroup-knowledge-base.md` (real saytdan
çıxarılmış, təsdiqlənmiş şirkət məlumatları).

## Məzmun qaydaları
- Yalnız real AR Group məzmunundan istifadə et, təkmilləşdir — uydurma.
- Lorem Ipsum və ya buna bənzər saxta mətn qadağandır (skeleton mərhələsində
  aydın işarələnmiş "PLACEHOLDER" mətni istisnadır — bu, final məzmun kimi
  təqdim edilmir).
- Layihə, məhsul, statistika, sertifikat və ya şirkət tarixçəsi uydurma.
- Əgər lazım olan məlumat bilik bazasında yoxdursa, uydurmaq əvəzinə soruş.
- Bütün başlıq/mətnlər təsdiq cümləsi formasında olmalıdır (reklam-üslubu
  sual formaları qadağandır) — bax README.md "Content Guidelines".

## Dizayn istiqaməti
- Premium, sənaye (industrial), minimal amma zəngin, yüksək səviyyəli.
- Hər vacib bölmədə hansısa interaksiya olmalıdır.
- Real 3D (uyğun olan yerlərdə), hamar animasiyalar, sürətli yüklənmə.
- Ümumi/generic korporativ layout-lardan qaçın.

## İş axını qaydaları
- Hər bölməni kodlaşdırmazdan əvvəl təsdiq gözlə.
- Artıq tamamlanmış/təsdiqlənmiş bölmələrə toxunmazdan əvvəl həmişə soruş.
- İşləyən mövcud komponentləri əvəz etmə — üzərinə əlavə et/genişləndir.
- Real `.glb` model olmayan yerlərdə procedural 3D həndəsə (divar, boru,
  HVAC və s.) YAZMA — yalnız minimal test-primitiv (məs. boz kub) istifadə
  et, real model gələndə `/public/models/`-dən `useGLTF()` ilə yüklə.

## Texniki qaydalar
- Stack: Vite + React + Tailwind CSS v4 + react-three-fiber/drei/
  postprocessing + framer-motion + gsap + Lenis (smooth scroll).
- Rəng palitrası: yalnız `tailwind.config.js`-də təyin olunmuş tokenlərdən
  istifadə et (industrial-950/900/800, base-50/100, ember-600/800, amber-500,
  neutral-custom-400/600) — ad-hoc marka rəngi əlavə etmə.
- Tünd/açıq ritm: tam-enli bölmələr ardıcıl olaraq hamısı industrial-950
  olmamalıdır (monoton "tünd" hiss yaradır). Səhifə boyu növbələşdirin:
  Hero industrial-950 (ən tünd, əsas fokus) qalır; digər tünd bölmələr üçün
  industrial-900 (bir az açıq) və ya industrial-800 istifadə et; əksər orta
  bölmələr base-50/base-100 (açıq fon) olmalıdır; son CTA və Partners/Trust
  bölmələri yenidən tünd ola bilər (bağlayıcı vurğu üçün). Header/Footer
  bu qaydadan kənardır — brend konsistensiyası üçün həmişə tünd qalır.
- i18n: bütün istifadəçiyə görünən mətn `src/locales/<locale>/<namespace>.json`
  fayllarından `useTranslation(namespace)` vasitəsilə gəlməlidir — komponent
  daxilində hardcode mətn qadağandır. `az` real (placeholder) məzmuna
  malikdir; `en`/`ru`/`tr` eyni strukturu güzgüləyir və tərcümə olunana
  qədər `az`-a fallback edir.
- Qovluq strukturu: bax README.md "Qovluq strukturu".

## İstinad sənədləri
- `docs/argroup-knowledge-base.md` — çıxarılmış real şirkət məlumatları və
  bilinən boşluqlar (Industrial/Marine/Design Engineering təsviri,
  sertifikatlar, mükafatlar və s.).
- `README.md` — quraşdırma, təhlükəsizlik qeydləri, məzmun qaydaları.
