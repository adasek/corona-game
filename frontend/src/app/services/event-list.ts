import {DayState} from './simulation';
import {EventTrigger} from './events';
import {dateDiff} from './utils';

function seasonalDateDiff(date: string, mmdd: string) {
  const date2 = date.slice(0, 5) + mmdd;
  return dateDiff(date, date2);
}

/**
 * Generate first true randomly between given dates
 * TODO: make randomness uniform
 * TODO: unit test
 * @param date - simulation date
 * @param mmddFrom - interval start
 * @param mmddTo - interval end
 */
function dateBetweenTrigger(date: string, mmddFrom: string, mmddTo: string) {
  if (seasonalDateDiff(date, mmddFrom) > 0 && seasonalDateDiff(date, mmddTo) <= 0) {
    const intervalDiff = dateDiff(date.slice(0, 5) + mmddTo, date.slice(0, 5) + mmddFrom);
    const intervalDays = intervalDiff >= 0 ? intervalDiff : 365 - (intervalDiff);
    return (seasonalDateDiff(date, mmddFrom) * (1 / (intervalDays + 1))) > Math.random();
  } else {
    return false;
  }
}

// no type check below for interpolated attributes
// TODO use rounded values
export const eventTriggers: EventTrigger[] = [
  /****************************************************************************
   *
   * Test events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'První mrtvý',
        text: 'Co se vláda rozhodne udělat?',
        mitigations: [{label: 'Nic', timeout: 0}, {label: 'Letáková kampaň', timeout: 14, rMult: 0.9, cost: 0.001}],
      },
    ],
    condition: (s: DayState) => s.stats.deaths.today >= 1,
  },
  {
    events: [
      {
        title: 'Ekonomika: První miliarda v nákladech!',
        // TODO show in billion
        text: 'Konkrétně {{stats.costs.total}} a to máme za sebou již {{stats.detectedInfections.total}} infikovaných',
      },
    ],
    condition: (s: DayState) => s.stats.costs.total > 1_000_000_000,
  },
  {
    events: [
      {
        title: 'Úspěšně očkujeme',
        text: 'Polovina populace již byla očkována.',
      },
    ],
    condition: (s: DayState) => s.stats.vaccinationRate > .5,
  },

  /****************************************************************************
   *
   * State events
   *
   ****************************************************************************/

  // Krize a bonusy duvery
  {
    events: [
      {
        title: 'Důvěra ve vládu klesá',
      },
    ],
    condition: (s: DayState) => s.stats.stability <= 25,
  },
  {
    events: [
      {
        title: 'Češi jsou z koronaviru frustrovaní',
        text: 'Nálada je stále horší, tvrdí terapeut.',
      },
    ],
    condition: (s: DayState) => s.stats.stability <= 0,
  },
  {
    events: [
      {
        title: 'Opozice vyzývá k rezignaci!',
        help: 'Společenská stabilita dosahuje kritických čísel. Pokud dosáhne hodnoty -50, vaše hra končí.',
      },
    ],
    condition: (s: DayState) => s.stats.stability <= -30,
    timeout: 30, // repeat every 30 days
  },
// Panika
  {
    events: [
      {
        title: 'Za poslední týden si koronavirus vyžádal tisíce obětí a počet mrtvých stále rapidně vzrůstá.',
        text: 'Kritická situace vede obyvatele k větší izolaci tam, kde je to možné.',
        help: 'Izolace obyvatel se výrazně propisuje do nákladů. Na druhou stranu výrazně snižuje hodnotu R.',
        // cost = 1.5*cost of lockdown (values taken from game.ts)
        mitigations: [{
          label: 'OK', timeout: 14, rMult: 0.7, cost: (0.32 + 0.06 + 0.35) * 1.5,
          stabilityCost: (0.15 + 0.05 + 0.15) * 1.5,
        }],
      },
    ],
    condition: (s: DayState) => (s.stats.deaths.avg7Day >= (2500 / 7) && 0.05 > Math.random()),
    timeout: 14, // May occur repeatedly
  },
  // pocet mrtvych za den
  {
    events: [
      { // Random event title demo
        title: 'Za pouhý den COVID zabil {{stats.deaths.today}} lidí',
      },
      {
        title: '{{stats.deaths.today}} mrtvých za jediný den',
      },
      {
        title: 'Šok: {{stats.deaths.today}} mrtvých za jediný den',
        text: 'Předseda vlády vydal prohlášení. Předsedkyně občanského sdružení antiCOVID, vyzývá k okamžité akci.',
      },
     ],
    condition: (s: DayState) => s.stats.deaths.today >= 10,
  },
  {
    events: [
      {
        title: 'Česko má rekordní denní počet úmrtí lidí nakažených covidem',
        help: 'Zvyšující se počet obětí se negativně propisuje do hodnoty společenské stability.',
        mitigations: [{label: 'OK', stabilityCost: 2, timeout: 1}],  // Important to set timeout: 1 for one time events
      },
    ],
    condition: (s: DayState) => s.stats.deaths.today >= 10,
  },

  /****************************************************************************
   *
   * Seasonal events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Začátek prázdnin',
        text: 'Školáci dnes dostávají vysvědčení a začínají jim prázdniny.',
        help: 'Opatření “uzavření škol” bylo aktivováno bez dalších nákladů.',
      },
    ],
    condition: (s: DayState) => seasonalDateDiff(s.date, '06-31') === 0,
    timeout: 90, // Happens every year
  },
  {
    events: [
      {
        title: 'Konec prázdnin',
        text: 'Prázdniny skončily a školáci se vrací do škol. Máme očekávat zhoršení situace?',
        help: 'Opatření “uzavření škol” opět vyžaduje další náklady a snižuje společenskou stabilitu.',
      },
    ],
    condition: (s: DayState) => seasonalDateDiff(s.date, '09-01') === 0,
    timeout: 90, // Happens every year
  },
  {
    events: [
      {
        title: 'Virus se v teplém podnebí hůř šíří. Vědci předpokládají zpomalení pandemie.',
      },
    ],
    condition: (s: DayState) => dateBetweenTrigger(s.date, '05-20', '06-14'),
    timeout: 90, // Happens every year
  },
  {
    events: [
      {
        title: 'Konec teplého počasí',
        text: 'Jak teplota ovlivňuje šíření koronaviru? Chladné počasí počasí pomáhá šíření, tvrdí epidemiologové.',
      },
    ],
    condition: (s: DayState) => dateBetweenTrigger(s.date, '09-10', '10-09'),
    timeout: 90, // Happens every year
  },
  /****************************************************************************
   *
   * Autumn package events
   *
   ****************************************************************************/
  {
    events: [
      {
       title: 'Skandál ministra',
       text: 'Ministr porušil svá vlastní pravidla. V jeho vile se na večírku sešlo přes dvacet osob!',
       help: 'Pokud ministr po porušení vlastních nařízení setrvá na místě, mohou se obyvatelé bouřit, což znamená pokles společenské stability. Vyhození ministra, který je ve své práci již zaběhlý, může výrazně posunout začátek očkování.',
       mitigations: [
         // todo: fire -> postpone vaxination start
         {label: 'Vyhodit ministra', vaccinationPerDay: -1000, timeout: 1},
         {label: 'Neřešit prohřešek', stabilityCost: 5, timeout: 1},
       ],
      },
      {
        title: 'Odhalili jsme: předražené zakázky za miliardy!',
        text: 'Jeden z našich dodavatelů trasování si účtuje mnohem víc peněz než je v branži zvykem, ale zároveň jsme na jeho dodávkách závislí.',
        help: 'Pokud budeme nadále setrvávat s dosavadním dodavatelem, ztratíme na nevýhodných zakázkách více peněz. Bez těchto dodávek se ale zvýší hodnota R.',
        mitigations: [
          {label: 'Zůstat s dodavatelem', cost: 5, timeout: 1},
          {label: 'Změnit dodavatele', rMult: 1.05, timeout: 1},
        ],
      },
      {
        title: 'Nejsem ovce, nošení roušky odmítám! Přežijí silnější.',
        text: 'Významný politik veřejně odsuzuje nošení roušek a byl bez ní několikrát vyfocen v obchodě',
        help: 'Pokud významná politická osobnost nebude potrestána může to vést k menší disciplíně obyvatelstva při dodržování opatření, což může přinést, jak nové nakažené, tak se negativně propsat do hodnoty R. Jeho potrestání však může pobouřit jeho příznivce a negativně se tak popsat na společenské stabilitě.',
        mitigations: [
          {label: 'Neřešit prohřešek', rMult: 1.02, exposedDrift: Math.round(1000 + Math.random() * 1000), timeout: 1},
          {label: 'Potrestat politika jako ostatní', stabilityCost: 2, timeout: 1},
        ],
      },
      {
        title: 'Zažije Česko první volby ve znamení koronaviru?',
        help: 'Odložení voleb obyvatelstvo popudí a negativně se odrazí ve společenské stabilitě. Pokud volby proběhnou, přibude nakažených.',
        mitigations: [
          {label: 'Odložení voleb', stabilityCost: 5 + Math.random() * 10, timeout: 1},
          {label: 'Potrestat politika jako ostatní', exposedDrift: Math.round(2000 + Math.random() * 3000), timeout: 1},
        ],
      },
    ],
    condition: (s: DayState) => dateBetweenTrigger(s.date, '10-15', '12-01'),
  },
  /****************************************************************************
   *
   * Winter package events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Vláda se zabývá otevřením skiaeálů. Situace komplikuje rozhodnutí.',
        help: 'Otevření skiareálů zvýší počet nakažených v řádu tisíců. Jejich zavření na druhou stranu negativně ovlivní společenskou stabilitu.',
        mitigations: [
          {label: 'Otevřít skiareály', exposedDrift: Math.round(2000 + Math.random() * 3000), timeout: 1},
          {label: 'Neotevřít', stabilityCost: 5, timeout: 1},
        ],
      },
      // Vánoční svátky
      {
        title: 'Vánoce během koronaviru: Jaké svátky nás letos čekají?',
        text: 'Pro období svátků je možné zpřísnit opatření, nebo naopak udělit výjimky z opatření.',
        help: 'Lze očekávat, že udělení výjimek pro období svátků obyvatelé ocení a pozitivně se tak promítne do společenské stability, ale zato přinese větší počet nových nakažených. Přísná opatření se zase naopak setkají s nevolí obyvatel a poklesem společenské stability.',
        mitigations: [
        {label: 'Povolit půlnoční mše', stabilityCost: -2,
          exposedDrift: Math.round(500 + Math.random() * 1000), timeout: 1},
        {label: 'Udělit výjimku pro rodinná setkání nad 6 lidí', stabilityCost: -2,
          exposedDrift: Math.round(1000 + Math.random() * 1000), timeout: 1},
        {label: 'Povolit obojí', stabilityCost: -5, exposedDrift: Math.round(1500 + Math.random() * 2500), timeout: 1},
        {label: 'Zakázat půlnoční mše i rodinná setkání nad 6 lidí', stabilityCost: 5, timeout: 1},
        ],
      },
      // Silvestr
      {
        title: 'Jak česko oslaví příchod nového roku v době pandemie covid-19?',
        text: 'Pro období svátků je možné zpřísnit opatření, nebo naopak udělit výjimky z opatření.',
        help: 'Pokud budou opatření zpřísněna, lze očekávat vlnu nevole obyvatel a snížení společenské stability. Výjimky z opatření sice společenskou stabilitu lehce zvýší, ale povedou ke zvýšení počtu nemocných.',
        mitigations: [
          {label: 'Povolit večerní vycházení na Silvestra', stabilityCost: -2,
            exposedDrift: Math.round(1000 + Math.random() * 1000), timeout: 1},
          {label: 'Nepovolovat večerní vycházení na Silvestra', stabilityCost: 5, timeout: 1},
        ],
      },
    ],
    condition: (s: DayState) => dateBetweenTrigger(s.date, '12-02', '02-14'),
  },
  /****************************************************************************
   *
   * Vaccination events
   *
   ****************************************************************************/
  {
    events: [
      {
        title: 'Testování vakcín v poslední fázi.',
        text: 'Stát skrze společný nákup Evropské unie objednal miliony očkovacích dávek.',
        help: 'Úspěšný vývoj vakcín a jejich výhodný nákup zvyšuje společenskou stabilitu.',
        mitigations: [{label: 'OK', stabilityCost: -10, timeout: 1}], // One time event
      },
    ],
    condition: (s: DayState) => dateBetweenTrigger(s.date, '10-25', '11-25'),
    timeout: 900, // Do not repeat
  },
  {
    events: [
      {
        title: 'Zmírní kampaň obavy z očkování proti covidu-19?',
        text: 'Je třeba se rozhodnout, zda budou investovány peníze do propagace očkování proti koronaviru.',
        help: 'Investice do kampaně pro očkování zvýší zájem o vakcinaci a tím pádem její rychlost. Je na ni však třeba vydat další náklady a zároveň se při možném neúspěchu kampaně negativně podepíše na společenské stabilitě. Odmítnutí proma vakcinaci zpomalí.',
        mitigations: [
          // todo: should desintegrate one next Antivax event
          // todo: check the numbers (specification document is vague about the numbers)
          {label: 'Investovat do propagace vakcín', vaccinationPerDay: 1000, cost: 5, timeout: 1},
          {label: 'Neinvestovat', vaccinationPerDay: -1000, timeout: 1},
          ],
      },
    ],
    // todo: first occurance in a month after vaxcination is researched
    // todo: repeat once every 3 months
    condition: (s: DayState) => dateBetweenTrigger(s.date, '01-01', '01-10'),
    timeout: 900, // don't repeat
  },
  {
    events: [
      {
        title: 'Toto jsou fakta: vakcína proti koronaviru je tvořena fragmenty tkání z potracených lidských plodů!',
        text: 'Ve společnosti se šíří hoax o tom, že vakcína obsahuje látky z nenarozených dětí.',
        help: 'Rychlost vakcinace se snižuje.',
        mitigations: [
          // todo: check the number
          {label: 'Ok', vaccinationPerDay: -2000, timeout: 1},
        ],
      },
    ],
    condition: (s: DayState) => (dateDiff(s.date, '20210110') > 0 && Math.random() > 0.02),
    timeout: 7, // cannot occur more often than once every 7 days
  },
  {
    events: [
      {
        title: 'Tři sousední země překročily hranici 75 % proočkování populace.',
        text: 'Sousední země mají proočkováno a nabízejí pomoc s očkováním v ČR.',
        help: 'Přijetí zahraniční pomoci urychlí vakcinaci a zvedne o několik procent proočkovanost ČR. Její odmítnutí se může negativně propsat do společenské stability.',
        mitigations: [
          // todo: should not change vaccinationPerDay but increase totalVaccinated (by 5%)
          {label: 'Přijmout zahraniční pomoc', vaccinationPerDay: 5000, timeout: 1},
          {label: 'Nepřijmout zahraniční pomoc', stabilityCost: 5, timeout: 1},
        ],
      },
    ],
    condition: (s: DayState) => (dateDiff(s.date, '20210101') > 0 && dateBetweenTrigger(s.date, '05-15', '05-30')),
    timeout: 900, // occures only once
  },
];
