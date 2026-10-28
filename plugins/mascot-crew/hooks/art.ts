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
  {
    name: 'пекарь',
    emoji: '🥖',
    prop: '🍞',
    hat: '<ellipse cx="22" cy="6" rx="13" ry="4.5" fill="#fff" stroke="#d0d0d0" stroke-width="0.6"/><rect x="9" y="7" width="22" height="2.5" fill="#eee"/>',
    tool: '<rect x="-2.5" y="-18" width="5" height="14" rx="2.5" fill="#d7a86e"/><rect x="-1" y="-21" width="2" height="3" fill="#a0703c"/><rect x="-1" y="-4" width="2" height="3" fill="#a0703c"/>',
    swing: '70;95;70',
    dur: '0.5s',
    target: `<rect x="48" y="34" width="30" height="6" fill="#8b5a2b"/><ellipse cx="63" cy="32" rx="8" ry="2.5" fill="#f3d9a4"><animate attributeName="rx" values="7;11;7" dur="0.5s" repeatCount="indefinite"/></ellipse><path d="M68 22 q4 -6 9 0 v3 h-9Z" fill="#c68642"/><g stroke="#ddd" stroke-width="0.8" fill="none"><path d="M70 19 q1 -2 0 -4">${blink('1;0.2;1', '1s')}</path><path d="M74 19 q1 -2 0 -4">${blink('0.2;1;0.2', '1s')}</path></g><g fill="#fff" opacity="0">${flash('0.5s')}<circle cx="54" cy="29" r="1.5"/><circle cx="72" cy="29" r="1.2"/></g>`,
  },
  {
    name: 'почтальон',
    emoji: '✉️',
    prop: '📬',
    hat: '<rect x="9" y="3" width="22" height="6" rx="2" fill="#1e3a8a"/><rect x="18" y="4" width="4" height="2.5" fill="#ffd54a"/><path d="M22 9 h12 l-2 2 h-10Z" fill="#111827"/>',
    tool: '<rect x="-5" y="-14" width="10" height="7" fill="#fff" stroke="#9aa4ad" stroke-width="0.6"/><path d="M-5 -14 l5 4 l5 -4" stroke="#9aa4ad" stroke-width="0.6" fill="none"/>',
    swing: '40;95;40',
    dur: '0.8s',
    target: `<rect x="63" y="26" width="2.5" height="14" fill="#555"/><path d="M56 27 v-9 q8 -6 16 0 v9Z" fill="#1e88e5"/><rect x="59" y="21" width="9" height="1.5" fill="#0d47a1"/><g><animateTransform attributeName="transform" type="rotate" values="0 73 22;-70 73 22;0 73 22" dur="0.8s" repeatCount="indefinite"/><rect x="72" y="14" width="1.5" height="8" fill="#e53935"/><rect x="73.5" y="14" width="4" height="3" fill="#e53935"/></g><rect x="-3" y="-2" width="6" height="4" fill="#fff" stroke="#9aa4ad" stroke-width="0.5"><animateMotion path="M46 22 Q54 8 63 21" dur="0.8s" repeatCount="indefinite"/></rect>`,
  },
  {
    name: 'фотограф',
    emoji: '📷',
    prop: '🌼',
    hat: '<path d="M8 9 Q12 1 24 2 Q33 3 34 9Z" fill="#6b7280"/><path d="M26 7 h12 l-3 2 h-9Z" fill="#4b5563"/>',
    tool: '<rect x="-1" y="-6" width="2" height="6" fill="#333"/><rect x="-6" y="-14" width="12" height="8" rx="1" fill="#2d2d2d"/><circle cx="0" cy="-10" r="2.6" fill="#90caf9" stroke="#555" stroke-width="0.8"/><rect x="-5" y="-16" width="3" height="2" fill="#555"/>',
    swing: '75;80;75',
    dur: '1.2s',
    target: `<path d="M63 40 l-2 -8 h8 l-2 8Z" fill="#26a69a"/><rect x="64.5" y="23" width="1" height="9" fill="#4caf50"/><g fill="#fff"><circle cx="65" cy="18" r="2.2"/><circle cx="65" cy="24" r="2.2"/><circle cx="62" cy="21" r="2.2"/><circle cx="68" cy="21" r="2.2"/></g><circle cx="65" cy="21" r="2" fill="#ffd54a"/><g opacity="0">${flash('1.2s')}<circle cx="52" cy="14" r="5" fill="#fffde7"/><path d="M52 5 v-3 M61 14 h3 M52 23 v3 M45 8 l-2 -2" stroke="#fff59d" stroke-width="1.2"/></g>`,
  },
  {
    name: 'скульптор',
    emoji: '🗿',
    prop: '🏛️',
    hat: '<path d="M7 9 Q20 1 33 9 L33 10 H7Z" fill="#c62828"/><path d="M33 9 l4 3 l-1 -5Z" fill="#c62828"/>',
    tool: '<rect x="-1" y="-15" width="2" height="12" fill="#9aa4ad"/><rect x="-1.8" y="-6" width="3.6" height="6" fill="#8b5a2b"/>',
    swing: '80;95;80',
    dur: '0.3s',
    target: `<rect x="56" y="34" width="18" height="6" fill="#9e9e9e"/><path d="M58 34 q0 -8 7 -10 q7 2 7 10Z" fill="#bdbdbd"/><circle cx="65" cy="19" r="6" fill="#cfcfcf"/><rect x="62" y="18" width="1.5" height="1.5" fill="#888"/><rect x="66.5" y="18" width="1.5" height="1.5" fill="#888"/><rect x="63" y="21.5" width="4" height="0.8" fill="#888"/><g fill="#e0e0e0" opacity="0">${flash('0.3s')}<rect x="56" y="16" width="1.5" height="1.5"/><rect x="53" y="20" width="1.2" height="1.2"/><rect x="55" y="24" width="1" height="1"/></g>`,
  },
  {
    name: 'фермер',
    emoji: '🌾',
    prop: '🐔',
    hat: '<path d="M9 9 Q10 1 20 1 Q30 1 31 9Z" fill="#2e7d32"/><rect x="14" y="3" width="12" height="4" fill="#fff"/><path d="M31 8 h7 l-1 2 h-6Z" fill="#1b5e20"/>',
    tool: `${HANDLE}<path d="M-4 -16 v-6 M0 -16 v-7 M4 -16 v-6 M-4 -16 h8" stroke="#9aa4ad" stroke-width="1.2" fill="none"/>`,
    swing: '-10;70;-10',
    dur: '0.6s',
    target: `<path d="M50 40 Q52 22 64 20 Q76 22 78 40Z" fill="#e8c547"/><path d="M54 32 l4 -3 M66 28 l5 2 M60 36 l6 -2 M70 34 l3 -3" stroke="#c9a227" stroke-width="0.8"/><g stroke="#e8c547" stroke-width="1" opacity="0">${flash('0.6s')}<path d="M52 17 l3 -2"/><path d="M47 21 l2 -3"/><path d="M57 13 l3 1"/></g>`,
  },
  {
    name: 'космонавт',
    emoji: '🚀',
    prop: '🌕',
    hat: '<circle cx="20" cy="16" r="18" fill="#bde0fe" fill-opacity="0.25" stroke="#e0e0e0" stroke-width="1.5"/><rect x="15" y="-3" width="10" height="2" fill="#e0e0e0"/>',
    tool: '<rect x="-0.6" y="-22" width="1.2" height="22" fill="#cfd8dc"/><rect x="0.6" y="-22" width="9" height="6" fill="#e53935"/><rect x="0.6" y="-20" width="9" height="2" fill="#fff"/>',
    swing: '10;22;10',
    dur: '1s',
    target: `<path d="M64 4 q6 6 6 18 v8 h-12 v-8 q0 -12 6 -18Z" fill="#eceff1" stroke="#90a4ae" stroke-width="0.6"/><circle cx="64" cy="16" r="2.5" fill="#4fc3f7" stroke="#90a4ae" stroke-width="0.6"/><path d="M58 22 l-4 9 h4Z M70 22 l4 9 h-4Z" fill="#e53935"/><path d="M60 30 h8 l-4 9Z" fill="#ff9800">${blink('1;0.4;1', '0.15s')}</path><path d="M62 30 h4 l-2 5Z" fill="#ffd54a"/><g fill="#fff"><circle cx="51" cy="8" r="0.8">${blink('1;0.2;1', '1.3s')}</circle><circle cx="77" cy="12" r="0.8">${blink('0.2;1;0.2', '1.1s')}</circle></g>`,
  },
  {
    name: 'пират',
    emoji: '🏴‍☠️',
    prop: '💰',
    hat: '<path d="M3 8 Q20 -7 37 8 Q20 3 3 8Z" fill="#212121"/><circle cx="20" cy="3" r="1.8" fill="#fff"/><rect x="12" y="12" width="6" height="6" rx="1" fill="#111"/><path d="M6 11 L34 15" stroke="#111" stroke-width="0.8"/>',
    tool: '<rect x="-1.5" y="-4" width="3" height="4" fill="#8b5a2b"/><rect x="-3.5" y="-5.5" width="7" height="1.5" fill="#ffd54a"/><path d="M-1.2 -5.5 L-1.2 -21 Q3 -18 1.5 -5.5Z" fill="#cfd8dc"/>',
    swing: '0;80;0',
    dur: '0.5s',
    target: `<g fill="#ffd54a" stroke="#c9a227" stroke-width="0.4">${[58, 64, 70]
      .map(
        (x, i) =>
          `<circle cx="${x}" cy="27" r="1.8"><animate attributeName="cy" values="28;10;28" dur="0.9s" begin="${i * 0.3}s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}</g><rect x="54" y="28" width="20" height="12" fill="#8d5524"/><path d="M54 28 q10 -7 20 0Z" fill="#a0632d"/><rect x="54" y="31" width="20" height="1.5" fill="#ffd54a"/><rect x="62" y="30" width="4" height="4" fill="#ffd54a"/>`,
  },
  {
    name: 'фокусник',
    emoji: '🎩',
    prop: '🐇',
    hat: '<rect x="12" y="-6" width="16" height="13" fill="#212121"/><rect x="8" y="6" width="24" height="2.5" fill="#212121"/><rect x="12" y="3" width="16" height="2" fill="#c62828"/>',
    tool: '<rect x="-1" y="-16" width="2" height="16" fill="#212121"/><rect x="-1" y="-18" width="2" height="3" fill="#fff"/>',
    swing: '40;100;40',
    dur: '0.9s',
    target: `<g><animateTransform attributeName="transform" type="translate" values="0,9;0,0;0,0;0,9" keyTimes="0;0.25;0.75;1" dur="1.8s" repeatCount="indefinite"/><ellipse cx="65" cy="23" rx="4" ry="3.5" fill="#fff"/><rect x="62" y="13" width="2" height="8" rx="1" fill="#fff"/><rect x="66" y="13" width="2" height="8" rx="1" fill="#fff"/><circle cx="63.5" cy="22.5" r="0.6" fill="#111"/><circle cx="66.5" cy="22.5" r="0.6" fill="#111"/></g><rect x="58" y="27" width="14" height="9" fill="#212121"/><rect x="56" y="26" width="18" height="2" fill="#212121"/><rect x="52" y="36" width="26" height="4" fill="#6a1b9a"/><g fill="#ffd54a">${sparks(56, 14, '0.9s')}</g>`,
  },
  {
    name: 'диджей',
    emoji: '🎧',
    prop: '💿',
    hat: '<path d="M9 9 Q10 1 20 1 Q30 1 31 9Z" fill="#e53935"/><path d="M9 8 h-6 l1 2 h5Z" fill="#b71c1c"/>',
    tool: `<rect x="-2" y="-5" width="4" height="5" fill="${O}"/>`,
    swing: '85;105;85',
    dur: '0.25s',
    target: `<rect x="47" y="33" width="32" height="7" rx="1" fill="#37474f"/><g>${rot('0 58 24;360 58 24', '1s')}<circle cx="58" cy="24" r="8" fill="#111"/><circle cx="58" cy="24" r="5.5" fill="none" stroke="#333" stroke-width="0.5"/><circle cx="58" cy="24" r="2.5" fill="#e53935"/><rect x="57.5" y="17" width="1" height="3" fill="#666"/></g>${[
      { x: 70, values: '4;13;7;11;4' },
      { x: 73, values: '9;5;13;6;9' },
      { x: 76, values: '6;11;4;12;6' },
    ]
      .map(
        ({ x, values }) =>
          `<rect x="${x}" y="20" width="2" height="13" fill="#7ee787"><animate attributeName="height" values="${values}" dur="0.8s" repeatCount="indefinite"/><animate attributeName="y" values="${values
            .split(';')
            .map(h => 33 - Number(h))
            .join(';')}" dur="0.8s" repeatCount="indefinite"/></rect>`,
      )
      .join('')}`,
  },
  {
    name: 'сантехник',
    emoji: '🔧',
    prop: '🚰',
    hat: '<path d="M9 9 Q10 1 20 1 Q30 1 31 9Z" fill="#1565c0"/><path d="M31 8 h7 l-1 2 h-6Z" fill="#0d47a1"/><rect x="15" y="20" width="10" height="2.5" rx="1" fill="#4e342e"/>',
    tool: '<rect x="-1.5" y="-14" width="3" height="13" fill="#e53935"/><path d="M-4.5 -20 h9 v5 h-3 v-2.5 h-3 v2.5 h-3Z" fill="#9aa4ad"/>',
    swing: '60;100;60',
    dur: '0.5s',
    target: `<rect x="46" y="18" width="30" height="5" fill="#90a4ae"/><rect x="71" y="18" width="5" height="22" fill="#90a4ae"/><rect x="57" y="16" width="5" height="9" fill="#78909c"/><g fill="#4aa3df">${[0, 0.25]
      .map(
        begin =>
          `<circle cx="60" cy="25" r="1.1"><animate attributeName="cy" values="24;38" dur="0.5s" begin="${begin}s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}</g><ellipse cx="61" cy="39" rx="6" ry="1.2" fill="#4aa3df" opacity="0.7"><animate attributeName="rx" values="4;7;4" dur="2s" repeatCount="indefinite"/></ellipse>`,
  },
  {
    name: 'электрик',
    emoji: '⚡',
    prop: '💡',
    hat: `${dome('#1e88e5')}<path d="M21 0 l-3 4 h2.5 l-2 4 l4.5 -5 h-2.5 l1.5 -3Z" fill="#ffd54a"/>`,
    tool: '<rect x="-1.8" y="-8" width="3.6" height="8" rx="1" fill="#fdd835"/><rect x="-0.6" y="-17" width="1.2" height="9" fill="#9aa4ad"/>',
    swing: '85;95;85',
    dur: '0.25s',
    target: `<path d="M68 0 v9" stroke="#333" stroke-width="0.8"/><rect x="66" y="9" width="4" height="3" fill="#78909c"/><circle cx="68" cy="16" r="5" fill="#fff59d">${blink('0.25;1;1;0.25', '1.2s')}</circle><rect x="50" y="22" width="13" height="18" fill="#b0bec5" stroke="#78909c" stroke-width="0.6"/><rect x="53" y="26" width="2" height="4" fill="#e53935"/><rect x="57" y="26" width="2" height="4" fill="#43a047"/><path d="M63 31 q4 0 5 -15" stroke="#333" stroke-width="0.8" fill="none"/>${sparks(52, 22, '0.25s')}`,
  },
  {
    name: 'учитель',
    emoji: '🎓',
    prop: '📚',
    hat: '<path d="M4 4 L20 -1 L36 4 L20 9Z" fill="#212121"/><rect x="13" y="5" width="14" height="4" fill="#212121"/><path d="M33 4 v6" stroke="#ffd54a" stroke-width="1"/><circle cx="33" cy="10.5" r="1" fill="#ffd54a"/>',
    tool: '<rect x="-0.8" y="-24" width="1.6" height="24" fill="#8b5a2b"/>',
    swing: '50;70;50',
    dur: '0.9s',
    target: `<path d="M54 28 L52 40 M74 28 L76 40" stroke="#8b5a2b" stroke-width="1.5"/><rect x="50" y="8" width="28" height="20" fill="#2e7d32" stroke="#8b5a2b" stroke-width="1.5"/><text x="53" y="17" font-size="6" fill="#fff">2+2</text><text x="64" y="17" font-size="6" fill="#fff">=4<animate attributeName="opacity" values="0;1;1" keyTimes="0;0.4;1" calcMode="discrete" dur="2s" repeatCount="indefinite"/></text><path d="M53 22 h12" stroke="#fff" stroke-width="0.8"><animate attributeName="opacity" values="0;0;1" keyTimes="0;0.7;1" calcMode="discrete" dur="2s" repeatCount="indefinite"/></path>`,
  },
  {
    name: 'теннисист',
    emoji: '🎾',
    prop: '🏆',
    hat: '<rect x="6" y="8.5" width="28" height="2.5" fill="#fff"/><rect x="6" y="8.5" width="28" height="0.8" fill="#e53935"/>',
    tool: '<rect x="-1" y="-9" width="2" height="9" fill="#333"/><ellipse cx="0" cy="-15" rx="5" ry="6.5" fill="none" stroke="#e53935" stroke-width="1.5"/><path d="M-4 -15 h8 M0 -21 v12 M-3 -18 h6 M-3 -12 h6" stroke="#ddd" stroke-width="0.5"/>',
    swing: '-30;90;-30',
    dur: '0.8s',
    target: `<rect x="44" y="39" width="40" height="1" fill="#fff"/><rect x="66" y="27" width="1.5" height="13" fill="#555"/><path d="M67.5 28 h9 M67.5 31 h9 M67.5 34 h9 M67.5 37 h9 M70 28 v12 M73 28 v12 M76 28 v12" stroke="#bbb" stroke-width="0.4"/><circle r="2" fill="#c6ff00"><animateMotion path="M50 20 Q62 2 78 38 Q81 30 84 33" dur="0.8s" repeatCount="indefinite"/></circle>`,
  },
  {
    name: 'парикмахер',
    emoji: '✂️',
    prop: '💈',
    hat: '<path d="M7 9 Q8 2 20 2 Q32 2 33 9 Q26 5 20 6 Q12 5 7 9Z" fill="#3e2723"/><rect x="25" y="-1" width="8" height="2" fill="#ec407a"/><path d="M26 1 v1.5 M28 1 v1.5 M30 1 v1.5 M32 1 v1.5" stroke="#ec407a" stroke-width="0.6"/>',
    tool: `<circle cx="-2" cy="-1" r="2" fill="none" stroke="#ec407a" stroke-width="1.2"/><circle cx="2" cy="-1" r="2" fill="none" stroke="#ec407a" stroke-width="1.2"/><g>${rot('-14 0 -4;0 0 -4;-14 0 -4', '0.3s')}<path d="M-1 -4 L-0.5 -17 L0.5 -4Z" fill="#cfd8dc"/></g><g>${rot('14 0 -4;0 0 -4;14 0 -4', '0.3s')}<path d="M1 -4 L0.5 -17 L-0.5 -4Z" fill="#b0bec5"/></g>`,
    swing: '75;85;75',
    dur: '0.6s',
    target: `<rect x="58" y="22" width="3" height="12" fill="#ec407a"/><rect x="58" y="30" width="18" height="4" fill="#ec407a"/><rect x="66" y="34" width="3" height="6" fill="#9e9e9e"/><rect x="62" y="18" width="12" height="12" fill="${O}"/><rect x="64" y="22" width="2" height="3" fill="${D}"/><rect x="70" y="22" width="2" height="3" fill="${D}"/><path d="M61 18 q7 -10 14 0Z" fill="#6d4c41"/><g fill="#6d4c41">${[60, 64, 70]
      .map(
        (x, i) =>
          `<rect x="${x}" y="16" width="1.5" height="1"><animate attributeName="y" values="16;38" dur="1s" begin="${i * 0.33}s" repeatCount="indefinite"/></rect>`,
      )
      .join('')}</g>`,
  },
  {
    name: 'археолог',
    emoji: '🦴',
    prop: '🦕',
    hat: '<ellipse cx="20" cy="8.5" rx="16" ry="2.2" fill="#c8a165"/><path d="M10 8.5 Q20 -6 30 8.5Z" fill="#d7b377"/><rect x="10" y="6.5" width="20" height="1.5" fill="#8d6e63"/>',
    tool: '<rect x="-1" y="-12" width="2" height="12" fill="#8b5a2b"/><rect x="-3" y="-17" width="6" height="5" rx="1" fill="#d7b377"/>',
    swing: '80;110;80',
    dur: '0.35s',
    target: `<path d="M46 40 Q62 26 82 40Z" fill="#e0c18a"/><g fill="#fafafa" stroke="#bdbdbd" stroke-width="0.4"><rect x="57" y="33" width="12" height="2.5" rx="1"/><circle cx="57" cy="33" r="1.6"/><circle cx="57" cy="35.5" r="1.6"/><circle cx="69" cy="33" r="1.6"/><circle cx="69" cy="35.5" r="1.6"/></g><g fill="#e0c18a" opacity="0">${flash('0.35s')}<circle cx="52" cy="30" r="1.5"/><circle cx="55" cy="26" r="1"/><circle cx="50" cy="27" r="1"/></g>`,
  },
  {
    name: 'дворник',
    emoji: '🧹',
    prop: '🍂',
    hat: '<path d="M9 9 Q10 0 20 0 Q30 0 31 9Z" fill="#e65100"/><rect x="9" y="7" width="22" height="2.5" fill="#bf360c"/><circle cx="20" cy="0" r="2.2" fill="#ffcc80"/><rect x="6" y="22" width="28" height="2" fill="#cddc39"/>',
    tool: '<rect x="-0.8" y="-13" width="1.6" height="13" fill="#8b5a2b"/><path d="M-1.5 -13 h3 l3 -7 h-9Z" fill="#d4a24c"/><path d="M-3 -18 v2 M-1 -18 v2 M1 -18 v2 M3 -18 v2" stroke="#a07828" stroke-width="0.5"/>',
    swing: '135;178;135',
    dur: '0.6s',
    target: `<path d="M64 40 Q73 30 82 40Z" fill="#d68a2e"/><g fill="#e67e22">${[0, 0.3]
      .map(
        begin =>
          `<ellipse rx="2" ry="1" opacity="0"><set attributeName="opacity" to="1" begin="${begin}s"/><animateMotion path="M46 39 Q56 28 68 36" dur="0.6s" begin="${begin}s" repeatCount="indefinite"/></ellipse>`,
      )
      .join('')}</g><ellipse rx="2" ry="1" fill="#c0392b"><animateMotion path="M74 2 Q66 12 74 20 Q80 28 72 38" dur="2.4s" repeatCount="indefinite"/></ellipse><g fill="#c8b8a0" opacity="0">${flash('0.6s')}<circle cx="47" cy="37" r="1.2"/><circle cx="50" cy="35" r="0.9"/></g>`,
  },
  {
    name: 'пчеловод',
    emoji: '🐝',
    prop: '🍯',
    hat: '<ellipse cx="20" cy="7" rx="16" ry="2.5" fill="#f5f0dc"/><path d="M12 7 Q20 -3 28 7Z" fill="#ece4c6"/><path d="M5 8 L7 23 H33 L35 8Z" fill="#fff" fill-opacity="0.35" stroke="#c9c9c9" stroke-width="0.4"/>',
    tool: `<rect x="-3" y="-12" width="6" height="9" rx="1" fill="#b0bec5"/><rect x="-1" y="-3" width="2" height="3" fill="#8b5a2b"/><path d="M-3 -12 l3 -4 l3 4Z" fill="#90a4ae"/><circle cx="0" cy="-19" r="2" fill="#eee">${blink('0.9;0.2;0.9', '0.8s')}</circle><circle cx="2" cy="-23" r="1.5" fill="#eee">${blink('0.2;0.9;0.2', '0.8s')}</circle>`,
    swing: '55;80;55',
    dur: '0.8s',
    target: `<rect x="60" y="36" width="18" height="4" fill="#8b5a2b"/><rect x="61" y="22" width="16" height="14" fill="#f9a825"/><path d="M61 27 h16 M61 31.5 h16" stroke="#e08e0b" stroke-width="0.8"/><path d="M59 22 L69 15 L79 22Z" fill="#a1887f"/><rect x="66" y="33" width="5" height="2" fill="#5d4037"/><path d="M62 36 q1 3 2 0Z" fill="#ffb300"/>${[0, 0.55, 1.1]
      .map(
        begin =>
          `<g opacity="0"><set attributeName="opacity" to="1" begin="${begin}s"/><animateMotion path="M68 34 Q46 22 56 12 Q66 4 72 14 Q76 24 68 34" dur="1.65s" begin="${begin}s" repeatCount="indefinite"/><circle r="1.6" fill="#ffd54a"/><rect x="-0.5" y="-1.6" width="1" height="3.2" fill="#333"/><ellipse cx="0" cy="-2" rx="1.2" ry="0.8" fill="#fff" opacity="0.8"/></g>`,
      )
      .join('')}`,
  },
  {
    name: 'ковбой',
    emoji: '🤠',
    prop: '🐄',
    hat: '<path d="M1 6 Q6 10 20 8 Q34 10 39 6 Q35 12 20 12 Q5 12 1 6Z" fill="#8d6e63"/><path d="M11 9 Q11 -1 16 1 Q20 3 24 1 Q29 -1 29 9Z" fill="#a1887f"/><rect x="11" y="6" width="18" height="1.5" fill="#5d4037"/>',
    tool: '<rect x="-0.6" y="-9" width="1.2" height="9" fill="#c8a165"/><ellipse cx="0" cy="-14" rx="6" ry="4.5" fill="none" stroke="#c8a165" stroke-width="1.3"/>',
    swing: '0;360',
    dur: '0.6s',
    target: `<g fill="#fff" stroke="#555" stroke-width="0.4"><rect x="60" y="33" width="2" height="7"/><rect x="64" y="33" width="2" height="7"/><rect x="71" y="33" width="2" height="7"/><rect x="75" y="33" width="2" height="7"/><rect x="58" y="24" width="20" height="10" rx="2"/></g><ellipse cx="64" cy="27" rx="3" ry="2" fill="#333"/><ellipse cx="72" cy="31" rx="2.5" ry="1.5" fill="#333"/><g>${rot('0 78 25;25 78 25;0 78 25', '1.2s')}<path d="M78 25 q3 5 1 10" stroke="#555" stroke-width="0.8" fill="none"/></g><path d="M52 20 l-2 -3 M58 20 l2 -3" stroke="#c8a165" stroke-width="1.2"/><rect x="51" y="19" width="8" height="8" rx="1.5" fill="#fff" stroke="#555" stroke-width="0.4"/><rect x="51" y="24" width="6" height="3.5" rx="1" fill="#f8bbd0"/><circle cx="54" cy="21.5" r="0.8" fill="#111"/><text x="63" y="21" font-size="5" fill="#8d6e63">Му!${blink('1;0;0;1', '2s')}</text>`,
  },
  {
    name: 'рыцарь',
    emoji: '⚔️',
    prop: '🐉',
    hat: '<path d="M7 11 Q7 -2 20 -2 Q33 -2 33 11Z" fill="#b0bec5" stroke="#78909c" stroke-width="0.6"/><rect x="7" y="9" width="26" height="2" fill="#78909c"/><path d="M20 -2 Q24 -10 31 -7 Q26 -6 22 -1Z" fill="#e53935"/>',
    tool: '<rect x="-1" y="-4" width="2" height="4" fill="#5d4037"/><rect x="-4" y="-5.5" width="8" height="1.5" fill="#ffd54a"/><path d="M-1.2 -5.5 V-20 L0 -22 L1.2 -20 V-5.5Z" fill="#e0e0e0"/>',
    swing: '-10;85;-10',
    dur: '0.45s',
    target: `<path d="M77 33 Q86 30 82 23" stroke="#43a047" stroke-width="2.5" fill="none"/><ellipse cx="70" cy="32" rx="9" ry="6" fill="#43a047"/><g fill="#388e3c"><rect x="64" y="36" width="3" height="4"/><rect x="73" y="36" width="3" height="4"/></g><g>${rot('0 70 27;-30 70 27;0 70 27', '0.6s')}<path d="M70 27 L75 13 L81 24Z" fill="#81c784"/></g><rect x="57" y="20" width="10" height="8" rx="2" fill="#4caf50"/><circle cx="60" cy="23" r="1.1" fill="#111"/><path d="M62 20 l1 -3 l1 3Z M65 20 l1 -3 l1 3Z" fill="#fdd835"/><g fill="#bdbdbd">${[0, 0.4]
      .map(
        begin =>
          `<circle cx="57" cy="25" r="1.3"><animate attributeName="cy" values="25;12" dur="0.8s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="0.8s" begin="${begin}s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}</g>${sparks(55, 16, '0.45s')}`,
  },
  {
    name: 'лучник',
    emoji: '🏹',
    prop: '🎯',
    hat: '<path d="M6 9 Q13 -2 34 6 L34 9Z" fill="#2e7d32"/><path d="M26 5 Q33 -6 38 -4 Q32 0 28 6Z" fill="#e53935"/>',
    tool: '<path d="M0 9 Q9 0 0 -9" stroke="#8b5a2b" stroke-width="1.6" fill="none"/><path d="M0 9 V-9" stroke="#eee" stroke-width="0.5"/>',
    swing: '0;-6;0',
    dur: '0.7s',
    target: `<path d="M68 40 L72 30 L76 40" stroke="#8b5a2b" stroke-width="1.2" fill="none"/><circle cx="72" cy="24" r="8" fill="#fff" stroke="#999" stroke-width="0.4"/><circle cx="72" cy="24" r="6" fill="#e53935"/><circle cx="72" cy="24" r="4" fill="#fff"/><circle cx="72" cy="24" r="2" fill="#e53935"/><g stroke="#8b5a2b" stroke-width="0.8"><path d="M71 21 l-6 -2"/><path d="M73 26 l-6 2"/></g><g><animateMotion path="M46 25 L68 24" dur="0.7s" repeatCount="indefinite"/><rect x="-6" y="-0.4" width="8" height="0.8" fill="#8b5a2b"/><path d="M2 -1.5 L4.5 0 L2 1.5Z" fill="#9aa4ad"/><path d="M-6 0 l-2 -1.5 M-6 0 l-2 1.5" stroke="#e53935" stroke-width="0.8"/></g>`,
  },
  {
    name: 'бармен',
    emoji: '🍸',
    prop: '🍋',
    hat: '<path d="M7 9 Q8 3 20 3 Q32 3 33 9 Q24 6 7 9Z" fill="#212121"/><path d="M16 21.5 l4 1.5 l4 -1.5 v4 l-4 -1.5 l-4 1.5Z" fill="#c62828"/>',
    tool: '<rect x="-2.5" y="-14" width="5" height="12" rx="1" fill="#cfd8dc" stroke="#90a4ae" stroke-width="0.5"/><rect x="-1.5" y="-17" width="3" height="3" rx="1" fill="#90a4ae"/><rect x="-2.5" y="-9" width="5" height="1.5" fill="#90a4ae"/>',
    swing: '15;45;15',
    dur: '0.25s',
    target: `<rect x="48" y="33" width="32" height="7" fill="#6d4c41"/><rect x="48" y="33" width="32" height="1.5" fill="#8d6e63"/><path d="M64 27 L64 27 L64 27Z" fill="#ec407a"><animate attributeName="d" values="M64 27 L64 27 L64 27Z;M58.6 20.4 L69.4 20.4 L64 27Z;M58.6 20.4 L69.4 20.4 L64 27Z" keyTimes="0;0.7;1" dur="2.4s" repeatCount="indefinite"/></path><path d="M58 20 h12 l-6 7Z" fill="none" stroke="#b3e5fc" stroke-width="0.8"/><rect x="63.5" y="27" width="1" height="5" fill="#b3e5fc"/><rect x="61" y="32" width="6" height="1" fill="#b3e5fc"/><g opacity="0"><animate attributeName="opacity" values="0;1" keyTimes="0;0.75" calcMode="discrete" dur="2.4s" repeatCount="indefinite"/><path d="M68 20 q1 -4 3 -6" stroke="#4caf50" stroke-width="0.6" fill="none"/><circle cx="68" cy="19.5" r="1.6" fill="#e53935"/></g><path d="M75 33 v-10 h4 v10Z M76 23 v-4 h2 v4Z" fill="#2e7d32" opacity="0.8"/>`,
  },
  {
    name: 'регулировщик',
    emoji: '🚦',
    prop: '🚗',
    hat: '<path d="M9 7 Q10 0 20 0 Q30 0 31 7Z" fill="#1a237e"/><rect x="9" y="6" width="22" height="2" fill="#fff"/><path d="M14 8 h14 l-2 2.5 h-10Z" fill="#111"/><circle cx="20" cy="3" r="1.5" fill="#ffd54a"/>',
    tool: '<rect x="-1.2" y="-16" width="2.4" height="16" fill="#fff" stroke="#999" stroke-width="0.3"/><g fill="#212121"><rect x="-1.2" y="-14" width="2.4" height="3"/><rect x="-1.2" y="-8" width="2.4" height="3"/></g>',
    swing: '30;90;90;30',
    dur: '1.6s',
    target: `<rect x="79" y="20" width="2" height="20" fill="#555"/><rect x="76" y="4" width="8" height="17" rx="1.5" fill="#263238"/>${[
      { y: 8, fill: '#e53935', values: '1;0.15;0.15' },
      { y: 12.5, fill: '#fdd835', values: '0.15;1;0.15' },
      { y: 17, fill: '#43a047', values: '0.15;0.15;1' },
    ]
      .map(
        ({ y, fill, values }) =>
          `<circle cx="80" cy="${y}" r="1.8" fill="${fill}"><animate attributeName="opacity" values="${values}" keyTimes="0;0.4;0.5" calcMode="discrete" dur="3s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}<rect x="44" y="39" width="40" height="1" fill="#9e9e9e"/><g>${move('52,38;52,38;74,38', '3s', 'keyTimes="0;0.5;1" repeatCount="indefinite"')}<animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="3s" repeatCount="indefinite"/><rect x="-8" y="-5" width="16" height="5" rx="1.5" fill="#1e88e5"/><rect x="-5" y="-8.5" width="9" height="4" rx="1" fill="#90caf9"/><circle cx="-4.5" cy="0" r="1.8" fill="#222"/><circle cx="4.5" cy="0" r="1.8" fill="#222"/></g>`,
  },
  {
    name: 'водолаз',
    emoji: '🤿',
    prop: '🐠',
    hat: '<rect x="9" y="11" width="22" height="9" rx="3" fill="#4fc3f7" fill-opacity="0.35" stroke="#0277bd" stroke-width="1.4"/><rect x="6" y="13" width="3" height="2.5" fill="#0277bd"/><path d="M33 20 V3 h3" stroke="#ff7043" stroke-width="2" fill="none"/>',
    tool: '<rect x="-1.8" y="-10" width="3.6" height="10" rx="1" fill="#ffca28"/><rect x="-2.5" y="-13" width="5" height="3" fill="#ffb300"/><path d="M-2.5 -13 L-6 -22 H6 L2.5 -13Z" fill="#fff59d" opacity="0.45"/>',
    swing: '60;100;100;60',
    dur: '1.6s',
    target: `<rect x="44" y="2" width="40" height="38" fill="#4fc3f7" opacity="0.18"/><path d="M80 40 q-3 -6 0 -12 q3 -6 0 -12" stroke="#43a047" stroke-width="1.5" fill="none">${rot('-6 80 40;6 80 40;-6 80 40', '2s')}</path><rect x="60" y="32" width="12" height="8" fill="#8d5524"/><path d="M60 32 q6 -5 12 0Z" fill="#a0632d"/><rect x="65" y="33" width="2.5" height="3" fill="#ffd54a"/><g fill="#fff59d" opacity="0">${flash('1.6s')}<circle cx="63" cy="28" r="0.9"/><circle cx="70" cy="27" r="0.7"/></g><g>${move('0,0;12,-3;0,0', '3s')}<path d="M52 16 q4 -3 8 0 q-4 3 -8 0 M60 16 l3 -2 v4Z" fill="#ff7043"/></g><g fill="none" stroke="#e1f5fe" stroke-width="0.6">${[0, 0.6, 1.2]
      .map(
        begin =>
          `<circle cx="${70 + begin * 3}" cy="30" r="1.2"><animate attributeName="cy" values="30;2" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}</g>`,
  },
  {
    name: 'альпинист',
    emoji: '🧗',
    prop: '🏔️',
    hat: `${dome('#ff5722')}<rect x="8" y="7" width="24" height="2" fill="#bf360c"/><g fill="#90caf9" stroke="#37474f" stroke-width="0.8"><circle cx="15" cy="4" r="2.2"/><circle cx="25" cy="4" r="2.2"/></g>`,
    tool: `${HANDLE}<path d="M-8 -14 Q0 -19 6 -16 L6 -15 Q0 -17 -6 -13Z" fill="#78909c"/><rect x="5" y="-18" width="3" height="4" fill="#78909c"/>`,
    swing: '-15;72;-15',
    dur: '0.5s',
    target: `<path d="M50 40 L65 8 L82 40Z" fill="#78909c"/><path d="M59.4 20 L65 8 L70.6 20 L67.5 18 L65 21 L62.5 18Z" fill="#fff"/><path d="M58 26 l4 -3 M70 30 l5 4" stroke="#607d8b" stroke-width="0.8"/><rect x="64.5" y="-1" width="1" height="10" fill="#555"/><path d="M65.5 -1 h7 l-2 2 l2 2 h-7Z" fill="#e53935">${rot('0 65.5 1;-10 65.5 1;0 65.5 1', '0.8s')}</path><g fill="#fff" opacity="0">${flash('0.5s')}<rect x="54" y="24" width="1.5" height="1.5"/><rect x="51" y="21" width="1.2" height="1.2"/><rect x="56" y="20" width="1" height="1"/></g>`,
  },
  {
    name: 'часовщик',
    emoji: '⌚',
    prop: '🕰️',
    hat: '<rect x="6" y="6" width="28" height="2" fill="#5d4037"/><circle cx="25.5" cy="16" r="4.5" fill="#bde0fe" fill-opacity="0.5" stroke="#212121" stroke-width="1.5"/><rect x="29" y="14.5" width="5" height="3" fill="#212121"/>',
    tool: '<rect x="-1.5" y="-7" width="3" height="7" rx="1" fill="#1e88e5"/><rect x="-0.4" y="-15" width="0.8" height="8" fill="#9aa4ad"/>',
    swing: '80;95;80',
    dur: '0.6s',
    target: `<rect x="62" y="31" width="10" height="9" fill="#8d6e63"/><circle cx="67" cy="19" r="11" fill="#fff8e1" stroke="#8d6e63" stroke-width="2"/><g fill="#5d4037"><rect x="66.5" y="9.5" width="1" height="2"/><rect x="66.5" y="26.5" width="1" height="2"/><rect x="57.5" y="18.5" width="2" height="1"/><rect x="74.5" y="18.5" width="2" height="1"/></g><g>${rot('0 67 19;360 67 19', '24s')}<rect x="66.3" y="13" width="1.4" height="6" fill="#212121"/></g><g>${rot('0 67 19;360 67 19', '2s')}<rect x="66.5" y="10.5" width="1" height="8.5" fill="#212121"/></g><circle cx="67" cy="19" r="1.2" fill="#c62828"/>${[
      { x: 54, values: '0 54 36;360 54 36' },
      { x: 60, values: '360 60 36;0 60 36' },
    ]
      .map(
        ({ x, values }) =>
          `<circle cx="${x}" cy="36" r="3" fill="none" stroke="#ffb300" stroke-width="2.4" stroke-dasharray="1.6 1.2">${rot(values, '1.5s')}</circle>`,
      )
      .join('')}`,
  },
  {
    name: 'портной',
    emoji: '🧵',
    prop: '👔',
    hat: '<ellipse cx="20" cy="7" rx="6" ry="3" fill="#e53935"/><path d="M17 6 l-1 -3 M20 5 v-3.5 M23 6 l1 -3" stroke="#9aa4ad" stroke-width="0.6"/><g fill="#ffd54a"><circle cx="16" cy="3" r="0.8"/><circle cx="20" cy="1.5" r="0.8"/><circle cx="24" cy="3" r="0.8"/></g><path d="M8 20 Q20 27 32 20" stroke="#fdd835" stroke-width="1.8" fill="none"/><path d="M8.5 20 v6 M31.5 20 v5" stroke="#fdd835" stroke-width="1.8"/>',
    tool: '<rect x="-0.5" y="-15" width="1" height="13" fill="#cfd8dc"/><path d="M0 -13 Q7 -5 2 4" stroke="#e53935" stroke-width="0.6" fill="none"/>',
    swing: '60;110;60',
    dur: '0.5s',
    target: `<rect x="65" y="32" width="2" height="8" fill="#8b5a2b"/><rect x="60" y="38.5" width="12" height="1.5" fill="#8b5a2b"/><circle cx="66" cy="9" r="2.2" fill="#8b5a2b"/><path d="M57 12 Q66 9 75 12 L73 32 H59Z" fill="#7e57c2"/><path d="M66 11 v21" stroke="#5e35b1" stroke-width="0.6"/>${[18, 25]
      .map(
        (y, i) =>
          `<line x1="58" y1="${y}" x2="58" y2="${y}" stroke="#fff" stroke-width="0.8" stroke-dasharray="1.5 1.2"><animate attributeName="x2" values="58;74;74" keyTimes="0;0.8;1" dur="2s" begin="${i}s" repeatCount="indefinite"/></line>`,
      )
      .join('')}`,
  },
  {
    name: 'гончар',
    emoji: '🏺',
    prop: '🌀',
    hat: '<path d="M7 9 Q8 1 20 2 Q32 1 33 9Z" fill="#a1887f"/><path d="M33 7 l5 2 l-1 3 l-4 -2Z" fill="#a1887f"/><g fill="#8d6e63"><rect x="12" y="21" width="2" height="2"/><rect x="27" y="20" width="2" height="2"/></g>',
    tool: `<rect x="-1.5" y="-9" width="3" height="9" fill="${O}"/><rect x="-1.5" y="-9" width="3" height="2.5" fill="#a1887f"/>`,
    swing: '80;92;80',
    dur: '0.5s',
    target: `<rect x="44" y="34" width="24" height="6" fill="#6d4c41"/><ellipse cx="56" cy="33" rx="11" ry="2" fill="#8d6e63"/><rect x="50" y="32" width="1.5" height="2" fill="#5d4037"><animate attributeName="x" values="46;65;46" dur="0.4s" repeatCount="indefinite"/></rect><path d="M51 33 Q47 25 53 20 L59 20 Q65 25 61 33Z" fill="#c1693c"><animate attributeName="d" values="M51 33 Q47 25 53 20 L59 20 Q65 25 61 33Z;M50 33 Q46 27 54 18 L58 18 Q66 27 62 33Z;M51 33 Q47 25 53 20 L59 20 Q65 25 61 33Z" dur="2s" repeatCount="indefinite"/></path><path d="M52 27 h8" stroke="#a0522d" stroke-width="0.6"/><path d="M74 40 q-3 -6 1 -10 h4 q4 4 1 10Z" fill="#c1693c"/><rect x="74.5" y="28" width="5" height="2" fill="#a0522d"/>`,
  },
  {
    name: 'жонглёр',
    emoji: '🤹',
    prop: '🎪',
    hat: '<path d="M8 9 L3 -4 L15 5 L20 -6 L25 5 L37 -4 L32 9Z" fill="#8e24aa"/><path d="M20 -6 L25 5 L20 7 L15 5Z" fill="#fdd835"/><g fill="#fdd835"><circle cx="3" cy="-4" r="1.6"/><circle cx="20" cy="-6" r="1.6"/><circle cx="37" cy="-4" r="1.6"/></g>',
    tool: `<rect x="-1.5" y="-5" width="3" height="5" fill="${O}"/><circle cx="0" cy="-7" r="2.5" fill="#e53935"/>`,
    swing: '70;110;70',
    dur: '0.4s',
    target: `<rect x="62" y="30" width="16" height="10" fill="#e53935"/><rect x="62" y="30" width="16" height="2" fill="#fdd835"/><path d="M66 32 v8 M70 32 v8 M74 32 v8" stroke="#fff" stroke-width="1.2"/>${[
      { fill: '#42a5f5', begin: 0 },
      { fill: '#66bb6a', begin: 0.4 },
      { fill: '#ffd54a', begin: 0.8 },
    ]
      .map(
        ({ fill, begin }) =>
          `<circle r="2.2" fill="${fill}" opacity="0"><set attributeName="opacity" to="1" begin="${begin}s"/><animateMotion path="M42 22 Q56 -10 70 22 Q56 30 42 22" dur="1.2s" begin="${begin}s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}`,
  },
  {
    name: 'энтомолог',
    emoji: '🦋',
    prop: '🌸',
    hat: '<rect x="7" y="7" width="26" height="2" fill="#43a047"/><path d="M14 8 Q11 0 8 -2 M26 8 Q29 0 32 -2" stroke="#212121" stroke-width="0.8" fill="none"/><circle cx="8" cy="-2" r="1.5" fill="#212121"/><circle cx="32" cy="-2" r="1.5" fill="#212121"/>',
    tool: '<rect x="-0.6" y="-15" width="1.2" height="15" fill="#8b5a2b"/><path d="M-4.5 -19 A4.5 4.5 0 0 1 4.5 -19 Q3 -10 0 -12 Q-3 -10 -4.5 -19Z" fill="#fff" fill-opacity="0.55" stroke="#9aa4ad" stroke-width="0.8"/>',
    swing: '20;85;20',
    dur: '0.9s',
    target: `<rect x="69" y="30" width="1.5" height="10" fill="#4caf50"/><path d="M70 36 q-5 -3 -6 1 M70 34 q5 -3 6 1" stroke="#4caf50" stroke-width="1" fill="none"/><g fill="#f48fb1"><circle cx="70" cy="27" r="2"/><circle cx="67" cy="29.5" r="2"/><circle cx="73" cy="29.5" r="2"/><circle cx="68" cy="32.5" r="2"/><circle cx="72" cy="32.5" r="2"/></g><circle cx="70" cy="30" r="1.5" fill="#ffd54a"/><g><animateMotion path="M62 14 Q72 2 78 14 Q74 24 66 20 Q56 18 62 14" dur="2.6s" repeatCount="indefinite"/><g><animateTransform attributeName="transform" type="scale" values="1 1;0.25 1;1 1" dur="0.2s" repeatCount="indefinite"/><path d="M0 0 L-3.5 -3 L-3 2Z M0 0 L3.5 -3 L3 2Z" fill="#ff7043"/></g><rect x="-0.4" y="-2" width="0.8" height="4" fill="#333"/></g>`,
  },
  {
    name: 'боксёр',
    emoji: '🥊',
    prop: '💪',
    hat: '<rect x="6" y="8" width="28" height="3" fill="#e53935"/><path d="M6 9 l-4 3 l1 2 l4 -3Z M6 10 l-2 5 l2 1 l1 -5Z" fill="#e53935"/>',
    tool: '<rect x="-1.5" y="-3" width="3" height="3" fill="#fff"/><rect x="-4" y="-11" width="8" height="8" rx="3" fill="#e53935"/><rect x="-4" y="-5" width="8" height="1.5" fill="#fff"/>',
    swing: '50;92;50',
    dur: '0.35s',
    target: `<rect x="77" y="0" width="5" height="2" fill="#555"/><rect x="58" y="0" width="22" height="1.5" fill="#555"/><rect x="58.5" y="1.5" width="1" height="6" fill="#555"/><g><animateTransform attributeName="transform" type="rotate" values="0 59 1;0 59 1;-14 59 1;0 59 1" keyTimes="0;${STRIKE};0.5;1" dur="0.35s" repeatCount="indefinite"/><rect x="53" y="7.5" width="12" height="24" rx="4" fill="#c62828"/><rect x="53" y="12" width="12" height="2" fill="#8e0000"/><rect x="53" y="26" width="12" height="2" fill="#8e0000"/></g><rect x="48" y="39" width="30" height="1" fill="#9e9e9e"/>${sparks(52, 20, '0.35s')}`,
  },
  {
    name: 'шахматист',
    emoji: '♟️',
    prop: '👑',
    hat: '<path d="M9 8 Q10 2 20 2 Q30 2 31 8Z" fill="#455a64"/><path d="M28 7 h8 l-2 2 h-6Z" fill="#37474f"/><g fill="none" stroke="#212121" stroke-width="0.9"><circle cx="14.5" cy="16" r="3.5"/><circle cx="25.5" cy="16" r="3.5"/><path d="M18 16 h4"/></g>',
    tool: '<g fill="#263238" stroke="#90a4ae" stroke-width="0.4"><rect x="-3" y="-2" width="6" height="2"/><path d="M-2 -2 L-1 -7 H1 L2 -2Z"/><circle cx="0" cy="-8.5" r="2"/></g>',
    swing: '60;100;100;60',
    dur: '1.6s',
    target: `<rect x="48" y="33" width="32" height="7" fill="#8b5a2b"/><path d="M50 40 v-1 M78 40 v-1" stroke="#5d4037"/>${[0, 1, 2, 3, 4, 5, 6, 7]
      .map(i => `<rect x="${48 + i * 4}" y="31" width="4" height="2" fill="${i % 2 ? '#5d4037' : '#efebe9'}"/>`)
      .join('')}<g fill="#fafafa" stroke="#757575" stroke-width="0.4"><rect x="71" y="29" width="6" height="2"/><path d="M72 29 L73 21 H75 L76 29Z"/><path d="M74 17 v4 M72.5 18.5 h3" stroke-width="0.9"/></g><g>${move('0,0;0,0;4,-6;8,0;8,0', '2.4s', 'keyTimes="0;0.4;0.5;0.6;1" repeatCount="indefinite"')}<g fill="#263238" stroke="#90a4ae" stroke-width="0.4"><rect x="51" y="29" width="5" height="2"/><path d="M52 29 L53 25 H54 L55 29Z"/><circle cx="53.5" cy="24" r="1.6"/></g></g>`,
  },
  {
    name: 'барабанщик',
    emoji: '🥁',
    prop: '🔊',
    hat: '<path d="M8 9 Q9 2 20 2 Q31 2 32 9Z" fill="#1565c0"/><g fill="#fff"><circle cx="15" cy="5" r="0.8"/><circle cx="21" cy="4" r="0.8"/><circle cx="26" cy="6" r="0.8"/></g><path d="M8 8 l-5 1 l1 3Z M8 8 l-3 4 h3Z" fill="#1565c0"/>',
    tool: '<rect x="-0.8" y="-16" width="1.6" height="16" fill="#d7a86e"/><circle cx="0" cy="-16" r="1.2" fill="#d7a86e"/>',
    swing: '20;115;20',
    dur: '0.3s',
    target: `<rect x="50" y="30" width="20" height="10" fill="#e53935"/><path d="M50 32 L55 38 L60 32 L65 38 L70 32" stroke="#ffd54a" stroke-width="0.8" fill="none"/><ellipse cx="60" cy="30" rx="10" ry="2" fill="#f5f5f5" stroke="#bbb" stroke-width="0.4"/><rect x="77" y="18" width="1" height="22" fill="#9e9e9e"/><path d="M74 40 l3.5 -4 l3.5 4" stroke="#9e9e9e" stroke-width="0.8" fill="none"/><ellipse cx="77.5" cy="18" rx="6" ry="1.2" fill="#fbc02d">${rot('-8 77.5 18;8 77.5 18;-8 77.5 18', '0.3s')}</ellipse><g stroke="#ffd54a" stroke-width="0.8" fill="none" opacity="0">${flash('0.3s')}<path d="M54 24 q3 -3 6 0"/><path d="M52 21 q5 -5 10 0"/></g>`,
  },
  {
    name: 'грибник',
    emoji: '🍄',
    prop: '🧺',
    hat: '<path d="M4 9 Q6 -4 20 -4 Q34 -4 36 9Z" fill="#e53935"/><g fill="#fff"><circle cx="12" cy="3" r="1.8"/><circle cx="22" cy="-1" r="1.5"/><circle cx="29" cy="4" r="1.8"/><circle cx="18" cy="5" r="1"/></g>',
    tool: '<rect x="-1" y="-6" width="2" height="6" fill="#8b5a2b"/><path d="M-1 -6 L-1 -14 Q2.5 -10 1 -6Z" fill="#cfd8dc"/>',
    swing: '110;150;110',
    dur: '0.6s',
    target: `<path d="M44 40 Q50 37 56 40 Q62 37 68 40" fill="#7cb342"/>${[
      { x: 50, begin: 0, cap: '#8d6e63' },
      { x: 58, begin: 0.8, cap: '#e53935' },
    ]
      .map(
        ({ x, begin, cap }) =>
          `<g transform="translate(${x},40)"><g><animateTransform attributeName="transform" type="scale" values="0.2;1;1;0.2" keyTimes="0;0.25;0.85;1" dur="1.6s" begin="${begin}s" repeatCount="indefinite"/><rect x="-1.2" y="-5" width="2.4" height="5" fill="#f5f0dc"/><path d="M-4 -5 Q0 -11 4 -5Z" fill="${cap}"/></g></g>`,
      )
      .join('')}<path d="M70 32 h12 l-2 8 h-8Z" fill="#c8a165"/><path d="M72 32 Q76 22 80 32" stroke="#8b5a2b" stroke-width="1" fill="none"/><path d="M71 35 h10 M71.5 37.5 h9" stroke="#a1887f" stroke-width="0.5"/><g><path d="M73 32 Q75 27 77 32Z" fill="#8d6e63"/><path d="M76 32 Q78.5 28 81 32Z" fill="#e53935"/></g>`,
  },
  {
    name: 'стеклодув',
    emoji: '🔮',
    prop: '✨',
    hat: '<rect x="6" y="5" width="28" height="3" fill="#5d4037"/><g fill="#ffb74d" fill-opacity="0.75" stroke="#3e2723" stroke-width="1"><rect x="11" y="2.5" width="7" height="5" rx="2"/><rect x="22" y="2.5" width="7" height="5" rx="2"/></g>',
    tool: '<rect x="-0.7" y="-22" width="1.4" height="22" fill="#78909c"/><rect x="-1.2" y="-3" width="2.4" height="3" fill="#5d4037"/>',
    swing: '87;93;87',
    dur: '1.5s',
    target: `<rect x="72" y="16" width="12" height="24" fill="#6d4c41"/><rect x="71" y="14" width="14" height="3" fill="#4e342e"/><path d="M74 40 v-10 q4 -5 8 0 v10Z" fill="#ff6f00">${blink('1;0.7;1', '0.4s')}</path><circle cx="65" cy="25" r="3" fill="#ffb300"><animate attributeName="r" values="2.5;6;2.5" dur="3s" repeatCount="indefinite"/><animate attributeName="fill" values="#fff176;#ff7043;#fff176" dur="3s" repeatCount="indefinite"/></circle><circle cx="63" cy="23" r="1" fill="#fff" opacity="0.8"/>`,
  },
  {
    name: 'мороженщик',
    emoji: '🍦',
    prop: '🍨',
    hat: '<path d="M9 9 L12 2 H28 L31 9Z" fill="#fff" stroke="#ddd" stroke-width="0.5"/><rect x="11" y="4.5" width="18" height="1.5" fill="#f06292"/>',
    tool: '<rect x="-1" y="-11" width="2" height="11" fill="#b0bec5"/><path d="M-3.5 -11 Q0 -17 3.5 -11Z" fill="#b0bec5"/><circle cx="0" cy="-13" r="2.5" fill="#f8bbd0"/>',
    swing: '40;100;40',
    dur: '0.7s',
    target: `<rect x="76" y="10" width="1" height="30" fill="#9e9e9e"/><path d="M69 12 Q76.5 2 84 12Z" fill="#f06292"/><path d="M69 12 Q72.5 9 76.5 12 Q80 9 84 12" fill="#fff" opacity="0.6"/><rect x="56" y="38" width="12" height="2" fill="#90a4ae"/><path d="M57 28 H67 L62 39Z" fill="#d7a86e"/><path d="M58.5 30 l6 6 M61 29 l4 4 M65.5 30 l-6 6 M63 29 l-4 4" stroke="#b07d3c" stroke-width="0.5"/>${[
      { y: 26, fill: '#f8bbd0', at: 0.05 },
      { y: 21.5, fill: '#fff3e0', at: 0.25 },
      { y: 17, fill: '#8d6e63', at: 0.5 },
    ]
      .map(
        ({ y, fill, at }) =>
          `<circle cx="62" cy="${y}" r="4" fill="${fill}" opacity="0"><animate attributeName="opacity" values="0;1" keyTimes="0;${at}" calcMode="discrete" dur="2.8s" repeatCount="indefinite"/></circle>`,
      )
      .join('')}<circle cx="62.5" cy="12" r="1.5" fill="#e53935" opacity="0"><animate attributeName="opacity" values="0;1" keyTimes="0;0.75" calcMode="discrete" dur="2.8s" repeatCount="indefinite"/></circle>`,
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
const waitingBody = (job?: Job, lashAt?: number, lashFor = HIT * 2.5) => {
  const watch = `<g opacity="0">${lookOpacity('1', '0')}<g transform="rotate(35)">${arm(10)}<rect x="-2.2" y="-7" width="4.4" height="3" fill="#222"/><rect x="-1.2" y="-6.3" width="2.4" height="1.6" fill="#9be7ff"/></g></g>`
  const stub = `<g>${lookOpacity('0', '1')}${LEFT_STUB}</g>`

  return `<g transform="translate(2,8)">${claude({
    ...gear(job),
    legs: 'tap',
    leftHand: `<g transform="translate(4,17)">${stub}${watch}</g>`,
    hand: `<g transform="translate(37,17)">${STUB}<g>${lashAt === undefined ? '' : `<set attributeName="opacity" to="0" begin="${lashAt.toFixed(2)}s" dur="${lashFor.toFixed(2)}s"/>`}${HELD_WHIP}</g></g>`,
  })}</g><text x="45" y="18" font-size="9" fill="#888" opacity="0">…${lookOpacity('1', '0')}</text>`
}

// `lashFor`: how long the whip is out of the hand, in seconds (a lash's
// swing, or the revolver's shots).
export const waiting = (job?: Job, lashAt?: number, lashFor?: number) =>
  svg(MAIN_WIDTH, waitingBody(job, lashAt, lashFor))

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

// The revolver: up at once, its first shot at FIRE, one more every SHOT_GAP
// along a row of minis. Each one hit at the feet hops for HOP.
const FIRE = 0.05
const SHOT_GAP = 0.18
const HOP = 0.42
// When shot `k` (from 0) is fired, in seconds after the click.
export const shotAt = (k: number) => FIRE + k * SHOT_GAP
// How long `shots` shots take to play out, the last hop included.
export const shotMs = (shots: number) => Math.round((shotAt(Math.max(1, shots) - 1) + HOP + 0.1) * 1000)
// Where a shot lands: the ground under the feet.
const GROUND = 40.5

// Pointing right from the grip, held at (0,0); its muzzle at MUZZLE.
const REVOLVER =
  '<path d="M-1 0.2 L1.8 0.2 L0.6 4.8 L-2.6 4.8Z" fill="#6d4c41"/>' +
  '<path d="M1.8 0.4 q1.8 0 1.8 2 h-1.2" stroke="#37474f" stroke-width="0.6" fill="none"/>' +
  '<rect x="-1" y="-3.2" width="5.6" height="3.6" fill="#455a64"/>' +
  '<rect x="0.6" y="-3.9" width="3.4" height="4.6" rx="0.9" fill="#78909c"/>' +
  '<rect x="1.2" y="-2.4" width="2.2" height="0.6" fill="#455a64"/>' +
  '<rect x="4.4" y="-2.9" width="7.4" height="1.8" fill="#90a4ae"/>' +
  '<rect x="10.6" y="-3.7" width="1" height="0.9" fill="#90a4ae"/>' +
  '<rect x="-2" y="-4.2" width="1.6" height="1.3" fill="#37474f"/>'
const MUZZLE = { x: 12.2, y: -2 }

const at2 = (s: number) => `${s.toFixed(3)}s`

// The aim from `hand` to `target`: the angle, whether it points left (the
// revolver is then flipped to keep its top up), and its muzzle's place.
const aim = (hand: { x: number; y: number }, target: { x: number; y: number }) => {
  const angle = (Math.atan2(target.y - hand.y, target.x - hand.x) * 180) / Math.PI
  const isLeft = target.x < hand.x
  const rad = (angle * Math.PI) / 180
  const my = isLeft ? -MUZZLE.y : MUZZLE.y

  return {
    angle,
    isLeft,
    muzzle: {
      x: hand.x + MUZZLE.x * Math.cos(rad) - my * Math.sin(rad),
      y: hand.y + MUZZLE.x * Math.sin(rad) + my * Math.cos(rad),
    },
  }
}

// One shot fired at `at` from `muzzle` to `target`: the flash at the
// muzzle, the bullet's streak, and where it lands, dust and chips flying and
// a 💥 of `size` at the feet.
const shot = (muzzle: { x: number; y: number }, angle: number, target: { x: number; y: number }, at: number, size: number) => {
  const flash =
    `<g transform="translate(${muzzle.x.toFixed(1)},${muzzle.y.toFixed(1)}) rotate(${angle.toFixed(1)})" opacity="0"><set attributeName="opacity" to="1" begin="${at2(at)}" dur="0.07s"/>` +
    '<path d="M0 -2.6 L2.6 -1.2 L6.5 0 L2.6 1.2 L0 2.6 L0.8 0Z" fill="#ffb300"/><path d="M0 -1.3 L3.6 0 L0 1.3Z" fill="#fff59d"/></g>'
  const streak = `<line x1="${muzzle.x.toFixed(1)}" y1="${muzzle.y.toFixed(1)}" x2="${target.x.toFixed(1)}" y2="${target.y.toFixed(1)}" stroke="#fff59d" stroke-width="0.9" opacity="0"><set attributeName="opacity" to="1" begin="${at2(at)}" dur="0.05s"/></line>`
  const hit = at + 0.04
  const { x, y } = target
  const dust = [-2.2, 0, 2.4]
    .map(
      (dx, i) =>
        `<circle cx="${(x + dx).toFixed(1)}" cy="${(y - 0.6 - (i % 2)).toFixed(1)}" r="0" fill="#bcaaa4"><animate attributeName="r" values="0.6;${(2.2 + (i % 2)).toFixed(1)}" begin="${at2(hit)}" dur="0.35s"/><animate attributeName="opacity" values="0.9;0" begin="${at2(hit)}" dur="0.35s" fill="freeze"/></circle>`,
    )
    .join('')
  const chips = [
    [-5, -6],
    [4, -7],
    [7, -3],
  ]
    .map(
      ([dx, dy]) =>
        `<rect x="${(x - 0.5).toFixed(1)}" y="${(y - 1).toFixed(1)}" width="1.2" height="1.2" fill="#8d6e63" opacity="0"><set attributeName="opacity" to="1" begin="${at2(hit)}" dur="0.3s"/><animateTransform attributeName="transform" type="translate" values="0,0;${dx},${dy};${(dx ?? 0) * 1.4},${(dy ?? 0) * 0.3}" begin="${at2(hit)}" dur="0.3s"/></rect>`,
    )
    .join('')
  const boom = `<text x="${(x - size * 0.55).toFixed(1)}" y="${Math.min(HEIGHT - 0.5, y + size * 0.4).toFixed(1)}" font-size="${size}" opacity="0">💥<set attributeName="opacity" to="1" begin="${at2(hit)}" dur="0.3s"/></text>`

  return flash + streak + dust + chips + boom
}

// A revolver held at `hand` firing once at each of `targets` in turn, from
// FIRE: it turns to each, kicks up at each shot, and is gone after.
const revolver = (hand: { x: number; y: number }, targets: readonly { x: number; y: number }[], size: number) => {
  const aims = targets.map(target => aim(hand, target))
  const total = shotMs(targets.length) / 1000
  const first = aims[0] ?? aim(hand, { x: hand.x + 10, y: hand.y })
  // Turns to the next target between shots; the first aim is held from the
  // start.
  const turns =
    aims.length > 1
      ? `<animateTransform attributeName="transform" type="rotate" values="${aims.map(one => one.angle.toFixed(1)).join(';')}" keyTimes="0;${aims
          .slice(1)
          .map((_, k) => (shotAt(k + 1) - 0.06) / total)
          .map(k => k.toFixed(3))
          .join(';')}" calcMode="discrete" dur="${total.toFixed(3)}s" fill="freeze"/>`
      : ''
  const kicks = aims
    .map((_, k) => `<animateTransform attributeName="transform" type="rotate" values="0;-32;0" keyTimes="0;0.2;1" begin="${at2(shotAt(k))}" dur="0.16s"/>`)
    .join('')
  const gun =
    `<g transform="translate(${hand.x.toFixed(1)},${hand.y.toFixed(1)})" opacity="0"><set attributeName="opacity" to="1" begin="0s" dur="${(total - 0.1).toFixed(3)}s"/>` +
    `<g transform="rotate(${first.angle.toFixed(1)})">${turns}<g transform="scale(1,${first.isLeft ? -1 : 1})"><g>${kicks}${REVOLVER}</g></g></g></g>`

  return gun + aims.map((one, k) => shot(one.muzzle, one.angle, targets[k] ?? one.muzzle, shotAt(k), size)).join('')
}

// The person's revolver, in their fist at `from`, fired at the main
// mascot's feet at `hitX`; from the stage's right when where they clicked
// is not known.
const personShot = (from: { x: number; y: number }, hitX: number) => {
  const target = { x: hitX, y: GROUND }
  // Never so close the muzzle reaches past where it lands.
  const hand = Math.hypot(from.x - target.x, from.y - target.y) < 16 ? { x: from.x, y: target.y - 16 } : from

  return (
    revolver(hand, [target], 10) +
    `<circle cx="${hand.x.toFixed(1)}" cy="${(hand.y + 1.5).toFixed(1)}" r="2.2" fill="#5b3a1e" opacity="0"><set attributeName="opacity" to="1" begin="0s" dur="${(shotMs(1) / 1000 - 0.1).toFixed(3)}s"/></circle>`
  )
}

// Where a shot at a mini at its desk lands: under its feet, a little
// to one side or the other from shot to shot.
const miniFeetX = (x: number, n: number, k: number) => x + DESK + 12 + (((n * 7 + k * 5) % 9) - 4)

// The actor's own drawing, its body hopping from a shot at its feet at
// `begin` seconds into the drawing (past, if negative), its eyes squeezed
// shut while it is up. Its target and the rest stay put. `isMini`: a mini's
// drawing, its body a 0.6 scale at its desk.
export const hopping = (drawing: string, begin: number, isMini = false) => {
  const lift = isMini ? 13 : 7
  const bounce = `<animateTransform attributeName="transform" type="translate" additive="sum" values="0,0;0,-${lift};0,0" keyTimes="0;0.4;1" calcMode="spline" keySplines="0.2 0.7 0.4 1;0.6 0 0.8 0.3" begin="${at2(begin)}" dur="${HOP}s"/>`
  const body = '<g transform="translate(2,8)">'
  const eyes = `<g transform="${isMini ? `translate(${DESK},20.8) scale(0.6)` : 'translate(2,8)'}" opacity="0"><set attributeName="opacity" to="1" begin="${at2(begin)}" dur="${HOP}s"/>${bounce}<rect x="11" y="11" width="18" height="10" fill="${O}"/>${OUCH_EYES}</g>`

  return drawing.split(body).join(body + bounce).replace(/<\/svg>$/, `${eyes}</svg>`)
}

export type Leaver = { fromX: number; elapsed: number; job: Job }

// The overlay across the whole row: the minis walking home, and a fresh lash.
export const stageFx = (
  stage: Stage,
  lash:
    | {
        n: number
        kind: 'minis' | 'self'
        isStreak: boolean
        elapsed: number
        from?: { x: number; y: number }
        weapon?: 'lasso' | 'gun'
        hitX?: number
      }
    | undefined,
  leavers: readonly Leaver[],
) => {
  const width = fxWidth(stage, lash?.kind === 'self' ? lash.from : undefined)
  const home = leavers.map(one => walkingHome(one.fromX, one.elapsed, one.job)).join('')
  if (lash === undefined) return svg(width, home)
  // Loaded again part way through, the lash goes on from where it was rather
  // than cracking a second time.
  const at = (markup: string) => shiftTime(markup, lash.elapsed)
  if (lash.weapon === 'gun') {
    if (lash.kind === 'self') {
      const from = lash.from ?? { x: stage.mainWidth - 8, y: 28 }

      return svg(width, `${home}${at(`<g id="lash${lash.n}">${personShot(from, lash.hitX ?? 22)}</g>`)}`)
    }
    // The main mascot fires once at the feet of each busy mini, left to right.
    const feet = stage.minis
      .flatMap((mini, i) => (mini.isBusy ? [stage.mainWidth + i * MINI_WIDTH] : []))
      .map((x, k) => ({ x: miniFeetX(x, lash.n, k), y: GROUND }))

    return svg(width, `${home}${at(`<g id="lash${lash.n}">${revolver({ x: 39, y: 25 }, feet, 7)}</g>`)}`)
  }
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

// `shoot`: firing the revolver at the minis; `hop`: jumping from a shot at
// the feet.
export type TermPose = 'work' | 'wait' | 'salute' | 'whip' | 'ouch' | 'shoot' | 'hop'

export const termMain = (pose: TermPose, job: Job, isOdd: boolean): string[] => {
  const beside: Record<TermPose, [string, string]> = {
    work: isOdd ? ['', ` ${job.emoji}${job.prop}`] : [` ${job.emoji}`, `   ${job.prop}`],
    wait: isOdd ? [' ⌚', ''] : ['', ' ⌚'],
    salute: [' 🫡', ''],
    whip: isOdd ? ['', ' ～～～💥'] : [' ～', ''],
    ouch: isOdd ? [` 💢${job.emoji}`, `   ${job.prop}`] : ['', `💥${job.emoji}${job.prop}`],
    shoot: isOdd ? ['', ' ⌐╦╦═─ ⁍'] : ['', ' ⌐╦╦═─💥'],
    hop: isOdd ? [' 💢', ''] : ['', ''],
  }
  const feet =
    pose === 'wait' && isOdd ? '  ▘▘ ▝▘' : pose === 'hop' ? (isOdd ? '   💥' : '  ▘▘💥▝▝') : BIG[2]

  return [BIG[0] + beside[pose][0], BIG[1] + beside[pose][1], feet]
}

export const termMini = (pose: TermPose, job: Job, isOdd: boolean): string[] => {
  if (pose === 'salute') return ['  🫡', SMALL[0], SMALL[1]]
  // Up a row off the ground, a 💥 where it stood.
  if (pose === 'hop') {
    return isOdd
      ? [`${SMALL[0]}${job.emoji}`, `${SMALL[1]}  ${job.prop}`, ' 💥']
      : ['', `${SMALL[0]}${job.emoji}${job.prop}`, `${SMALL[1]}💥`]
  }
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


