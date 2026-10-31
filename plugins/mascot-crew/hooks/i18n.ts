// Every word the mod shows or says, in each language it speaks. English
// unless the person picks another with the band's gear.

import type { Lang, Weapon } from '../types'

export type { Lang }

export const LANGS: readonly Lang[] = ['en', 'uk']
export const DEFAULT_LANG: Lang = 'en'
// Each language by its own name, as the gear's menu lists it.
export const LANG_NAMES: Record<Lang, string> = { en: 'English', uk: 'Українська' }

export const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang)

// The words drawn inside the pictures themselves, which are drawn in English.
export const localizeArt = (markup: string, lang: Lang) => (lang === 'uk' ? markup.replace(/>Moo!</g, '>Му!<') : markup)

// `n` and its word: `1 mini`, `2 minis`; `1 клодик`, `2 клодики`, `5 клодиків`.
const pluralEn = (n: number, [one, many]: readonly [string, string]) => `${n} ${n === 1 ? one : many}`
const pluralUk = (n: number, [one, few, many]: readonly [string, string, string]) => {
  const tens = n % 100
  const units = n % 10
  const word = tens >= 11 && tens <= 14 ? many : units === 1 ? one : units >= 2 && units <= 4 ? few : many

  return `${n} ${word}`
}

export type Words = {
  // The band.
  faster: string
  crewButton: string
  language: string
  // The gear's weapons: its heading, each weapon by name, and the toast when
  // the last one still on is pressed.
  weapons: string
  weaponNames: Record<Weapon, string>
  lastWeapon: string
  // What the pictures are, for a reader that cannot see them.
  miniGone: string
  miniWorking: (job: string) => string
  miniSays: (text: string) => string
  emptySlot: string
  jumpingDown: string
  finishing: (job: string) => string
  waiting: string
  working: (job: string) => string
  saluting: string
  lasso: string
  shot: string
  tomato: string
  bow: string
  // A subagent's status, as the background tasks list has it.
  status: Record<string, string>
  notListed: string
  seconds: (n: number) => string
  // The question the main mascot is asked about one mini, and the toasts.
  howLong: (task: string) => string
  alreadyAsked: (seconds: number) => string
  asked: (task: string) => string
  askFailed: string
  stopFailed: (reason: string) => string
  stopped: (task: string) => string
  paneTitle: string
  paneTooNarrow: string
  paneFailed: string
  // A mini's menu and its card.
  stop: string
  howLongButton: string
  details: string
  close: string
  job: (job: string) => string
  agent: (type: string) => string
  statusLine: (status: string, since: string, tools: number) => string
  now: (task: string) => string
  recently: (steps: string) => string
  // The crew pane.
  resting: string
  waitingOn: (job: string, minis: number) => string
  workingAs: (job: string) => string
  allDone: string
  hint: string
  noMinis: string
  steps: (n: number) => string
  nowLabel: string
  earlierLabel: string
  miniOf: (job: string) => string
}

