// SVG drawings of the mascot. Animation is SMIL only: the desktop draws an
// interactive Svg in a script-less frame where SMIL is what runs.

const O = '#D97757'
const D = '#1f1f1f'

export type Job = {
  name: string
  emoji: string
  prop: string
  hat: string
  tool: string
  swing: string
  dur: string
  target: string
}

const rot = (values: string, dur: string, extra = 'repeatCount="indefinite"') =>
  `<animateTransform attributeName="transform" type="rotate" values="${values}" dur="${dur}" ${extra}/>`

const move = (values: string, dur: string, extra = 'repeatCount="indefinite"') =>
  `<animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}" ${extra}/>`

const blink = (values: string, dur: string, begin = '0s') =>
  `<animate attributeName="opacity" values="${values}" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>`

const HANDLE = '<rect x="-1" y="-16" width="2" height="16" fill="#8b5a2b"/>'
const dome = (fill: string) => `<path d="M8 9 Q20 -4 32 9Z" fill="${fill}"/>`
// Lit for a moment at the strike of a swing (STRIKE of its period), as a
// 16-bit sprite flashes: on or off, nothing between.
const STRIKE = 0.3
const flash = (dur: string) =>
  `<animate attributeName="opacity" values="0;1;0" keyTimes="0;${STRIKE};${STRIKE + 0.25}" calcMode="discrete" dur="${dur}" repeatCount="indefinite"/>`
const sparks = (x: number, y: number, dur: string) =>
  `<g fill="#ffd54a" opacity="0">${flash(dur)}<rect x="${x}" y="${y}" width="2" height="2"/><rect x="${x + 6}" y="${y - 4}" width="1.5" height="1.5"/><rect x="${x - 5}" y="${y - 3}" width="1.5" height="1.5"/></g>`

