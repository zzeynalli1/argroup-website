# Mülkiyyət Təhvili Checklist-i (Ownership Handoff)

Bu sənəd yekun mülkiyyət təhvilindən **əvvəl** yoxlanılmalı addımları
sadalayır. Heç bir mülkiyyət köçürməsi bu sənədin yazılması ilə **icra
edilməyib** — bu, yalnız bir checklist-dir.

**Ümumi qayda:** developer girişi (Vercel/Supabase/GitHub) yalnız
sahibkarın (AR Group / client) mülkiyyəti **təsdiqləndikdən sonra**
ləğv edilməlidir, əvvəl deyil.

---

## DOMEN (argroup.az)

- [ ] Səlahiyyətli DNS girişi (Hostinq panel və ya registrar) əldə
      edilib
- [ ] Registrar/domen hesabının kimə məxsus olduğu təsdiqlənib
- [ ] Domen hesabının bərpa e-poçtu/telefonu səlahiyyətli AR Group
      sahibinə aiddir (üçüncü tərəfə deyil)

## VERCEL

- [ ] Layihənin hazırkı şəxsi hesabda (developer) qalıb-qalmayacağı, yoxsa
      client-owned hesaba/komandaya köçürüləcəyi qərara alınıb
- [ ] Köçürmədən əvvəl client-in billing/mülkiyyət məlumatları
      təsdiqlənib (developer girişi silinmədən **əvvəl**)

## SUPABASE

- [ ] Client-in özünün "owner/admin" hesabı var (və ya yaradılıb)
- [ ] Billing/bərpa mülkiyyəti təsdiqlənib
- [ ] Client üçün CMS admin istifadəçisi yaradılıb/təsdiqlənib
      (Supabase Dashboard → Authentication → Users)
- [ ] Public qeydiyyat (sign-up) **deaktivdir** (təsdiqlənib)
- [ ] Anonim giriş (anonymous sign-in) **deaktivdir** (təsdiqlənib)

## GITHUB

- [ ] Repository-nin hazırkı şəxsi hesabda (`zzeynalli1`) qalıb-
      qalmayacağı, yoxsa client/şirkət hesabına köçürüləcəyi qərara
      alınıb
- [ ] Köçürmədən əvvəl client girişi təsdiqlənib (developer girişi
      silinmədən **əvvəl**)

## CMS

- [ ] Client admin giriş məlumatlarını (e-poçt) alıb
- [ ] Client `docs/CMS-GUIDE.md` sənədini oxuyub/başa düşüb
- [ ] Client sadə bir redaktə/dərc əməliyyatını (məs. bir Brend əlavə
      etmək və dərc etmək) sınaqdan keçirib

## TƏHLÜKƏSİZLİK

- [ ] **Heç bir şifrə** sənədləşdirmədə yazılmayıb (bu sənəddə də,
      digərlərində də)
- [ ] `.env` heç vaxt commit edilməyib (təsdiqlənib)
- [ ] Yekun təhvildə lazım gələrsə müvəqqəti/developer credential-ları
      dəyişdirilir (rotate)
- [ ] Lazımsız developer girişi **yalnız** client mülkiyyəti
      təsdiqləndikdən **sonra** ləğv edilir

## BACKUP / RECOVERY

- [ ] Git repository (kod tarixçəsi) qorunur
- [ ] Supabase migrationları (`supabase/migrations/`) qorunur
- [ ] DNS rollback dəyərləri sənədləşdirilib (bax
      `docs/DOMAIN-CUTOVER.md`)
- [ ] Hesab bərpası (account recovery) səlahiyyətli sahibin nəzarətindədir

---

## Admin şifrəsi haqqında vacib qeyd

Hazırkı admin şifrəsi bu və ya digər heç bir sənəddə **yazılmayıb,
göstərilməyib və avtomatik dəyişdirilməyib**. Düzgün təhvil prosesi:

1. Client öz e-poçtu ilə (və ya artıq mövcud olan admin e-poçtu ilə)
   Supabase Dashboard vasitəsilə şifrəni **özü** təyin edir/sıfırlayır.
2. Yeni şifrə ilə giriş sınaqdan keçirilir.
3. Yalnız bundan sonra developer girişinin ləğvi haqqında qərar verilir.

Saxta/nümunə client şifrəsi yaradılmayıb və yaradılmamalıdır.

---

## Bu fazada NƏ EDİLMƏYİB (qəsdən)

- Heç bir mülkiyyət köçürülməyib.
- Heç bir developer girişi ləğv edilməyib.
- Heç bir şifrə dəyişdirilməyib/yaradılmayıb.
- `argroup.az` DNS-i dəyişdirilməyib.
