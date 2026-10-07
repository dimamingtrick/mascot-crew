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
  // first the task it was given), shown on hover.
  task: string
}

export type Whip = 'none' | 'minis' | 'self'

// The last click of the whip, when, and the row it was drawn over: a redraw
// after it, or over a row that has changed, does not play it again.
// `isStreak`: it came while the last one still hurt, so the pain runs on.
export type Lash = { n: number; kind: 'minis' | 'self'; row: string; at: number; isStreak: boolean }

// The last question asked in the chat: when, and whether its countdown to
// the next one is still on show.
export type Ask = { at: number; isOn: boolean }

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
    'mascot-crew': { scene: Scene; tick: number; whip: Whip; lash: Lash; ask: Ask }
  }
}