// A tool is drawn from the hand at (0,0) up to (0,-16); `swing` rotates it
// about the hand, 90 pointing right. Targets are in scene coordinates, where
// the hand sits at (39,25) and the ground at y=40.
export const JOBS: readonly Job[] = [
  {
    name: 'шахтёр',
    emoji: '⛏️',
    prop: '🪨',
    hat: `${dome('#f2c230')}<rect x="18" y="0" width="4" height="3" fill="#fff6a8"/>`,
    tool: `${HANDLE}<path d="M-8 -12 Q0 -21 8 -12 L7 -11 Q0 -17 -7 -11Z" fill="#9aa4ad"/>`,
    swing: '-25;80;-25',
    dur: '0.42s',
    target: `<path d="M51 40 L54 29 L61 24 L70 28 L74 40Z" fill="#8a8f98"/><path d="M60 31 l3 -3 l3 3 l-3 3Z" fill="#4dd0e1"/>${sparks(56, 22, '0.42s')}`,
  },
  {
    name: 'строитель',
    emoji: '🔨',
    prop: '🧱',
    hat: `${dome('#ff8c1a')}<rect x="6" y="8" width="28" height="2" fill="#e67300"/>`,
    tool: `${HANDLE}<rect x="-5" y="-19" width="10" height="5" fill="#7b8794"/>`,
    swing: '-10;75;-10',
    dur: '0.38s',
    target: [0, 1, 2]
      .map(
        r =>
          `<g fill="#c0563b" stroke="#f3e0d2" stroke-width="0.6"><rect x="${52 + (r % 2) * 3}" y="${34 - r * 6}" width="9" height="6"/><rect x="${61 + (r % 2) * 3}" y="${34 - r * 6}" width="9" height="6"/></g>`,
      )
      .join(''),
  },
  {
    name: 'маляр',
    emoji: '🖌️',
    prop: '🖼️',
    hat: '<ellipse cx="19" cy="7" rx="12" ry="4" fill="#8e2f4f"/><rect x="19" y="1" width="1.5" height="3" fill="#8e2f4f"/>',
    tool: `${HANDLE}<rect x="-2.5" y="-21" width="5" height="6" fill="#3fa7ff"/>`,
    swing: '40;85;40',
    dur: '0.6s',
    target:
      '<rect x="55" y="12" width="20" height="28" fill="#f4f1ea" stroke="#b8b2a7"/><rect x="56" y="13" width="18" height="0" fill="#3fa7ff"><animate attributeName="height" values="0;26;26" keyTimes="0;0.9;1" dur="3s" repeatCount="indefinite"/></rect>',
  },
  {
    name: 'программист',
    emoji: '⌨️',
    prop: '💻',
    hat: `<g fill="none" stroke="#4a5568" stroke-width="1.2"><rect x="10.5" y="11.5" width="8" height="8" rx="2"/><rect x="21.5" y="11.5" width="8" height="8" rx="2"/></g>`,
    tool: `<rect x="-1.5" y="-9" width="3" height="9" fill="${O}"/>`,
    swing: '95;115;95',
    dur: '0.14s',
    target: `<rect x="50" y="20" width="20" height="13" rx="1" fill="#2d3748"/><g fill="#7ee787"><rect x="52" y="23" width="9" height="1.2">${blink('1;0.35;1', '0.6s')}</rect><rect x="52" y="26" width="14" height="1.2">${blink('0.35;1;0.35', '0.9s')}</rect><rect x="52" y="29" width="6" height="1.2">${blink('1;1;0.35;1', '0.5s')}</rect></g><rect x="45" y="33" width="29" height="2.5" rx="1" fill="#a0aec0"/><rect x="44" y="35.5" width="32" height="4.5" fill="#8b5a2b"/>`,
  },
  {
    name: 'повар',
    emoji: '🍳',
    prop: '🔥',
    hat: '<g fill="#fff" stroke="#c9c9c9" stroke-width="0.6"><circle cx="14" cy="3" r="4"/><circle cx="26" cy="3" r="4"/><circle cx="20" cy="1" r="5"/><rect x="12" y="3" width="16" height="6"/></g>',
    tool: `<rect x="-1" y="-10" width="2" height="10" fill="#333"/><ellipse cx="0" cy="-15" rx="2.5" ry="6" fill="#444"/><ellipse cx="-3" cy="-15" rx="1.5" ry="4" fill="#f4c16b"><animate attributeName="cx" values="-3;-15;-3" dur="0.55s" repeatCount="indefinite"/></ellipse>`,
    swing: '90;75;90',
    dur: '0.55s',
    target: `<rect x="50" y="29" width="22" height="11" fill="#6b7280"/><rect x="50" y="29" width="22" height="2" fill="#374151"/><path d="M57 29 q2 -4 4 0 q2 -3 3 0Z" fill="#ff7a1a">${blink('1;0.75;1', '0.3s')}</path>`,
  },
  {
    name: 'лесоруб',
    emoji: '🪓',
    prop: '🌲',
    hat: `${dome('#c0392b')}<circle cx="20" cy="2" r="2.5" fill="#fff"/>`,
    tool: `${HANDLE}<path d="M1 -18 L9 -20 L9 -11 L1 -13Z" fill="#b0b7bf"/>`,
    swing: '-20;85;-20',
    dur: '0.45s',
    target: `<circle cx="62" cy="10" r="10" fill="#3f9b4b"/><circle cx="70" cy="15" r="7" fill="#4caf50"/><rect x="58" y="14" width="7" height="26" fill="#8b5a2b"/><g fill="#d9a066" opacity="0">${flash('0.45s')}<rect x="52" y="20" width="2" height="1.5"/><rect x="54" y="16" width="2" height="1.5"/></g>`,
  },
  {
    name: 'садовник',
    emoji: '💧',
    prop: '🌷',
    hat: '<ellipse cx="20" cy="8" rx="17" ry="2.5" fill="#e2c275"/><path d="M12 8 Q20 -3 28 8Z" fill="#d4b062"/>',
    tool: '<rect x="-4" y="-15" width="9" height="9" rx="1" fill="#5aa9e6"/><path d="M-3 -14 L-9 -19" stroke="#5aa9e6" stroke-width="2"/>',
    swing: '95;125;125;95',
    dur: '1.1s',
    target: `<g fill="#5aa9e6"><circle cx="60" cy="22" r="1"><animate attributeName="cy" values="20;36" dur="0.35s" repeatCount="indefinite"/></circle><circle cx="63" cy="26" r="1"><animate attributeName="cy" values="20;36" dur="0.35s" begin="0.17s" repeatCount="indefinite"/></circle></g><rect x="61" y="30" width="2" height="10" fill="#4caf50"/><path d="M62 35 q5 -3 6 1" fill="#4caf50"/><circle cx="62" cy="29" r="3" fill="#e91e63"><animate attributeName="r" values="1.5;4.5;1.5" dur="2.4s" repeatCount="indefinite"/></circle>`,
  },
  {
    name: 'кузнец',
    emoji: '⚒️',
    prop: '🔥',
    hat: '<rect x="6" y="8" width="28" height="3.5" fill="#333"/><path d="M6 9 l-4 -2 l1 5Z" fill="#333"/>',
    tool: `${HANDLE}<rect x="-6" y="-20" width="12" height="6" fill="#4a4a4a"/>`,
    swing: '-15;78;-15',
    dur: '0.34s',
    target: `<path d="M50 29 H74 L69 34 H65 V37 H71 V40 H53 V37 H59 V34 H55Z" fill="#555"/><rect x="54" y="27" width="13" height="2" fill="#ff7a1a"/>${sparks(60, 22, '0.34s')}`,
  },
  {
    name: 'рыбак',
    emoji: '🎣',
    prop: '🐟',
    hat: `${dome('#5f8d4e')}<rect x="5" y="8" width="30" height="2" fill="#4b7340"/>`,
    tool: '<rect x="-0.6" y="-26" width="1.2" height="26" fill="#8b5a2b"/>',
    swing: '50;56;50',
    dur: '0.9s',
    target: `<path d="M60 9 L64 34" stroke="#999" stroke-width="0.5"/><circle cx="64" cy="34" r="1.6" fill="#e53935"><animate attributeName="cy" values="33.5;35;33.5" dur="0.9s" repeatCount="indefinite"/></circle><rect x="46" y="35" width="36" height="5" fill="#4aa3df" opacity="0.75"/><path d="M0 0 q4 -3 8 0 q-4 3 -8 0 M8 0 l3 -2 v4Z" fill="#ffb74d"><animateMotion path="M48 44 Q60 14 76 44" dur="1.8s" repeatCount="indefinite"/></path>`,
  },
  {
    name: 'учёный',
    emoji: '🧪',
    prop: '⚗️',
    hat: `<g fill="#bdeff5" stroke="#26a5b5" stroke-width="1.4"><rect x="10.5" y="11.5" width="8" height="8" rx="3"/><rect x="21.5" y="11.5" width="8" height="8" rx="3"/></g><rect x="6" y="14" width="28" height="1.5" fill="#26a5b5" opacity="0.6"/>`,
    tool: '<path d="M-2 -17 h4 v5 l5 9 h-14 l5 -9Z" fill="#7ed957" stroke="#3d8b2f" stroke-width="0.6"/>',
    swing: '25;45;25',
    dur: '0.3s',
    target: `<rect x="52" y="34" width="24" height="6" fill="#8b5a2b"/><g fill="#b388ff" stroke="#7e57c2" stroke-width="0.5"><rect x="56" y="24" width="3" height="10"/><rect x="62" y="24" width="3" height="10"/><rect x="68" y="24" width="3" height="10"/></g><g fill="#7ed957">${[57, 63, 69]
      .map(
        (x, i) =>
          `<circle cx="${x}" cy="22" r="1.3"><animate attributeName="cy" values="23;8" dur="0.8s" begin="${i * 0.27}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="0.8s" begin="${i * 0.27}s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}</g>`,
  },
  {
    name: 'доктор',
    emoji: '💉',
    prop: '🐛',
    hat: '<rect x="11" y="2" width="18" height="7" rx="2" fill="#fff" stroke="#c9c9c9" stroke-width="0.6"/><path d="M19 3.5 h2 v1.5 h1.5 v2 h-1.5 v1.5 h-2 v-1.5 h-1.5 v-2 h1.5Z" fill="#e53935"/>',
    tool: '<rect x="-2" y="-12" width="4" height="10" fill="#e0f7fa" stroke="#78909c" stroke-width="0.6"/><rect x="-0.4" y="-18" width="0.8" height="6" fill="#78909c"/>',
    swing: '80;80;100;80',
    dur: '0.7s',
    target: `<rect x="52" y="35" width="24" height="5" fill="#cfd8dc"/><ellipse cx="65" cy="31" rx="8" ry="5" fill="#6ab04c"/><circle cx="60" cy="30" r="1" fill="${D}"/><path d="M63 27 l6 8" stroke="#fff" stroke-width="2"/><path d="M70 14 h3 v3 h3 v3 h-3 v3 h-3 v-3 h-3 v-3 h3Z" fill="#e53935">${blink('1;0.55;1', '0.7s')}</path>`,
  },
  {
    name: 'пожарный',
    emoji: '💦',
    prop: '🔥',
    hat: `${dome('#d32f2f')}<rect x="5" y="8" width="30" height="2" fill="#b71c1c"/><rect x="18" y="2" width="4" height="4" fill="#ffd54a"/>`,
    tool: '<rect x="-2" y="-11" width="4" height="11" fill="#555"/><rect x="-1.2" y="-14" width="2.4" height="3" fill="#ffd54a"/>',
    swing: '65;75;65',
    dur: '0.45s',
    target: `<path d="M52 20 Q62 12 70 30" stroke="#4aa3df" stroke-width="2.2" fill="none" stroke-dasharray="3 2"><animate attributeName="stroke-dashoffset" values="10;0" dur="0.25s" repeatCount="indefinite"/></path><path d="M68 40 Q61 32 67 23 Q70 30 73 26 Q80 34 75 40Z" fill="#ff6b1a">${blink('1;0.8;1', '0.25s')}</path><path d="M70 40 Q67 35 70 31 Q74 35 72 40Z" fill="#ffd54a"/>`,
  },
  {
    name: 'астроном',
    emoji: '🔭',
    prop: '⭐',
    hat: '<path d="M10 9 L24 -8 L30 9Z" fill="#3949ab"/><circle cx="24" cy="-8" r="2" fill="#ffd54a"/>',
    tool: '<rect x="-2" y="-12" width="4" height="12" fill="#607d8b"/><rect x="-3" y="-20" width="6" height="8" fill="#90a4ae"/>',
    swing: '35;50;35',
    dur: '2.2s',
    target: `<path d="M41 27 L36 40 M41 27 L47 40" stroke="#607d8b" stroke-width="1"/><g fill="#ffd54a">${[
      { x: 58, y: 8 },
      { x: 70, y: 4 },
      { x: 76, y: 14 },
      { x: 64, y: 18 },
    ]
      .map(
        ({ x, y }, i) =>
          `<path d="M${x} ${y - 2.5} l1 1.5 l1.5 1 l-1.5 1 l-1 1.5 l-1 -1.5 l-1.5 -1 l1.5 -1Z">${blink('1;0.45;1', '1s', `${i * 0.25}s`)}</path>`,
      )
      .join('')}</g>`,
  },
  {
    name: 'музыкант',
    emoji: '🎸',
    prop: '🎶',
    hat: '<path d="M6 15 Q20 -6 34 15" stroke="#333" stroke-width="2" fill="none"/><rect x="3" y="12" width="4" height="8" rx="1.5" fill="#333"/><rect x="33" y="12" width="4" height="8" rx="1.5" fill="#333"/>',
    tool: '<rect x="-1" y="-20" width="2" height="16" fill="#8b5a2b"/><ellipse cx="0" cy="0" rx="5" ry="6.5" fill="#d35400"/><circle cx="0" cy="-1" r="1.6" fill="#5b2a00"/>',
    swing: '-50;-42;-50',
    dur: '0.2s',
    target: `<g fill="#9c6bff" font-size="9">${[0, 1, 2]
      .map(
        i =>
          `<text x="${50 + i * 10}" y="30">${i % 2 ? '♫' : '♪'}<animate attributeName="y" values="32;6" dur="1.1s" begin="${i * 0.37}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.1s" begin="${i * 0.37}s" repeatCount="indefinite"/></text>`,
      )
      .join('')}</g>`,
  },
  {
    name: 'детектив',
    emoji: '🔍',
    prop: '👣',
    hat: '<ellipse cx="20" cy="8" rx="16" ry="2.2" fill="#6d4c41"/><path d="M11 8 Q12 -1 20 1 Q28 -1 29 8Z" fill="#795548"/><rect x="11" y="5.5" width="18" height="2" fill="#3e2723"/>',
    tool: '<rect x="-1" y="-11" width="2" height="11" fill="#555"/><circle cx="0" cy="-16" r="5" fill="#bde0fe" fill-opacity="0.5" stroke="#555" stroke-width="1.5"/>',
    swing: '75;110;75',
    dur: '1.1s',
    target: `<g fill="#8d6e63"><ellipse cx="54" cy="38" rx="3" ry="1.5"/><ellipse cx="62" cy="36" rx="3" ry="1.5"/><ellipse cx="70" cy="38" rx="3" ry="1.5"/></g><text x="66" y="24" font-size="12" fill="#e53935">?${blink('1;0.45;1', '0.8s')}</text>`,
  },
]

type Pose = {
  hat?: string
  hand?: string
  leftHand?: string
  legs?: 'walk' | 'tap'
  isBobbing?: boolean
  // Drawn behind the body: a tool carried on the back.
  back?: string
}

const OUCH_EYES = `<g stroke="${D}" stroke-width="1.6" fill="none"><path d="M12 13 l4 3 l-4 3"/><path d="M28 13 l-4 3 l4 3"/></g>`
const EYES = `<rect x="13" y="13" width="3" height="6" fill="${D}"/><rect x="24" y="13" width="3" height="6" fill="${D}"/>`

// The mascot in a 40x32 box, feet on y=32, right hand at (37,17). Its walk,
// bob and tap step between frames, as a 16-bit sprite does.
const claude = (pose: Pose = {}) => {
  const leg = (x: number, i: number) => {
    const walk =
      pose.legs === 'walk'
        ? `<animate attributeName="height" values="${i % 2 ? '6;3' : '3;6'}" dur="0.2s" calcMode="discrete" repeatCount="indefinite"/>`
        : ''
    const tap =
      pose.legs === 'tap' && i === 3
        ? rot(`0 ${x + 1.5} 26;-30 ${x + 1.5} 26`, '0.3s', 'calcMode="discrete" repeatCount="indefinite"')
        : ''

    return `<rect x="${x}" y="26" width="3" height="6" fill="${O}">${walk}${tap}</rect>`
  }
  const bob = pose.isBobbing
    ? move('0,0;0,-1', '0.3s', 'calcMode="discrete" repeatCount="indefinite"')
    : ''

  return `<g>${bob}${pose.back ?? ''}${[9, 14, 23, 28].map(leg).join('')}<rect x="6" y="8" width="28" height="18" fill="${O}"/>${pose.leftHand ?? `<rect x="2" y="15" width="4" height="5" fill="${O}"/>`}${pose.hand ?? `<rect x="34" y="15" width="4" height="5" fill="${O}"/>`}${EYES}${pose.hat ?? ''}</g>`
}

const hand = (inner: string) => `<g transform="translate(37,17)"><g>${inner}</g></g>`
const arm = (length: number) =>
  `<rect x="-1.5" y="${-length}" width="3" height="${length}" fill="${O}"/>`
const STUB = `<rect x="-3" y="-2" width="4" height="5" fill="${O}"/>`

// A swing of three angles strikes fast and winds back slow.
const swing = (job: Job) =>
  job.swing.split(';').length === 3
    ? rot(job.swing, job.dur, `keyTimes="0;${STRIKE};1" repeatCount="indefinite"`)
    : rot(job.swing, job.dur)

// The mascot of a worker scene, tool in hand.
const workerBody = (job: Job) =>
  `<g transform="translate(2,8)">${claude({ hat: job.hat, hand: hand(swing(job) + job.tool), isBobbing: true })}</g>`

// The 84x44 scene of one worker: the mascot at the left, its target right,
// `near` units closer.
const worker = (job: Job, near = 0) =>
  workerBody(job) + (near === 0 ? job.target : `<g transform="translate(${-near},0)">${job.target}</g>`)

const svg = (width: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 46" width="${width * SCALE}" height="${46 * SCALE}">${body}</svg>`

// One unit of a drawing in pixels.
export const SCALE = 1.6 / 1.5
export const HEIGHT = 46
export const MAIN_WIDTH = 112
export const WAIT_WIDTH = 58
export const MINI_WIDTH = 54

export const WHIP_MS = 300

export const jobOf = (index: number): Job => JOBS[index % JOBS.length] ?? (JOBS[0] as Job)

export const working = (job: Job) => svg(MAIN_WIDTH, worker(job))

// Watch time: the arm with the watch is up for a glance every 7-8 seconds.
const LOOK = { keyTimes: '0;0.36;0.46;0.84;0.92', dur: '16s' }
const lookOpacity = (shown: string, hidden: string) =>
  `<animate attributeName="opacity" values="${hidden};${shown};${hidden};${shown};${hidden}" keyTimes="${LOOK.keyTimes}" calcMode="discrete" dur="${LOOK.dur}" repeatCount="indefinite"/>`

// Stands still and taps a foot; now and then glances at the watch.
// A tool slung on the back: behind the body, leaning back only a little so
// even a long rod or a wide head stays inside the drawing.
const onBack = (job: Job) =>
  `<g transform="translate(10,18) rotate(-20) scale(0.8)">${job.tool}</g>`

// The profession worn when the hands are busy: its hat, and its tool on the
// back.
const gear = (job?: Job) => (job === undefined ? {} : { hat: job.hat, back: onBack(job) })

// The whip held ready, in hand coordinates: its handle up and forward, clear
// of the face, the lash hanging in a loop in front. The lash's own drawing
// swings the handle from this same angle.
export const HELD_ANGLE = 25
const HELD_WHIP = `<g transform="rotate(${HELD_ANGLE})"><rect x="-1" y="-9" width="2" height="9" fill="#5b3a1e"/></g><path d="M3.8 -8.2 Q9 -4 7 3 Q5 9 10 11" stroke="#5b3a1e" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
// The same in the left hand, hanging close so it stays inside the drawing.
const LEFT_WHIP = `<g transform="rotate(-20)"><rect x="-1" y="-9" width="2" height="9" fill="#5b3a1e"/></g><path d="M-3 -8.5 Q-6 -3 -4 3 Q-2 8 -5 10" stroke="#5b3a1e" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
const LEFT_STUB = `<rect x="-2" y="-2" width="4" height="5" fill="${O}"/>`

// Waits with the whip ready in its right hand and taps a foot; now and then
// raises its left wrist to glance at the watch.
// `lashAt`: when (in seconds of this drawing) the held whip is swung: it
// leaves the hand for the swing, which the lash's own drawing shows.
const waitingBody = (job?: Job, lashAt?: number) => {
  const watch = `<g opacity="0">${lookOpacity('1', '0')}<g transform="rotate(35)">${arm(10)}<rect x="-2.2" y="-7" width="4.4" height="3" fill="#222"/><rect x="-1.2" y="-6.3" width="2.4" height="1.6" fill="#9be7ff"/></g></g>`
  const stub = `<g>${lookOpacity('0', '1')}${LEFT_STUB}</g>`

  return `<g transform="translate(2,8)">${claude({
    ...gear(job),
    legs: 'tap',
    leftHand: `<g transform="translate(4,17)">${stub}${watch}</g>`,
    hand: `<g transform="translate(37,17)">${STUB}<g>${lashAt === undefined ? '' : `<set attributeName="opacity" to="0" begin="${lashAt.toFixed(2)}s" dur="${(HIT * 2.5).toFixed(2)}s"/>`}${HELD_WHIP}</g></g>`,
  })}</g><text x="45" y="18" font-size="9" fill="#888" opacity="0">…${lookOpacity('1', '0')}</text>`
}

export const waiting = (job?: Job, lashAt?: number) => svg(MAIN_WIDTH, waitingBody(job, lashAt))

// The handoff, in seconds: works on to the end of its own task, shows a
// tick, then calls the minis through a megaphone; they climb out at CALL_MS.
const HANDOFF = { tick: 0.5, call: 0.8, end: 1.8 }
export const FINISH_MS = HANDOFF.end * 1000
export const CALL_MS = 1000

const MEGAPHONE = `<rect x="-2" y="-2" width="3" height="4" fill="#555"/><path d="M1 -2 L9 -6 L9 6 L1 2Z" fill="#e53935"/><rect x="8" y="-6" width="1.5" height="12" fill="#b71c1c"/>`
const callWaves = () =>
  [0, 1, 2]
    .map(
      i =>
        `<path d="M${52 + i * 5} ${18 - i * 2} q${4 + i} ${7 + i * 2} 0 ${14 + i * 4}" stroke="#D97757" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="0.45s" begin="${(i * 0.12).toFixed(2)}s" repeatCount="indefinite"/></path>`,
    )
    .join('')

// Hands the work over. `left` is the seconds of it still to play, for a
// drawing loaded part way through: phases already past are left out.
export const finishing = (job: Job, left: number) => {
  const elapsed = HANDOFF.end - left
  const phase = (from: number, to: number | undefined, body: string) => {
    if (to !== undefined && to - elapsed <= 0) return ''
    const on = Math.max(0, from - elapsed)
    const off = to === undefined ? '' : `<set attributeName="opacity" to="0" begin="${(to - elapsed).toFixed(2)}s" fill="freeze"/>`

    return `<g opacity="0"><set attributeName="opacity" to="1" begin="${on.toFixed(2)}s" fill="freeze"/>${off}${body}</g>`
  }
  const still = (hand?: string, leftHand?: string) =>
    `<g transform="translate(2,8)">${claude({ ...gear(job), ...(hand === undefined ? {} : { hand }), ...(leftHand === undefined ? {} : { leftHand }) })}</g>`

  return svg(
    MAIN_WIDTH,
    phase(0, HANDOFF.tick, worker(job)) +
      phase(HANDOFF.tick, HANDOFF.call, `${still()}${job.target}<text x="58" y="14" font-size="12" fill="#3fa34d">✔</text>`) +
      phase(
        HANDOFF.call,
        HANDOFF.end,
        `${still(
          hand(`<g transform="rotate(90)"><g transform="rotate(-90)">${MEGAPHONE}</g></g>`),
          // Calling with the megaphone, it already has the whip in hand.
          `<g transform="translate(4,17)">${LEFT_STUB}${LEFT_WHIP}</g>`,
        )}${callWaves()}<text x="70" y="14" font-size="11" font-weight="bold" fill="#D97757">!!<animate attributeName="opacity" values="1;0.4;1" dur="0.3s" repeatCount="indefinite"/></text>`,
      ) +
      phase(HANDOFF.end, undefined, waitingBody(job)),
  )
}

export const saluting = (job?: Job) =>
  svg(
    MAIN_WIDTH,
    `<g transform="translate(2,8)"><g>${move('0,0;0,-5;0,0', '0.25s', 'begin="0.25s"')}${claude({
      ...gear(job),
      hand: hand(`${rot('90;-40', '0.15s', 'fill="freeze"')}${arm(12)}`),
    })}</g></g><text x="46" y="20" font-size="11" opacity="0">✨<animate attributeName="opacity" values="0;1;0.4;1" dur="0.6s" begin="0.25s" fill="freeze"/></text>`,
  )

const MINI = 'translate(0,20.8) scale(0.6)'
// Facing left, toward the main mascot.
const MINI_BACK = 'translate(24,20.8) scale(-0.6,0.6)'
const DESK = 10
const NEAR = 6

const atDesk = (inner: string, x = 0) =>
  `<g transform="translate(${x + DESK},20.8) scale(0.6)"><g transform="translate(-2,-8)">${inner}</g></g>`

// At its desk, its target close by.
export const miniAtDesk = (job: Job) => svg(MINI_WIDTH, atDesk(worker(job, NEAR)))

// Climbs out from under the prompt, takes the task sheet, walks right,
// works; `delay` seconds after the drawing loads (the main mascot is still
// finishing its own task until then).
export const miniWorking = (job: Job, delay = 0) => {
  const at = (s: number) => `${(s + delay).toFixed(2)}s`

  return svg(
    MINI_WIDTH,
    `<rect y="24" width="5" height="6" fill="#fff" stroke="#999" stroke-width="0.5" opacity="0"><set attributeName="opacity" to="1" begin="${at(0.3)}"/><set attributeName="opacity" to="0" begin="${at(0.55)}"/><animate attributeName="x" values="-6;18" begin="${at(0.3)}" dur="0.25s" fill="freeze"/></rect>` +
      `<g${delay > 0 ? ' opacity="0"' : ''}>${delay > 0 ? `<set attributeName="opacity" to="1" begin="${at(0)}"/>` : ''}<set attributeName="opacity" to="0" begin="${at(1.1)}"/><g transform="translate(0,30)">${move(`0,30;0,0;0,0;${DESK},0`, '1.1s', `begin="${at(0)}" keyTimes="0;0.27;0.55;1" fill="freeze"`)}<g transform="${MINI}">${claude(
        {
          legs: 'walk',
          hand: `${STUB.replace('x="-3" y="-2"', 'x="34" y="15"')}<rect x="36" y="9" width="7" height="9" fill="#fff" stroke="#999" stroke-width="0.8" opacity="0"><set attributeName="opacity" to="1" begin="${at(0.55)}"/></rect>`,
        },
      )}</g></g></g>` +
      `<g opacity="0"><set attributeName="opacity" to="1" begin="${at(1.1)}"/>${atDesk(worker(job, NEAR))}</g>`,
  )
}

// Its slot, empty while the overlay walks it home.
export const miniGone = () => svg(MINI_WIDTH, '')

// Where a mini walking home stops: right up against the main mascot.
const HOME_X = 41
const WALK_SPEED = 150
const SALUTE_S = 0.6
const DROP_S = 0.4

// The x a mini starts its walk home from, its slot's desk, `gap` units
// between the main mascot and the first slot.
export const deskX = (slot: number, gap = 0) => MAIN_WIDTH + gap + slot * MINI_WIDTH + DESK

// How long its walk home, salute and jump take, in milliseconds.
export const leaveMs = (fromX: number) =>
  Math.round(((fromX - HOME_X) / WALK_SPEED + SALUTE_S + DROP_S) * 1000)

// Turns to the main mascot, walks right up to it, salutes and jumps under
// the prompt. Drawn on the overlay across the row, `elapsed` seconds in.
const walkingHome = (fromX: number, elapsed: number, job: Job) => {
  const total = leaveMs(fromX) / 1000
  const walk = (fromX - HOME_X) / WALK_SPEED
  const k = (t: number) => (t / total).toFixed(3)
  const begin = `begin="${(-elapsed).toFixed(2)}s"`

  return `<g transform="translate(${fromX},0)"><animateTransform attributeName="transform" type="translate" values="${fromX},0;${HOME_X},0;${HOME_X},0;${HOME_X},-9;${HOME_X},40" keyTimes="0;${k(walk)};${k(walk + SALUTE_S)};${k(walk + SALUTE_S + 0.12)};1" dur="${total}s" ${begin} fill="freeze"/><g transform="${MINI_BACK}">${claude(
    {
      legs: 'walk',
      // Its hat on and its tool on its back: the profession plain to see.
      ...gear(job),
      hand: hand(
        `<animateTransform attributeName="transform" type="rotate" values="90;90;-40;-40" keyTimes="0;${k(walk)};${k(walk + 0.1)};1" dur="${total}s" ${begin} fill="freeze"/>${arm(12)}`,
      ),
    },
  )}</g></g>`
}

// The lash lands at HIT, and the whole crack is over by twice that.
const HIT = 0.12
const LASH = 'stroke="#5b3a1e" stroke-width="1.4" fill="none" stroke-linecap="round"'
const shown = (from: number, dur: number) =>
  `<set attributeName="opacity" to="1" begin="${from}s" dur="${dur}s"/>`
// Seen only while it cracks: at rest it is a point, which a round cap
// would leave on screen as a dot.
const lashPath = (rest: string, struck: string) =>
  `<path ${LASH} d="${rest}" opacity="0"><set attributeName="opacity" to="1" begin="0s" dur="${HIT * 2.5}s"/><animate attributeName="d" values="${rest};${struck};${rest}" keyTimes="0;0.5;1" dur="${HIT * 2.5}s"/></path>`
// Shut eyes over the open ones for a moment: the actor's own drawing is
// left alone, so it neither jumps nor starts its animation over.
// How long a lash hurts; a click within it keeps the pain on unbroken.
export const PAIN_MS = (HIT + 0.45) * 1000
// The person's own whip, swung from their hand at `from` (a fist there)
// onto the main mascot, the way the main mascot swings its own at the minis.
const thrown = (from: { x: number; y: number }) =>
  `<circle cx="${from.x.toFixed(1)}" cy="${from.y.toFixed(1)}" r="2.2" fill="#5b3a1e" opacity="0">${shown(0, HIT * 2.5)}</circle>` +
  swungWhip(from, { x: 36, y: 30 }, Math.max(2, Math.min(from.y, 30) - 18), from.x >= 36 ? -1 : 1)

const ouch = (transform: string, isStreak: boolean) =>
  `<g transform="${transform}" opacity="0">${isStreak ? shown(0, HIT + 0.45) : shown(HIT, 0.45)}<rect x="11" y="11" width="18" height="10" fill="${O}"/>${OUCH_EYES}</g>`
const crack = (x: number, y: number, size: number) =>
  `<text x="${x}" y="${y}" font-size="${size}" opacity="0">💥${shown(HIT, 0.3)}</text>`

export type Stage = { mainWidth: number; minis: readonly { isBusy: boolean }[] }

export const stageWidth = (stage: Stage) => stage.mainWidth + stage.minis.length * MINI_WIDTH

// The whip's drawing: the stage, and as far right as a click it is swung
// from, the handle's wind back included.
export const fxWidth = (stage: Stage, from?: { x: number }) =>
  Math.max(stageWidth(stage), Math.ceil((from?.x ?? 0) + 12))

// A transparent drawing laid over the whole row. With no lash it is empty;
// with one (`n` numbering the click, so each click plays anew) the main
// mascot cracks the whip once over every busy mini, or takes it itself.
// A whip swung from a hand at `hand`: its handle winds back, strikes and
// returns to the hold, and the lash leaves from the handle's tip at every
// step of the swing, arcing up to `arch` and out to `target`. `side` is the
// way it strikes: 1 to the right, -1 to the left.
const swungWhip = (hand: { x: number; y: number }, target: { x: number; y: number }, arch: number, side: 1 | -1) => {
  const dur = `${HIT * 2.5}s`
  // From where it is held: a wind back, the strike, and back to the hold.
  const steps = [
    { angle: HELD_ANGLE, reach: 0 },
    { angle: -45, reach: 0 },
    { angle: 80, reach: 1 },
    { angle: 40, reach: 0.4 },
    { angle: HELD_ANGLE, reach: 0 },
  ].map(step => ({ ...step, angle: step.angle * side }))
  const keyTimes = '0;0.3;0.55;0.8;1'
  const lerp = (a: number, b: number, k: number) => (a + (b - a) * k).toFixed(1)
  const paths = steps.map(({ angle, reach }) => {
    const rad = (angle * Math.PI) / 180
    const x = hand.x + 9 * Math.sin(rad)
    const y = hand.y - 9 * Math.cos(rad)

    return `M${x.toFixed(1)} ${y.toFixed(1)} Q${lerp(x, (x + target.x) / 2, reach)} ${lerp(y, arch, reach)} ${lerp(x, target.x, reach)} ${lerp(y, target.y, reach)}`
  })

  return (
    `<g transform="translate(${hand.x.toFixed(1)},${hand.y.toFixed(1)})" opacity="0">${shown(0, HIT * 2.5)}<g>${rot(steps.map(step => step.angle).join(';'), dur, `keyTimes="${keyTimes}"`)}<rect x="-1" y="-9" width="2" height="9" fill="#5b3a1e"/></g></g>` +
    `<path ${LASH} d="${paths[0]}" opacity="0"><set attributeName="opacity" to="1" begin="0s" dur="${dur}"/><animate attributeName="d" values="${paths.join(';')}" keyTimes="${keyTimes}" dur="${dur}"/></path>`
  )
}

// The main mascot's whip, from its hand at (39,25) out over the minis to
// `end`.
const crewWhip = (end: number) => swungWhip({ x: 39, y: 25 }, { x: end, y: 34 }, 0, 1)

export type Leaver = { fromX: number; elapsed: number; job: Job }

// The overlay across the whole row: the minis walking home, and a fresh lash.
export const stageFx = (
  stage: Stage,
  lash:
    | { n: number; kind: 'minis' | 'self'; isStreak: boolean; elapsed: number; from?: { x: number; y: number } }
    | undefined,
  leavers: readonly Leaver[],
) => {
  const width = fxWidth(stage, lash?.kind === 'self' ? lash.from : undefined)
  const home = leavers.map(one => walkingHome(one.fromX, one.elapsed, one.job)).join('')
  if (lash === undefined) return svg(width, home)
  // Loaded again part way through, the lash goes on from where it was rather
  // than cracking a second time.
  const at = (markup: string) => shiftTime(markup, lash.elapsed)
  if (lash.kind === 'self' && lash.from !== undefined) {
    return svg(
      width,
      `${home}${at(`<g id="lash${lash.n}">${thrown(lash.from)}${ouch('translate(2,8)', lash.isStreak)}${crack(17, 15, 10)}</g>`)}`,
    )
  }
  if (lash.kind === 'self') {
    return svg(
      width,
      `${home}${at(`<g id="lash${lash.n}">${lashPath(`M${stage.mainWidth} 45 Q${stage.mainWidth} 45 ${stage.mainWidth} 45`, `M${stage.mainWidth} 45 Q70 47 36 30`)}${ouch('translate(2,8)', lash.isStreak)}${crack(17, 15, 10)}</g>`)}`,
    )
  }
  const busy = stage.minis.flatMap((mini, i) => (mini.isBusy ? [stage.mainWidth + i * MINI_WIDTH] : []))
  const end = (busy[busy.length - 1] ?? stage.mainWidth) + DESK + 3
  const hits = busy
    .map(x => `${ouch(`translate(${x + DESK},20.8) scale(0.6)`, lash.isStreak)}${crack(x + DESK + 4, 19, 8)}`)
    .join('')

  return svg(width, `${home}${at(`<g id="lash${lash.n}">${crewWhip(end)}${hits}</g>`)}`)
}

// A drawing made `width` units wide, what it shows kept at its left: the
// room the minis keep from the main mascot. A picture is laid out as wide as
// its own markup says, where a blank spacer beside it may take no room.
export const widen = (markup: string, width: number) =>
  markup.replace(/viewBox="0 0 [\d.]+ 46" width="[\d.]+"/, `viewBox="0 0 ${width} 46" width="${width * SCALE}"`)

// The terminal's drawing: block glyphs, three rows an actor, two frames.
const BIG = [' ▐▛███▜▌', '▝▜█████▛▘', '  ▘▘ ▝▝'] as const
const SMALL = ['▐▛▜▌', ' ▘▝'] as const

export type TermPose = 'work' | 'wait' | 'salute' | 'whip' | 'ouch'

export const termMain = (pose: TermPose, job: Job, isOdd: boolean): string[] => {
  const beside: Record<TermPose, [string, string]> = {
    work: isOdd ? ['', ` ${job.emoji}${job.prop}`] : [` ${job.emoji}`, `   ${job.prop}`],
    wait: isOdd ? [' ⌚', ''] : ['', ' ⌚'],
    salute: [' 🫡', ''],
    whip: isOdd ? ['', ' ～～～💥'] : [' ～', ''],
    ouch: isOdd ? [` 💢${job.emoji}`, `   ${job.prop}`] : ['', `💥${job.emoji}${job.prop}`],
  }
  const feet = pose === 'wait' && isOdd ? '  ▘▘ ▝▘' : BIG[2]

  return [BIG[0] + beside[pose][0], BIG[1] + beside[pose][1], feet]
}

export const termMini = (pose: TermPose, job: Job, isOdd: boolean): string[] => {
  if (pose === 'salute') return ['  🫡', SMALL[0], SMALL[1]]
  if (pose === 'ouch') {
    return isOdd
      ? [`💥${SMALL[0]}${job.emoji}`, `  ${SMALL[1]}  ${job.prop}`, '']
      : ['', `  ${SMALL[0]}${job.emoji}${job.prop}`, `  ${SMALL[1]}`]
  }

  return isOdd
    ? ['', `${SMALL[0]}${job.emoji}${job.prop}`, SMALL[1]]
    : [`    ${job.emoji}`, `${SMALL[0]}  ${job.prop}`, SMALL[1]]
}

// Comes up from under the prompt with a hop, `elapsed` seconds in.
export const ENTER_MS = 500
export const rising = (drawing: string, elapsed: number) => {
  const open = drawing.indexOf('>') + 1

  return `${drawing.slice(0, open)}<g><animateTransform attributeName="transform" type="translate" values="0,46;0,-6;0,0" keyTimes="0;0.65;1" dur="${ENTER_MS / 1000}s" begin="${(-elapsed).toFixed(2)}s" fill="freeze"/>${drawing.slice(open, -'</svg>'.length)}</g></svg>`
}

// Hops and drops under the prompt, `elapsed` seconds in.
export const EXIT_MS = 600
export const jumpingDown = (elapsed: number, job?: Job) =>
  svg(
    MAIN_WIDTH,
    `<g transform="translate(2,8)"><g><animateTransform attributeName="transform" type="translate" values="0,0;0,-8;0,48" keyTimes="0;0.3;1" dur="${EXIT_MS / 1000}s" begin="${(-elapsed).toFixed(2)}s" fill="freeze"/>${claude(gear(job))}</g></g>`,
  )

// The drawing `seconds` into its animation: every animation begins that much
// earlier, so a drawing loaded again carries on where it was.
export const shiftTime = (drawing: string, seconds: number) => {
  if (!(seconds > 0)) return drawing
  const earlier = (begin: string) =>
    begin
      .split(';')
      .map(part => (/^-?[0-9.]+s$/.test(part.trim()) ? `${(parseFloat(part) - seconds).toFixed(2)}s` : part))
      .join(';')

  return drawing.replace(
    /<(animate|animateTransform|animateMotion|set)\b([^>]*?)(\/?)>/g,
    (_tag, name: string, attrs: string, close: string) =>
      /\bbegin="/.test(attrs)
        ? `<${name}${attrs.replace(/\bbegin="([^"]*)"/, (_b, begin: string) => `begin="${earlier(begin)}"`)}${close}>`
        : `<${name}${attrs} begin="${(-seconds).toFixed(2)}s"${close}>`,
  )
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Words into at most `maxLines` lines of `width` characters; an ellipsis
// ends what does not fit.
const wrapWords = (text: string, width: number, maxLines: number) => {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line === '' ? word : `${line} ${word}`
    if (next.length <= width) {
      line = next
      continue
    }
    if (line !== '') lines.push(line)
    line = word.length > width ? `${word.slice(0, width - 1)}…` : word
  }
  if (line !== '') lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  const last = kept[maxLines - 1] ?? ''
  kept[maxLines - 1] = `${last.slice(0, width - 1)}…`

  return kept
}

// A comic speech bubble beside a mini's head: one line, starting just right
// of the mini and no taller than its slot (the band clips anything higher),
// its tail down-left to the top of the head. Drawn in pixels from the slot's
// bottom-left corner, clear everywhere but the bubble.
export const speechBubble = (text: string, lift = 5) => {
  const font = 12
  const charWidth = 6.6
  const line = wrapWords(text, 56, 1)[0] ?? ''
  const bubbleW = Math.round(Math.max(4, line.length) * charWidth + 22)
  const bubbleH = 22
  // `lift`: how far above the slot's top it rides, into the band's padding,
  // when hung from the slot's bottom (its height is the slot's and this);
  // 0 when hung from the slot's top.
  const left = Math.round((DESK + 0.6 * 34) * SCALE)
  const tipX = (DESK + 0.6 * 30) * SCALE
  const tipY = lift + (20.8 + 0.6 * 9) * SCALE
  const width = left + bubbleW + 2
  const height = Math.ceil(HEIGHT * SCALE + lift)
  const baseY = 1 + bubbleH
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<path d="M${left + 6} ${baseY - 1} L${tipX.toFixed(1)} ${tipY.toFixed(1)} L${left + 18} ${baseY - 1}Z" fill="#fff" stroke="#1f1f1f" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<rect x="${left}" y="1" width="${bubbleW}" height="${bubbleH}" rx="11" fill="#fff" stroke="#1f1f1f" stroke-width="1.6"/>` +
    `<rect x="${left + 7}" y="${baseY - 2.2}" width="10" height="3" fill="#fff"/>` +
    `<text x="${left + 11}" y="${1 + bubbleH / 2 + font / 2 - 2}" font-size="${font}" font-family="-apple-system, 'Helvetica Neue', sans-serif" fill="#1f1f1f">${escapeXml(line)}</text>` +
    '</svg>'

  return { source, width, height }
}


