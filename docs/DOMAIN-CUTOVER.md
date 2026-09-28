# argroup.az — Domen Keçidi Planı (Sənədləşdirmə)

**Bu fayl yalnız sənədləşdirmədir. Heç bir DNS dəyişikliyi bu sənədin
yazılması ilə edilməyib və edilməməlidir.** DNS panelinə giriş əldə
edildikdən sonra, dəyişiklikdən əvvəl sahibkardan (client) yenidən
təsdiq alınmalıdır.

## Hazırkı vəziyyət (təsdiqlənib, DNS oxu vasitəsilə)

**Domen:** `argroup.az`

**Hazırkı DNS provayderi / nameserver-lər:**
```
ns1.hostinq1.com
ns2.hostinq1.com
ns3.hostinq1.com
ns4.hostinq1.com
```

**Hazırkı web A qeydləri (rollback üçün saxlanılıb):**
```
A  argroup.az (@)   →  162.210.96.117
A  www.argroup.az   →  162.210.96.117
```

**Vercel-in tələb etdiyi dəyər (Vercel-dən birbaşa təsdiqlənib, təxmin
edilməyib):**
```
A  argroup.az (@)   →  76.76.21.21
A  www.argroup.az   →  76.76.21.21
```

Bu, Vercel-in **tövsiyə etdiyi minimal yol**dır (A qeydi üsulu) —
nameserver-ləri Vercel-in öz nameserver-lərinə (`ns1.vercel-dns.com`,
`ns2.vercel-dns.com`) dəyişmək **alternativ** kimi mövcuddur, lakin bu
plan **onu seçmir**, çünki nameserver dəyişikliyi bütün DNS qeydlərini
(o cümlədən mail qeydlərini) Vercel-in idarəçiliyinə keçirər və e-poçtu
risk altına qoyar.

## Tələb olunan gələcək web dəyişikliyi

| Tip | Ad/Host | Köhnə dəyər | Yeni dəyər |
|---|---|---|---|
| A | `@` (argroup.az) | `162.210.96.117` | `76.76.21.21` |
| A | `www` | `162.210.96.117` | `76.76.21.21` |

Bundan başqa heç bir DNS qeydi dəyişdirilməməlidir.

## MÜTLƏQ TOXUNULMAMALI OLAN QEYDLƏR

Domen keçidi zamanı aşağıdakılar **dəyişdirilməməli, silinməməli və ya
yenidən yaradılmamalıdır**:

- **Nameserver-lər** (`ns1-4.hostinq1.com`)
- **MX qeydləri**
- **SPF TXT qeydi**
- **DKIM / `_domainkey` qeydləri**
- Digər mail-bağlı qeydlər (`mail.*`, `autodiscover` və s.)
- Əlaqəsiz TXT/doğrulama qeydləri

### Təsdiqlənmiş mail məlumatları (rollback və doğrulama üçün)

**MX:**
```
mx1.hostinq1.com  (preference 10)
mx2.hostinq1.com  (preference 10)
```

**SPF (TXT, apex):**
```
v=spf1 include:spf.supremebox.com mx -all
```

**DMARC:** `_dmarc.argroup.az` sorğusu zamanı heç bir qeyd tapılmadı
(NXDOMAIN) — hazırda DMARC qeydi yoxdur.

**DKIM:** **Tam yoxlanılmayıb.** DKIM qeydləri adətən provayder-spesifik
bir "selector" adı altında olur (məs. `selector1._domainkey.argroup.az`)
və bu ad kənardan təxmin edilə bilməz. Bunun mövcud olub-olmadığı bu
sənəddə **iddia edilmir** — sadəcə `_domainkey` altındakı heç bir qeydə
bu keçid zamanı toxunulmayacağı təmin edilir.

## Rollback (geri qaytarma)

Əgər keçiddən dərhal sonra kritik bir problem aşkar olunarsa, YALNIZ bu
iki A qeydini köhnə dəyərə qaytarın:

```
A  argroup.az (@)   →  162.210.96.117
A  www.argroup.az   →  162.210.96.117
```

Mail qeydlərinə (MX/SPF/DKIM) rollback zamanı da **toxunulmamalıdır** —
onlar heç vaxt dəyişdirilmədiyi üçün rollback-ə ehtiyac yoxdur.

## DNS girişi əldə edildikdən sonra ediləcək addımlar

DNS panelinə (Hostinq) səlahiyyətli giriş əldə olunduqdan və sahibkar
final təsdiqini verdikdən sonra, aşağıdakı ardıcıllıqla davam edilməlidir:

1. Yuxarıdakı 2 A qeydini dəyişdirmək (yalnız bunlar).
2. DNS yayılmasını (propagation) izləmək — dərhal baş vermir, təkrar-
   təkrar qeyd dəyişdirməklə "sürətləndirilməyə" çalışılmamalıdır.
3. Vercel-də domen statusunun "Valid Configuration" olduğunu təsdiqləmək.
4. HTTPS sertifikatının (`argroup.az` və `www.argroup.az` üçün) Vercel
   tərəfindən avtomatik verildiyini təsdiqləmək.
5. `www.argroup.az → argroup.az` yönləndirməsini Vercel layihə
   ayarlarından (Project → Settings → Domains) konfiqurasiya/təsdiq
   etmək.
6. Bütün SPA route-larının (`/about`, `/services`, `/products`,
   `/projects`, `/admin/login` və s.) `argroup.az` üzərindən düzgün
   açıldığını yoxlamaq.
7. `https://argroup.az` üzərində tam production smoke test
   (CMS oxunması, Contact Form, Admin girişi və s.) keçirmək.
8. Keçiddən sonra MX/SPF/DKIM qeydlərinin dəyişmədiyini yenidən
   yoxlamaq (e-poçtun kəsilmədiyini təsdiqləmək üçün).

Bu addımların **heç biri** bu sənədin yazıldığı tarixdə icra
edilməyib — hamısı DNS girişi əldə olunduqdan sonrakı ayrı mərhələdədir.
