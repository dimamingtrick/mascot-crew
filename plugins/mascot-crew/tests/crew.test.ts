import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'mascot-crew',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 10,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

// The stage's own drawings, the speech bubbles that wait for a hover left out.
const actors = async (ui: { findAll: (q: { type: 'Svg' }) => Promise<unknown[]> }) =>
  (await ui.findAll({ type: 'Svg' })).filter(svg => {
    const drawn = JSON.stringify(svg)

    return !drawn.includes('Клодик говорит') && !drawn.includes('Следующий вопрос') && !drawn.includes('"alt":""')
  })

// The whip: the FASTER button on the terminal, a click on the main mascot
// on the desktop.
const WHIP = { terminal: 'whip', desktop: 'lash' } as const
type Drawing = {
  press: (target: { key: string }) => Promise<unknown>
  pointer: (event: { type: 'down'; x: number; y: number; button: 'left'; in?: string }) => Promise<void>
}
const lash = (ui: Drawing, surface: 'terminal' | 'desktop') =>
  surface === 'terminal'
    ? ui.press({ key: 'whip' })
    : ui.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'lash' })

// Stands for the engine beneath the mod: an empty band, turns and spawns.
const engine = (on: On) => {
  const clock = mock.clock(on)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return h(Text, null, 'engine')
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  let spawned = 0
  on('agent.spawn', () => ({ model: 'haiku', agentId: `mini-${(spawned += 1)}` }))
  on('tool.call', () => ({ result: { backgroundTaskId: 'bg-1' } }))

  return clock
}

test('the mascot is on stage while a turn runs and salutes after it', async ($, on) => {
  const clock = engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const idle = await $.ui.mount({ ...BAND, surface })
    expect(await idle.find({ key: WHIP[surface] })).toBeUndefined()
    await idle.unmount()

    await $.turn.start({ text: 'go', turnId: 't' })
    const busy = await $.ui.mount({ ...BAND, surface })
    expect(await busy.find({ key: WHIP[surface] })).toBeDefined()
    await lash(busy as never, surface)
    await busy.unmount()

    await $.turn.complete({ answer: 'ok', durationMs: 1, reason: 'answer', isAborted: false, turnId: 't' })
    const saluting = await $.ui.mount({ ...BAND, surface })
    expect(await saluting.find({ key: WHIP[surface] })).toBeDefined()
    await saluting.unmount()

    await clock.advance(5000)
    const gone = await $.ui.mount({ ...BAND, surface })
    expect(await gone.find({ key: WHIP[surface] })).toBeUndefined()
    await gone.unmount()
  }
})

test('one mini per subagent, gone once its turn completed', async ($, on) => {
  const clock = engine(on)
  let asked = 0
  on('prompt.submit', (_, e) => {
    asked += 1

    return { text: e.text }
  })
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await actors(ui)).toHaveLength(2)

  await $.turn.complete({ answer: 'ok', durationMs: 1, reason: 'answer', isAborted: false, turnId: 't' })
  for (let i = 0; i < 5; i += 1) await lash(ui as never, 'desktop')
  await clock.settle()
  expect(asked).toBe(1)

  await $.turn.complete({
    answer: 'dug',
    durationMs: 1,
    reason: 'answer',
    isAborted: false,
    turnId: 's',
    agentId: 'mini-1',
  })
  await clock.advance(4000)
  expect(await actors(ui)).toHaveLength(1)
  await ui.unmount()
})

test('a mini stays while its subagent waits on background work', async ($, on) => {
  const clock = engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' })
  await $.tool.call({ tool: 'Bash', command: 'sleep 60', agentId: 'mini-1' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const stop = { answer: '', durationMs: 1, reason: 'answer', isAborted: false, turnId: 's', agentId: 'mini-1' } as const

  await $.turn.complete(stop)
  await clock.advance(4000)
  expect(await actors(ui)).toHaveLength(2)

  await $.turn.complete(stop)
  await clock.advance(4000)
  expect(await actors(ui)).toHaveLength(1)
  await ui.unmount()
})

test('one click is one lash, drawn once and never again on a redraw', async ($, on) => {
  const clock = engine(on)
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const lashes = async () =>
    (await ui.findAll({ type: 'Svg' })).filter(svg => JSON.stringify(svg).includes('id=\\"lash')).length
  expect(await lashes()).toBe(0)
  await lash(ui as never, 'desktop')
  expect(await lashes()).toBe(1)
  await clock.advance(1000)
  // A redraw of the same row later on: the main turn ends, the mini works on.
  await $.turn.complete({ answer: '', durationMs: 1, reason: 'answer', isAborted: false, turnId: 't' })
  expect(await lashes()).toBe(0)
  await ui.unmount()
})

test('one task keeps one profession across its turns', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const job = async () => (await ui.findAll({ type: 'Svg' }))[0]?.alt
  const first = await job()
  for (const turnId of ['t2', 't3', 't4', 't5']) {
    await $.turn.complete({ answer: '', durationMs: 1, reason: 'answer', isAborted: false, turnId })
    await $.turn.start({ text: 'more', turnId })
    expect(await job()).toBe(first)
  }
  await ui.unmount()
})

test('hovering a mini shows the task its subagent was given', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig', description: 'Найти баг в авторизации' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(JSON.stringify(await ui.findAll({ type: 'Svg' }))).toContain('Клодик говорит: Найти баг в авторизации')
  await ui.unmount()
})

test('every mini on stage has a profession of its own', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  for (let i = 0; i < 6; i += 1) await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const jobs = (await ui.findAll({ type: 'Svg' }))
    .map(svg => /Клодик работает: ([^:]+)/.exec(JSON.stringify(svg))?.[1])
    .filter(job => job !== undefined)
  expect(jobs).toHaveLength(6)
  expect(new Set(jobs).size).toBe(6)
  await ui.unmount()
})

test('the hover shows what the subagent is doing now', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig', description: 'Тестовый сабагент' } as never)
  await $.tool.call({ tool: 'Bash', command: 'sleep 95', description: 'Wait for 95 seconds', agentId: 'mini-1' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(JSON.stringify(await ui.findAll({ type: 'Svg' }))).toContain('Клодик говорит: Wait for 95 seconds')
  await ui.unmount()
})
