/**
 * Verified detail-page content for AR Group's projects, transcribed
 * directly from each project's own "Ətraflı bax / See more" page on
 * https://argroup.az/project/show/<id>. Keyed by the matching numeric `id`
 * in data/projects.js. Covers all 20 projects currently listed in
 * data/projects.js (used by both Home's compact Projects view and the full
 * /projects page) — do not add an entry without visiting and transcribing
 * that project's own real detail page first, and never copy one project's
 * workPerformed list onto another.
 *
 * The source pages only ever served this description/scope-of-work copy in
 * English (no separate az/ru/tr text was found on the live site). `en` below
 * is that verified source text, kept verbatim. `az`/`ru`/`tr` are
 * translations of that same source text (not new/invented facts) so the
 * "Layihə haqqında" section can follow the active site locale — see
 * ProjectDetailModal.jsx, which picks the right language at render time.
 */
export const projectDetails = {
  1: {
    sourceUrl: 'https://argroup.az/project/show/1',
    startDate: '2022-01-05',
    endDate: null,
    description: {
      en: 'The Crescent Hotel is an arch-shaped building and looks like the Moon resting on the water surface of the Caspian Sea. The arched configuration of the skyscraper will not affect the interior of the building, as it is supported by multi-storey towers on both sides, which create additional volume and serve as a support for the entire hotel. The hotel intends to get 7 stars.',
      az: 'Crescent Hotel qövsvari formaya malik bina olub, Xəzər dənizinin su səthində dincələn Aya bənzəyir. Göydələnin qövsvari konfiqurasiyası binanın interyerinə təsir etməyəcək, çünki o, hər iki tərəfdən əlavə həcm yaradan və bütün otelin dayaq nöqtəsi kimi xidmət edən çoxmərtəbəli qüllələrlə dəstəklənir. Otel 7 ulduz statusu almağı planlaşdırır.',
      ru: 'Отель Crescent представляет собой здание арочной формы, напоминающее луну, покоящуюся на поверхности воды Каспийского моря. Арочная конфигурация небоскрёба не повлияет на интерьер здания, поскольку он поддерживается многоэтажными башнями с обеих сторон, которые создают дополнительный объём и служат опорой для всего отеля. Отель планирует получить статус 7 звёзд.',
      tr: "Crescent Hotel, kemer şeklinde bir bina olup Hazar Denizi'nin su yüzeyinde dinlenen Ay'a benzemektedir. Gökdelenin kemerli yapısı binanın iç mekânını etkilemeyecektir, zira bina her iki yandan, ek hacim yaratan ve tüm otelin taşıyıcısı olarak hizmet eden çok katlı kulelerle desteklenmektedir. Otel 7 yıldız statüsü almayı hedeflemektedir.",
    },
    workPerformed: { en: [], az: [], ru: [], tr: [] },
  },
  2: {
    sourceUrl: 'https://argroup.az/project/show/2',
    startDate: '2020-02-19',
    endDate: null,
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'PORT BAKU TOWER-2' project.",
      az: "Şirkətimizin 'PORT BAKU TOWER-2' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «PORT BAKU TOWER-2».',
      tr: "Şirketimizin 'PORT BAKU TOWER-2' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Implementation of Passive Fire Stop works (Fire Stopping) in mechanical and electrical transitions.',
        'Implementation of Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı (Fire Stopping) işlərinin həyata keçirilməsi.',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işlərinin (Firestop & Acoustic) həyata keçirilməsi.',
      ],
      ru: [
        'Выполнение работ по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Выполнение работ по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu (Fire Stopping) işlerinin uygulanması.',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işlerinin (Firestop & Acoustic) uygulanması.',
      ],
    },
  },
  3: {
    sourceUrl: 'https://argroup.az/project/show/3',
    startDate: '2022-06-21',
    endDate: '2023-01-16',
    description: {
      en: 'The company performed work on the "Alat Free Economic Zone" project, which involved three main service areas.',
      az: 'Şirkət "Alat Free Economic Zone" layihəsində üç əsas xidmət sahəsini əhatə edən işlər həyata keçirmişdir.',
      ru: 'Компания выполнила работы в рамках проекта «Alat Free Economic Zone», которые охватывали три основные сферы услуг.',
      tr: 'Şirket, "Alat Free Economic Zone" projesinde üç ana hizmet alanını kapsayan çalışmalar gerçekleştirmiştir.',
    },
    workPerformed: {
      en: [
        'Implementation of Passive Fire Stop works (Fire Stopping) in mechanical and electrical transitions.',
        'Implementation of Passive Firestop and Acoustic insulation works for construction and fine works',
        'Vibration solutions for mechanical systems',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı (Fire Stopping) işlərinin həyata keçirilməsi.',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işlərinin həyata keçirilməsi.',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
      ],
      ru: [
        'Выполнение работ по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Выполнение работ по пассивной противопожарной защите и акустической изоляции для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu (Fire Stopping) işlerinin uygulanması.',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işlerinin uygulanması.',
        'Mekanik sistemler için titreşim çözümleri.',
      ],
    },
  },
  4: {
    sourceUrl: 'https://argroup.az/project/show/4',
    startDate: '2019-04-16',
    endDate: '2022-12-19',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Ritz Carlton Hotel Baku' project.",
      az: "Şirkətimizin 'Ritz Carlton Hotel Baku' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Ritz Carlton Hotel Baku».',
      tr: "Şirketimizin 'Ritz Carlton Hotel Baku' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Implementation of Passive Fire Stop works (Fire Stopping) in mechanical and electrical transitions',
        'Implementation of Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
        'Vibration solutions for mechanical systems',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı (Fire Stopping) işlərinin həyata keçirilməsi.',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işlərinin (Firestop & Acoustic) həyata keçirilməsi.',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
      ],
      ru: [
        'Выполнение работ по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Выполнение работ по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu (Fire Stopping) işlerinin uygulanması.',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işlerinin (Firestop & Acoustic) uygulanması.',
        'Mekanik sistemler için titreşim çözümleri.',
      ],
    },
  },
  5: {
    sourceUrl: 'https://argroup.az/project/show/5',
    startDate: '2019-03-19',
    endDate: '2022-06-05',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Knightsbridge Residence' Baku White City project.",
      az: "Şirkətimizin Baku White City ərazisindəki 'Knightsbridge Residence' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Knightsbridge Residence», Baku White City.',
      tr: "Şirketimizin Baku White City'deki 'Knightsbridge Residence' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Implementation of Passive Fire Stop works (Fire Stopping) in mechanical and electrical transitions.',
        'Implementation of Passive Firestop and Acoustic insulation works for construction and fine works',
        'Vibration solutions for mechanical systems',
        'Concrete Cutting Works',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı (Fire Stopping) işlərinin həyata keçirilməsi.',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işlərinin həyata keçirilməsi.',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
        'Beton kəsmə işləri.',
      ],
      ru: [
        'Выполнение работ по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Выполнение работ по пассивной противопожарной защите и акустической изоляции для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
        'Работы по резке бетона.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu (Fire Stopping) işlerinin uygulanması.',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işlerinin uygulanması.',
        'Mekanik sistemler için titreşim çözümleri.',
        'Beton kesme işleri.',
      ],
    },
  },
  6: {
    sourceUrl: 'https://argroup.az/project/show/6',
    startDate: '2020-02-12',
    endDate: '2022-03-16',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Ministry of Taxes Tower Baku' project.",
      az: "Şirkətimizin 'Ministry of Taxes Tower Baku' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Ministry of Taxes Tower Baku».',
      tr: "Şirketimizin 'Ministry of Taxes Tower Baku' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Implementation of Passive Fire Stop works (Fire Stopping) in mechanical and electrical transitions',
        'Implementation of Passive Firestop and Acoustic insulation works for construction and fine works',
        'Vibration solutions for mechanical systems',
        'Concrete Cutting Works',
        'Pull Out Test & Vibration Testing',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı (Fire Stopping) işlərinin həyata keçirilməsi.',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işlərinin həyata keçirilməsi.',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
        'Beton kəsmə işləri.',
        'Çıxarma testi və vibrasiya testi (Pull Out Test & Vibration Testing).',
      ],
      ru: [
        'Выполнение работ по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Выполнение работ по пассивной противопожарной защите и акустической изоляции для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
        'Работы по резке бетона.',
        'Испытание на вырыв и вибрационное испытание (Pull Out Test & Vibration Testing).',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu (Fire Stopping) işlerinin uygulanması.',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işlerinin uygulanması.',
        'Mekanik sistemler için titreşim çözümleri.',
        'Beton kesme işleri.',
        'Çekme testi ve titreşim testi (Pull Out Test & Vibration Testing).',
      ],
    },
  },
  7: {
    sourceUrl: 'https://argroup.az/project/show/7',
    startDate: '2019-07-11',
    endDate: '2021-01-14',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Deniz Mall' project.",
      az: "Şirkətimizin 'Deniz Mall' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Deniz Mall».',
      tr: "Şirketimizin 'Deniz Mall' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Implementation of Passive Fire Stop works (Fire Stopping) in mechanical and electrical transitions.',
        'Implementation of Passive Firestop and Acoustic insulation works for construction and fine works',
        'Concrete Cutting Works',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı (Fire Stopping) işlərinin həyata keçirilməsi.',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işlərinin həyata keçirilməsi.',
        'Beton kəsmə işləri.',
      ],
      ru: [
        'Выполнение работ по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Выполнение работ по пассивной противопожарной защите и акустической изоляции для строительных и отделочных работ.',
        'Работы по резке бетона.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu (Fire Stopping) işlerinin uygulanması.',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işlerinin uygulanması.',
        'Beton kesme işleri.',
      ],
    },
  },
  8: {
    sourceUrl: 'https://argroup.az/project/show/8',
    startDate: '2018-06-07',
    endDate: '2019-01-29',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Dream Land Golf Club BAKU' project.",
      az: "Şirkətimizin 'Dream Land Golf Club BAKU' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Dream Land Golf Club BAKU».',
      tr: "Şirketimizin 'Dream Land Golf Club BAKU' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration.',
        'Electrical Roxtec Installation',
        'Chemical and kind of anchor work',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Elektrik Roxtec sisteminin quraşdırılması.',
        'Kimyəvi və digər növ ankraj işləri.',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Монтаж электрических систем Roxtec.',
        'Химическая анкеровка и другие виды анкерных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'Elektrik Roxtec montajı.',
        'Kimyasal ve diğer türde ankraj işleri.',
      ],
    },
  },
  9: {
    sourceUrl: 'https://argroup.az/project/show/9',
    startDate: '2019-03-14',
    endDate: '2021-02-10',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Hotel Courtyard by Marriott Baku Hotel 4' project.",
      az: "Şirkətimizin 'Hotel Courtyard by Marriott Baku Hotel 4' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Hotel Courtyard by Marriott Baku Hotel 4».',
      tr: "Şirketimizin 'Hotel Courtyard by Marriott Baku Hotel 4' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
        'Vibration solutions for mechanical systems',
        'Concrete Cutting Works',
        'Pull Out Test & Vibration Testing',
        'Chemical and kind of anchor work',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
        'Beton kəsmə işləri.',
        'Çıxarma testi və vibrasiya testi (Pull Out Test & Vibration Testing).',
        'Kimyəvi və digər növ ankraj işləri.',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
        'Работы по резке бетона.',
        'Испытание на вырыв и вибрационное испытание (Pull Out Test & Vibration Testing).',
        'Химическая анкеровка и другие виды анкерных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
        'Mekanik sistemler için titreşim çözümleri.',
        'Beton kesme işleri.',
        'Çekme testi ve titreşim testi (Pull Out Test & Vibration Testing).',
        'Kimyasal ve diğer türde ankraj işleri.',
      ],
    },
  },
  10: {
    sourceUrl: 'https://argroup.az/project/show/10',
    startDate: '2019-11-07',
    endDate: '2024-08-09',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Light House -1,2,3' Baku Sea Breeze Resort' project.",
      az: "Şirkətimizin 'Light House-1,2,3', Baku Sea Breeze Resort layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Light House-1,2,3», Baku Sea Breeze Resort.',
      tr: "Şirketimizin 'Light House-1,2,3', Baku Sea Breeze Resort projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration.',
        'Waterproof works (waterproof) in mechanical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Mexaniki keçidlərdə su izolyasiyası (waterproof) işləri.',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Гидроизоляционные работы (waterproof) в местах прохождения механических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'Mekanik geçişlerde su yalıtımı (waterproof) işleri.',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
      ],
    },
  },
  11: {
    sourceUrl: 'https://argroup.az/project/show/11',
    startDate: '2019-07-19',
    endDate: '2020-01-18',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Ibis Hotel Baku' project.",
      az: "Şirkətimizin 'Ibis Hotel Baku' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Ibis Hotel Baku».',
      tr: "Şirketimizin 'Ibis Hotel Baku' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
        'Concrete Cutting Works',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
        'Beton kəsmə işləri.',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
        'Работы по резке бетона.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
        'Beton kesme işleri.',
      ],
    },
  },
  12: {
    sourceUrl: 'https://argroup.az/project/show/12',
    startDate: '2019-03-08',
    endDate: '2020-08-22',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Merchant Hotel Baku' project.",
      az: "Şirkətimizin 'Merchant Hotel Baku' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Merchant Hotel Baku».',
      tr: "Şirketimizin 'Merchant Hotel Baku' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
        'Concrete Cutting Works',
        'Pull Out Test & Vibration Testing',
        'Chemical and kind of anchor work',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
        'Beton kəsmə işləri.',
        'Çıxarma testi və vibrasiya testi (Pull Out Test & Vibration Testing).',
        'Kimyəvi və digər növ ankraj işləri.',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
        'Работы по резке бетона.',
        'Испытание на вырыв и вибрационное испытание (Pull Out Test & Vibration Testing).',
        'Химическая анкеровка и другие виды анкерных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
        'Beton kesme işleri.',
        'Çekme testi ve titreşim testi (Pull Out Test & Vibration Testing).',
        'Kimyasal ve diğer türde ankraj işleri.',
      ],
    },
  },
  13: {
    sourceUrl: 'https://argroup.az/project/show/13',
    startDate: '2019-01-25',
    endDate: '2019-03-10',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Winter Park Office Building' & 'PARKVIEW Residence 24-apartments' & 'Winter Park 8-apartments' Residence' project.",
      az: "Şirkətimizin 'Winter Park Office Building', 'PARKVIEW Residence 24-apartments' və 'Winter Park 8-apartments Residence' layihələrində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проектов «Winter Park Office Building», «PARKVIEW Residence 24-apartments» и «Winter Park 8-apartments Residence».',
      tr: "Şirketimizin 'Winter Park Office Building', 'PARKVIEW Residence 24-apartments' ve 'Winter Park 8-apartments Residence' projelerinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
      ],
    },
  },
  14: {
    sourceUrl: 'https://argroup.az/project/show/14',
    startDate: '2021-09-27',
    endDate: '2022-12-07',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'SHABRAN WELLBEING RESORT' project.",
      az: "Şirkətimizin 'SHABRAN WELLBEING RESORT' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «SHABRAN WELLBEING RESORT».',
      tr: "Şirketimizin 'SHABRAN WELLBEING RESORT' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (FireStopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
      ],
    },
  },
  15: {
    sourceUrl: 'https://argroup.az/project/show/15',
    startDate: '2021-09-27',
    endDate: '2022-10-14',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Basgal Spa & Resort Hotel Azerbaijan' project.",
      az: "Şirkətimizin 'Basgal Spa & Resort Hotel Azerbaijan' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Basgal Spa & Resort Hotel Azerbaijan».',
      tr: "Şirketimizin 'Basgal Spa & Resort Hotel Azerbaijan' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
      ],
    },
  },
  16: {
    sourceUrl: 'https://argroup.az/project/show/16',
    startDate: '2022-09-21',
    endDate: '2024-11-25',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'SEVINC MALL' project.",
      az: "Şirkətimizin 'SEVINC MALL' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «SEVINC MALL».',
      tr: "Şirketimizin 'SEVINC MALL' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (FireStopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
        'Vibration solutions for mechanical systems',
        'Concrete Cutting Works',
        'Fire Consulting',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
        'Beton kəsmə işləri.',
        'Yanğın təhlükəsizliyi üzrə konsaltinq.',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
        'Работы по резке бетона.',
        'Консультации по пожарной безопасности.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
        'Mekanik sistemler için titreşim çözümleri.',
        'Beton kesme işleri.',
        'Yangın danışmanlığı.',
      ],
    },
  },
  17: {
    sourceUrl: 'https://argroup.az/project/show/17',
    startDate: '2022-11-15',
    endDate: null,
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Hilton Garden Baku' project.",
      az: "Şirkətimizin 'Hilton Garden Baku' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Hilton Garden Baku».',
      tr: "Şirketimizin 'Hilton Garden Baku' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: ['Passive Fire Stop works (Fire Stopping) in Facade', 'Concrete drilling'],
      az: ['Fasadda passiv yanğın dayandırıcı işlər (Fire Stopping).', 'Beton deşilməsi işləri.'],
      ru: ['Работы по пассивной противопожарной защите (Fire Stopping) на фасаде.', 'Сверление бетона.'],
      tr: ['Cephede pasif yangın durdurucu işleri (Fire Stopping).', 'Beton delme işleri.'],
    },
  },
  18: {
    sourceUrl: 'https://argroup.az/project/show/18',
    startDate: '2022-12-15',
    endDate: null,
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'SARABSKI PLAZA' project.",
      az: "Şirkətimizin 'SARABSKI PLAZA' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «SARABSKI PLAZA».',
      tr: "Şirketimizin 'SARABSKI PLAZA' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: ['Passive Fire Stop works'],
      az: ['Passiv yanğın dayandırıcı işlər.'],
      ru: ['Работы по пассивной противопожарной защите.'],
      tr: ['Pasif yangın durdurucu işleri.'],
    },
  },
  19: {
    sourceUrl: 'https://argroup.az/project/show/21',
    startDate: '2021-02-19',
    endDate: '2021-03-05',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'INTER CONTINENTAL HOTEL' project.",
      az: "Şirkətimizin 'INTER CONTINENTAL HOTEL' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «INTER CONTINENTAL HOTEL».',
      tr: "Şirketimizin 'INTER CONTINENTAL HOTEL' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (FireStopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
        'Vibration solutions for mechanical systems',
        'Concrete Cutting Works',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
        'Beton kəsmə işləri.',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
        'Работы по резке бетона.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
        'Mekanik sistemler için titreşim çözümleri.',
        'Beton kesme işleri.',
      ],
    },
  },
  20: {
    sourceUrl: 'https://argroup.az/project/show/22',
    startDate: '2019-05-18',
    endDate: '2021-07-03',
    description: {
      en: "We would like to briefly inform you about the works carried out by our company in the 'Azerbaijan Thermal Power Plant' project.",
      az: "Şirkətimizin 'Azerbaijan Thermal Power Plant' layihəsində həyata keçirdiyi işlər barədə sizə qısaca məlumat vermək istəyirik.",
      ru: 'Мы хотели бы кратко проинформировать вас о работах, выполненных нашей компанией в рамках проекта «Azerbaijan Thermal Power Plant».',
      tr: "Şirketimizin 'Azerbaijan Thermal Power Plant' projesinde gerçekleştirdiği çalışmalar hakkında sizi kısaca bilgilendirmek istiyoruz.",
    },
    workPerformed: {
      en: [
        'Passive Fire Stop works (Fire Stopping) in mechanical and electrical penetration.',
        'Passive Firestop and Acoustic insulation works for construction and fine works (Firestop & Acoustic)',
        'Vibration solutions for mechanical systems',
        'Concrete Cutting Works',
      ],
      az: [
        'Mexaniki və elektrik keçidlərində passiv yanğın dayandırıcı işlər (Fire Stopping).',
        'Tikinti və incə işlər üçün passiv yanğın dayandırıcı və akustik izolyasiya işləri (Firestop & Acoustic).',
        'Mexaniki sistemlər üçün vibrasiya həlləri.',
        'Beton kəsmə işləri.',
      ],
      ru: [
        'Работы по пассивной противопожарной защите (Fire Stopping) в местах прохождения механических и электрических коммуникаций.',
        'Работы по пассивной противопожарной защите и акустической изоляции (Firestop & Acoustic) для строительных и отделочных работ.',
        'Виброизоляционные решения для механических систем.',
        'Работы по резке бетона.',
      ],
      tr: [
        'Mekanik ve elektrik geçişlerinde pasif yangın durdurucu işleri (Fire Stopping).',
        'İnşaat ve ince işler için pasif yangın durdurucu ve akustik yalıtım işleri (Firestop & Acoustic).',
        'Mekanik sistemler için titreşim çözümleri.',
        'Beton kesme işleri.',
      ],
    },
  },
}
