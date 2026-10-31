// `at`: when it starts climbing out, so a redraw after its walk-in draws it
// at its desk.
// `doneAt`/`fromX`: when and from where it set off home (0 while working).
export type Mini = {
  id: string
  job: number
  isDone: boolean
  isSettled: boolean
  at: number
  doneAt: number
  fromX: number
  // Its place in the row, kept while others come and go.
  slot: number
  // What its subagent is doing now (its latest tool call's description, at
  // first the task it was given), shown in its card.
  task: string
  // The task it was given (shown on hover and in its card), its agent type,
  // how many tools it has called and what it did last (newest first).
  given: string
  type: string
  // The model its subagent runs on, as people name it (`Sonnet 5.5`).
  model: string
  tools: number
  recent: string[]
}

export type Whip = 'none' | 'minis' | 'self'

// The last click of the whip, when, and the row it was drawn over: a redraw
// after it, or over a row that has changed, does not play it again.
// `isStreak`: it came while the last one still hurt, so the pain runs on.
// `from`: where the person clicked, in the drawing's units from the stage's
// bottom-left, when it is known: a lash at the main mascot flies from there.
// `weapon`: what punished them, the lasso when not set (a click from before
// there was a choice). With the revolver: `hitX`, where the person's shot
// lands under the main mascot's feet; `shots`, how many minis the main
// mascot fires at (or, with a tomato, throws one at).
export type Lash = {
  n: number
  kind: 'minis' | 'self'
  row: string
  at: number
  isStreak: boolean
  from?: { x: number; y: number }
  weapon?: Weapon
  hitX?: number
  shots?: number
  // With the bow: what its arrow hit.
  hit?: Flight['hit']
}

// One click's tomatoes, while any is still in the air or dripping: `n`
// the click's number, `at` when it came, `row` the row it was thrown over,
// `from` where the person's hand was, `shots` how many minis were hit.
export type Toss = {
  n: number
  kind: 'minis' | 'self'
  row: string
  at: number
  from?: { x: number; y: number }
  shots: number
}

// The punishments a click picks from.
export type Weapon = 'lasso' | 'gun' | 'tomato' | 'bow'

// A place in the drawing's units, from the stage's left and the row's top.
export type Point = { x: number; y: number }

// One arrow's path, worked out as it leaves the bow: a parabola from `from`
// to `to` (`ctrl` its Bezier control point) in `flightS` seconds, `launch`
// and `angle` its heading as it leaves and as it lands, in degrees, and what
// it hit there: the main mascot, a mini (`slot`, its place in the row), the
// ground, or nothing at all (it flew off).
export type Flight = {
  from: Point
  ctrl: Point
  to: Point
  flightS: number
  launch: number
  angle: number
  hit: 'main' | 'mini' | 'ground' | 'away'
  slot?: number
}

// A weapon held ready while the button is down: who holds it (the person at
// the main mascot, or the main mascot at the minis), since when, where it is
// held and where the cursor points it. `weapon`: what is held (the bow when
// not set: its string is drawn the whole time). `isAtMain`: pressed on the
// main mascot itself. `pressedAt`: where the person pressed for their bow,
// held right of it; while the cursor is still there it aims at the mascot.
export type Aim = {
  kind: 'minis' | 'self'
  at: number
  anchor: Point
  target?: Point
  pressedAt?: Point
  weapon?: Weapon
  isAtMain?: boolean
}

// One arrow loosed, while it flies, sticks or falls: `n` the shot's number,
// `at` when it left the bow, `row` the row it flew over, `power` how far the
// string was drawn (0 to 1).
export type Arrow = {
  n: number
  kind: 'minis' | 'self'
  row: string
  at: number
  power: number
  flight: Flight
}

// The language the mod speaks, picked with the band's gear.
export type Lang = 'en' | 'uk'

// What is open over a mini: its right-click menu, or its details card.
export type Popup = { id: string; kind: 'menu' | 'details' } | null

export type Scene = {
  isWorking: boolean
  isSaluting: boolean
  job: number
  // When the first mini of a batch was spawned: the main mascot finishes its
  // own task first, and the minis climb out after.
  handoffAt: number
  // When the main mascot came up from under the prompt, and when it set off
  // back down (0 while it is not leaving).
  enterAt: number
  leaveAt: number
  minis: Mini[]
}

declare module 'claude-code' {
  interface PluginState {
    'mascot-crew': { scene: Scene; tick: number; whip: Whip; lash: Lash; popup: Popup; band: number; weapons: Weapon[]; arsenal: Weapon[]; armed: Weapon | null; lang: Lang; isGearOpen: boolean; tosses: Toss[]; aim: Aim | null; arrows: Arrow[] }
  }
}
