# CMS Bələdçisi — AR Group Sayt İdarəetməsi

Bu sənəd proqramçı olmayan admin istifadəçi üçün yazılıb. Saytın məzmununu
(layihələr, brendlər, komanda, məhsullar və s.) necə əlavə etmək, redaktə
etmək və silmək izah olunur.

## Girişin edilməsi

1. Brauzerdə saytın ünvanının sonuna `/admin/login` əlavə edin
   (məsələn: `https://argroup.az/admin/login`).
2. Sizə verilmiş **e-poçt** və **şifrə** ilə daxil olun.
3. Uğurlu girişdən sonra avtomatik olaraq idarəetmə panelinə
   (`/admin`) yönləndirilirsiniz.
4. Çıxış etmək üçün sol paneldəki **"Çıxış"** düyməsini basın.

> Qeyd: Yeni admin hesabı yaratmaq (qeydiyyat) imkanı saytda **qəsdən
> yoxdur**. Yeni admin istifadəçisi yalnız Supabase idarəetmə paneli
> vasitəsilə əlavə oluna bilər (bax `README.md`).

## Panelin ümumi görünüşü

Soldakı naviqasiya menyusu bölmələrə ayrılıb:

- **Dashboard** — bütün bölmələrə tez keçid.
- **Ana səhifə** — Layihələr, Brendlər, Tərəfdaşlar, Müştərilər.
- **Haqqımızda** — Mükafatlar, Komandamız.
- **Məhsullar** — Məhsullar.
- **Əlaqə** — Mesajlar.

Hər bölmədə eyni məntiq təkrarlanır: siyahı cədvəli, **"Yeni ..."** düyməsi
(yeni element əlavə etmək üçün), sətirdəki qələm ikonu (redaktə), zibil qutusu
ikonu (silmək — həmişə təsdiq pəncərəsi ilə), göz ikonu (dərc/gizlət) və
yuxarı/aşağı ox düymələri (sıralama).

---

## Ana səhifə bölmələri

### Layihələr

Ana səhifədəki "Layihələrimiz" bölməsi və `/projects` səhifəsi buradan
idarə olunur.

- **Yaratmaq/redaktə etmək:** başlıq, sifarişçi, məkan, status (*davam
  edir* / *tamamlanıb*), başlama/bitmə tarixi, hər 4 dildə (AZ/EN/RU/TR)
  təsvir və görülən işlərin siyahısı, bir ədəd şəkil.
- **Şəkil:** WebP, JPEG və ya PNG formatında, maksimum 5 MB.
- **Dərc et/gizlət:** göz ikonu ilə saytda görünüb-görünməməsini idarə
  edin — silmədən müvəqqəti gizlətmək üçün istifadə edin.
- **Sıralama:** yuxarı/aşağı oxlar layihənin göstərilmə sırasını dəyişir.
- **Silmək:** təsdiq pəncərəsi açılır, geri qaytarıla bilməz.

### Brendlər

Ana səhifədəki brend loqoları qridi.

- Sahələr: ad, loqo (şəkil), veb sayt linki (**könüllü** — boş qalarsa
  loqo klikə bağlı olmur).
- Dərc/gizlət, sıralama və silmə eyni məntiqlə işləyir.

### Tərəfdaşlar

- Sahələr: ad (könüllü), loqo, veb sayt linki (könüllü).
- Dərc/gizlət, sıralama, silmə — eyni.

### Müştərilər

- Sahələr: ad (könüllü), loqo. **Veb sayt linki sahəsi yoxdur** — sayt
  müştəri loqolarını heç vaxt klikə bağlı göstərmir.
- Dərc/gizlət, sıralama, silmə — eyni.

---

## Haqqımızda bölmələri

### Mükafatlar

- Sahələr: başlıq və təşkilat adı (hər 4 dildə), il (**könüllü** — dəqiq
  təsdiqlənməyibsə boş buraxın, uydurma il yazmayın), təsvir (hər 4
  dildə), şəkil.
- Hazırda saytda təsdiqlənmiş real mükafat yoxdursa, bu bölmə boş
  görünəcək — bu normaldır, xəta deyil.

### Komandamız

Bu bölmə **iyerarxiya** (rəhbər → tabeçilik) formasındadır.

- **Sahələr:** ad (könüllü — təsdiqlənmiş şəxs yoxdursa boş buraxın),
  vəzifə (AZ mütləqdir, digər 3 dil könüllüdür), şəkil, **rəhbər
  (parent)** seçimi.