export const WORDS: Record<Lang, Words> = {
  en: {
    faster: '🪢 FASTER',
    crewButton: '📋 Minis',
    language: 'Language',
    weapons: 'Weapons',
    weaponNames: { lasso: '🪢 Lasso', gun: '🔫 Revolver', tomato: '🍅 Tomato', bow: '🏹 Bow' },
    lastWeapon: 'At least one weapon stays on',
    miniGone: 'The mini handed in its work and went back to Claude',
    miniWorking: job => `Mini at work: ${job}`,
    miniSays: text => `Mini says: ${text}`,
    emptySlot: 'Empty spot',
    jumpingDown: 'Claude jumps under the prompt',
    finishing: job => `Claude finishes its own task (${job}) and calls the minis through a megaphone`,
    waiting: 'Claude waits for the subagents, glancing at its watch',
    working: job => `Claude at work: ${job}`,
    saluting: 'Claude salutes: all done',
    lasso: 'Lasso',
    shot: 'Gunshot',
    tomato: 'Tomato',
    bow: 'Bow and arrow',
    status: {
      pending: 'starting',
      running: 'working',
      waiting: 'waiting on a background task',
      idle: 'waiting for a message',
      completed: 'done',
      failed: 'error',
      killed: 'stopped',
    },
    notListed: 'not in the task list',
    seconds: n => `${n} s`,
    howLong: task =>
      `How much longer for the subagent "${task}"? Briefly: what stage is it at, and roughly how long until its result?`,
    alreadyAsked: seconds => `Already asked: you can ask about this mini again in ${seconds} s`,
    asked: task => `Asked Claude how long the mini "${task}" has left`,
    askFailed: "Couldn't send the question to the chat",
    stopFailed: reason => `Couldn't stop it: ${reason}`,
    stopped: task => `Mini "${task}" stopped`,
    paneTitle: 'Mini Claudes',
    paneTooNarrow: "The minis' pane doesn't fit: widen the window",
    paneFailed: "Couldn't open the minis' pane",
    stop: '⏹ Stop',
    howLongButton: '⏱ How long left?',
    details: 'ℹ️ Details',
    close: '✕ Close',
    job: job => `Job: ${job}`,
    agent: type => `agent ${type}`,
    statusLine: (status, since, tools) => `Status: ${status} · ${since} · tools: ${tools}`,
    now: task => `Now: ${task}`,
    recently: steps => `Recently: ${steps}`,
    resting: 'Claude is resting under the prompt',
    waitingOn: (job, minis) => `Claude the ${job} is waiting on ${pluralEn(minis, ['mini', 'minis'])}`,
    workingAs: job => `Claude the ${job} is at work`,
    allDone: 'All tasks done',
    hint: 'Hover a mini above the prompt to see its task; right-click for its menu.',
    noMinis: 'No minis right now.',
    steps: n => pluralEn(n, ['step', 'steps']),
    nowLabel: 'Now     ',
    earlierLabel: 'Earlier ',
    miniOf: job => `Mini ${job}`,
  },
  uk: {
    faster: '🪢 ШВИДШЕ',
    crewButton: '📋 Клодики',
    language: 'Мова',
    weapons: 'Зброя',
    weaponNames: { lasso: '🪢 Ласо', gun: '🔫 Револьвер', tomato: '🍅 Помідор', bow: '🏹 Лук' },
    lastWeapon: 'Хоча б одна зброя має лишитися',
    miniGone: 'Клодик здав роботу й пішов до Клода',
    miniWorking: job => `Клодик працює: ${job}`,
    miniSays: text => `Клодик каже: ${text}`,
    emptySlot: 'Вільне місце',
    jumpingDown: 'Клод стрибає під інпут',
    finishing: job => `Клод доробляє своє завдання (${job}) і кличе клодиків через гучномовець`,
    waiting: 'Клод чекає на сабагентів і поглядає на годинник',
    working: job => `Клод працює: ${job}`,
    saluting: 'Клод віддає честь: усе готово',
    lasso: 'Ласо',
    shot: 'Постріл',
    tomato: 'Помідор',
    bow: 'Лук і стріла',
    status: {
      pending: 'запускається',
      running: 'працює',
      waiting: 'чекає на фонове завдання',
      idle: 'чекає на повідомлення',
      completed: 'готово',
      failed: 'помилка',
      killed: 'зупинено',
    },
    notListed: 'немає в списку завдань',
    seconds: n => `${n} с`,
    howLong: task =>
      `Скільки ще працюватиме сабагент «${task}»? Коротко: на якому він етапі й приблизно коли буде результат?`,
    alreadyAsked: seconds => `Уже запитано: про цього клодика можна спитати знову через ${seconds} с`,
    asked: task => `Запитано в Клода, скільки ще працюватиме клодик «${task}»`,
    askFailed: 'Не вдалося надіслати питання в чат',
    stopFailed: reason => `Не вдалося зупинити: ${reason}`,
    stopped: task => `Клодика «${task}» зупинено`,
    paneTitle: 'Клодики',
    paneTooNarrow: 'Панель клодиків не вміщається: розшир вікно',
    paneFailed: 'Не вдалося відкрити панель клодиків',
    stop: '⏹ Зупинити',
    howLongButton: '⏱ Скільки залишилося?',
    details: 'ℹ️ Докладніше',
    close: '✕ Закрити',
    job: job => `Професія: ${job}`,
    agent: type => `агент ${type}`,
    statusLine: (status, since, tools) => `Статус: ${status} · ${since} · інструментів: ${tools}`,
    now: task => `Зараз: ${task}`,
    recently: steps => `Нещодавно: ${steps}`,
    resting: 'Клод відпочиває під інпутом',
    waitingOn: (job, minis) => `Клод-${job} чекає на клодиків: ${minis}`,
    workingAs: job => `Клод-${job} працює`,
    allDone: 'Усі завдання виконано',
    hint: 'Наведи курсор на клодика над інпутом, щоб побачити його завдання; правий клік — меню.',
    noMinis: 'Клодиків зараз немає.',
    steps: n => pluralUk(n, ['крок', 'кроки', 'кроків']),
    nowLabel: 'Зараз   ',
    earlierLabel: 'Раніше  ',
    miniOf: job => `Клодик-${job}`,
  },
}