- **İyerarxiyanın dəyişdirilməsi:** bir üzvün rəhbərini dəyişmək üçün
  formada "Rəhbər" sahəsindən yeni rəhbər seçin. Sistem **avtomatik**
  olaraq:
  - bir üzvün öz-özünün rəhbəri olmasının,
  - dövr yaranmasının (məsələn A → B → A),

  qarşısını alır və səhv mesajı göstərir — narahat olmayın, səhv
  seçimlər avtomatik rədd edilir.
- **Silmək:** əgər üzvün alt-komandası (tabeçiliyi) varsa, **silinmə rədd
  ediləcək**. Əvvəlcə həmin tabeçilikləri başqa rəhbərə keçirin və ya
  onları silin, sonra əsas üzvü silin.
- Sıralama (yuxarı/aşağı) yalnız **eyni rəhbərin tabeçiləri arasında**
  işləyir.

---

## Məhsullar

- **Kateqoriyalar sabitdir** — Kateqoriya seçimi 9 mövcud kateqoriyadan
  biridir (Yanğın təhlükəsizliyi, Vibrasiya izolyasiyası və s.). **Yeni
  kateqoriya CMS-dən əlavə edilə bilməz** — bu, developer tərəfindən kod
  səviyyəsində idarə olunur.
- **Sahələr:** kateqoriya, ad, brend (könüllü), xarici link (könüllü —
  məhsulun rəsmi səhifəsinə keçid), təsvir (hər 4 dildə).
- **Şəkillər:** bir məhsulun **birdən çox şəkli** ola bilər. Redaktə
  zamanı şəkil əlavə edə, sıralaya (sol/sağ ox), əvəz edə və silə
  bilərsiniz — hər əməliyyat dərhal yadda saxlanılır.
- Dərc/gizlət və sıralama (eyni kateqoriya daxilində) eyni məntiqlə
  işləyir.

---

## Mesajlar

Əlaqə formasından (`/contact`) göndərilən müraciətlər buraya düşür.

- **Redaktə oluna bilməz** — mesajlar yalnız oxuna, işarələnə və silinə
  bilər, mətni dəyişdirilə bilməz.
- Sətrə klikləyərək mesajın tam mətnini, göndərənin adını, e-poçtunu,
  telefonunu (varsa), seçdiyi xidməti (varsa) və tarixini görə bilərsiniz.
- **Oxunmuş/Oxunmamış:** zərf ikonuna klikləyərək statusu dəyişin —
  oxunmamış mesajlar qalın yazı və qırmızı nöqtə ilə fərqlənir.
- **Silmək:** zibil qutusu ikonu, təsdiq pəncərəsi ilə.

---

## CMS-dən idarə OLUNMAYAN hissələr

Aşağıdakılar **kod səviyyəsindədir** və CMS panelindən dəyişdirilə
**bilməz** — bunlar üçün developer lazımdır:

- **Xidmətlər (Services) səhifəsi** — struktur, texniki proses bölmələri,
  interaktiv izahat elementləri.
- **3D bina səhnəsi** — Ana səhifədəki interaktiv 3D bina, hotspot-lar
  (klikə bağlı nöqtələr).
- **Naviqasiya (header) və footer** — menyu linkləri, sosial media
  ikonları.
- **Ümumi dizayn** — layout, tipoqrafiya (şriftlər), rəng palitrası.
- **Məhsul kateqoriyalarının siyahısı** (9 sabit kateqoriya) — yalnız
  mövcud kateqoriyalar daxilində məhsul əlavə etmək mümkündür.
- Digər statik texniki UI elementləri (məs. Products səhifəsindəki
  brend-material kartları, `categoryMaterials.js`).

Bu sahələrdə dəyişiklik lazım olarsa, developerlə əlaqə saxlayın.

---

## Şəkillər haqqında praktiki tövsiyələr

- Təmiz, yüksək keyfiyyətli şəkillər istifadə edin.
- Mümkün olduqda **WebP** formatı tövsiyə olunur (kiçik fayl ölçüsü,
  yaxşı keyfiyyət).
- Lazımsız böyük fayllardan çəkinin — hazırkı Storage limiti **5 MB**-dır
  (bundan böyük fayl yüklənə bilməz).
- Loqolar üçün: mövcud kartların fonu ilə uyğunlaşan təmiz, şəffaf və ya
  neytral fonlu şəkil istifadə edin (kart fonu açıq rəngdədir).
- Artıq optimallaşdırılmış sayt şəkillərini (məs. hero şəkilləri, Services
  şəkilləri) səbəbsiz yerə əvəz etməyin — onlar performans üçün xüsusi
  hazırlanıb.
