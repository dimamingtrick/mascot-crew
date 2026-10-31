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

    return !drawn.includes('Mini says') && !drawn.includes('"alt":""')
  })

// The whip: the FASTER button on the terminal, a click on the main mascot
// on the desktop.
const WHIP = { terminal: 'whip', desktop: 'lash' } as const
type Drawing = {
  press: (target: { key: string }) => Promise<unknown>
  pointer: (event: { type: 'down' | 'up'; x: number; y: number; button: 'left' | 'right'; in?: string }) => Promise<void>
}
// A click on the desktop is a press and its release (the bow looses only
// when the button comes up).
const lash = async (ui: Drawing, surface: 'terminal' | 'desktop') => {
  if (surface === 'terminal') return ui.press({ key: 'whip' })
  await ui.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'lash' })

  return ui.pointer({ type: 'up', x: 0, y: 0, button: 'left', in: 'lash' })
}

// A run punishes with a weapon picked at random; this arms it with one.
const pin = (on: On, weapon: 'lasso' | 'gun' | 'tomato' | 'bow') =>
  on('state.get', { plugin: 'mascot-crew', key: 'armed' }, () => ({
    value: { value: weapon, version: 1 },
  }))

const toasts: string[] = []
const stopped: string[] = []

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
  on('tool.call', (_, e) => {
    if (e.tool !== 'TaskStop') return { result: { backgroundTaskId: 'bg-1' } }
    const id = String((e as { task_id?: string }).task_id)
    stopped.push(id)

    return { result: { message: 'stopped', task_id: id, task_type: 'local_agent' } }
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)

    return { value: undefined }
  })

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

test('one mini per subagent, gone once its turn completed; the whip asks nothing', async ($, on) => {
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
  expect(asked).toBe(0)

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
  pin(on, 'lasso')
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
  await $.agent.spawn({ prompt: 'dig', description: 'Find the auth bug' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(JSON.stringify(await ui.findAll({ type: 'Svg' }))).toContain('Mini says: Haiku: Find the auth bug')
  await ui.unmount()
})

test('every mini on stage has a profession of its own', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  for (let i = 0; i < 6; i += 1) await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const jobs = (await ui.findAll({ type: 'Svg' }))
    .map(svg => /Mini at work: ([^:]+)/.exec(JSON.stringify(svg))?.[1])
    .filter(job => job !== undefined)
  expect(jobs).toHaveLength(6)
  expect(new Set(jobs).size).toBe(6)
  await ui.unmount()
})

test('the hover keeps the task given while the subagent calls tools', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig', description: 'Test subagent' } as never)
  await $.tool.call({ tool: 'Bash', command: 'sleep 95', description: 'Wait for 95 seconds', agentId: 'mini-1' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const drawn = JSON.stringify(await ui.findAll({ type: 'Svg' }))
  expect(drawn).toContain('Mini says: Haiku: Test subagent')
  expect(drawn).not.toContain('Mini says: Haiku: Wait for 95 seconds')
  await ui.unmount()
})

test('a right click on a mini opens its menu, and Stop stops its subagent', async ($, on) => {
  const clock = engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig', description: 'Dig' } as never)
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing & {
    find: (q: { key: string }) => Promise<unknown>
  }
  expect(await ui.find({ key: 'menu-stop-mini-1' })).toBeUndefined()
  await ui.pointer({ type: 'down', x: 0, y: 0, button: 'right', in: 'mini:mini-1' })
  expect(await ui.find({ key: 'menu-stop-mini-1' })).toBeDefined()

  await ui.press({ key: 'menu-more-mini-1' })
  expect(await ui.find({ key: 'details-stop-mini-1' })).toBeDefined()

  await ui.press({ key: 'details-stop-mini-1' })
  expect({ stopped, toasts }).toEqual({ stopped: ['mini-1'], toasts })
  expect(await ui.find({ key: 'details-stop-mini-1' })).toBeUndefined()
  await clock.advance(4000)
  expect(await actors(ui as never)).toHaveLength(1)
})

test('a left click on a mini opens the crew pane', async ($, on) => {
  engine(on)
  const opened: string[] = []
  on('ui.open', (_, e) => {
    opened.push(e.id)

    return { value: { isPlaced: true as const } }
  })
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing
  await ui.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'mini:mini-1' })
  await ui.pointer({ type: 'up', x: 0, y: 0, button: 'left', in: 'mini:mini-1' })
  expect({ opened, toasts }).toEqual({ opened: ['crew'], toasts })
})

test('a mini whose subagent the engine has finished goes home without its turn end', async ($, on) => {
  const clock = engine(on)
  let status = 'running'
  on('agent.list', () => ({ value: [{ id: 'mini-1', description: 'dig', type: 'general-purpose', status } as never] }))
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(6000)
  expect(await actors(ui)).toHaveLength(2)
  status = 'completed'
  await clock.advance(6000)
  expect(await actors(ui)).toHaveLength(1)
  await ui.unmount()
})

test('a subagent that left a server running goes home after a minute, and comes back if woken', async ($, on) => {
  const clock = engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'serve' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run dev', run_in_background: true, agentId: 'mini-1' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await $.turn.complete({ answer: 'up', durationMs: 1, reason: 'answer', isAborted: false, turnId: 's', agentId: 'mini-1' })
  await clock.advance(30_000)
  expect(await actors(ui)).toHaveLength(2)
  await clock.advance(40_000)
  expect(await actors(ui)).toHaveLength(1)

  await $.tool.call({ tool: 'Bash', command: 'curl localhost:3000', agentId: 'mini-1' } as never)
  expect(await actors(ui)).toHaveLength(2)
  await ui.unmount()
})

test('a click anywhere on the band cracks the whip', async ($, on) => {
  pin(on, 'lasso')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing & {
    findAll: (q: { type: 'Svg' }) => Promise<unknown[]>
  }
  const lashes = async () => (await ui.findAll({ type: 'Svg' })).filter(svg => JSON.stringify(svg).includes('Lasso')).length
  expect(await lashes()).toBe(0)
  await ui.pointer({ type: 'up', x: 30, y: 0, button: 'left', in: 'lash-backdrop' })
  expect(await lashes()).toBe(1)
})

test('with nobody else to lash, the lasso flies from where the person clicked to the mascot', async ($, on) => {
  pin(on, 'lasso')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as {
    post: (data: unknown, scope?: { in?: string }) => Promise<void>
    findAll: (q: { type: 'Svg' }) => Promise<unknown[]>
  }
  // The main mascot's region is 14 cells across: 8 units a cell.
  await ui.post({ size: { columns: 14, rows: 4 } }, { in: 'lash' })
  await ui.post({ button: 'left', x: 40, y: 3, columns: 120, rows: 4 }, { in: 'lash-backdrop' })
  const whip = (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Lasso'))
  expect(whip).toContain('translate(308.0,')
})

test('quick clicks each crack the whip, a press counting once, the next one left of the last too', async ($, on) => {
  pin(on, 'lasso')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing & {
    findAll: (q: { type: 'Svg' }) => Promise<unknown[]>
  }
  const lash = async () =>
    (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Lasso')) ?? ''
  await ui.pointer({ type: 'down', x: 60, y: 1, button: 'left', in: 'lash-backdrop' })
  await ui.pointer({ type: 'up', x: 60, y: 1, button: 'left', in: 'lash-backdrop' })
  expect(await lash()).toContain('id=\\"lash1\\"')
  await ui.pointer({ type: 'down', x: 40, y: 1, button: 'left', in: 'lash-backdrop' })
  await ui.pointer({ type: 'up', x: 40, y: 1, button: 'left', in: 'lash-backdrop' })
  expect(await lash()).toContain('id=\\"lash2\\"')
  await ui.pointer({ type: 'up', x: 30, y: 1, button: 'left', in: 'lash-backdrop' })
  expect(await lash()).toContain('id=\\"lash3\\"')
})

test('the minis stand from about the band middle, and a click between them and the mascot cracks the whip', async ($, on) => {
  pin(on, 'lasso')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing & {
    post: (data: unknown, scope?: { in?: string }) => Promise<void>
    findAll: (q: { type: 'Svg' }) => Promise<unknown[]>
  }
  const widths = async () => (await ui.findAll({ type: 'Svg' })).map(svg => (svg as { props: { width: number } }).props.width)
  await ui.post({ size: { columns: 14, rows: 4 } }, { in: 'lash' })
  await ui.post({ size: { columns: 120, rows: 4 } }, { in: 'lash-backdrop' })
  // The main mascot's region is a whole 67% of the 166-unit row: 7.94 units
  // a cell, a band 953 across. The main mascot's picture keeps the room up
  // to its middle: 112 + 338 units.
  expect(Math.max(...(await widths()))).toBe(480)
  await ui.post({ button: 'left', x: 10, y: 3, columns: 42, rows: 4 }, { in: 'lash-at-112' })
  const whip = (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Lasso'))
  expect(whip).toContain('id=\\"lash1\\"')
})

test('a lash flying from past the stage leaves a click region over its tail', async ($, on) => {
  pin(on, 'lasso')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing & {
    post: (data: unknown, scope?: { in?: string }) => Promise<void>
    findAll: (q: { type: 'Svg' }) => Promise<unknown[]>
  }
  const lash = async () =>
    (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Lasso')) ?? ''
  await ui.post({ size: { columns: 14, rows: 4 } }, { in: 'lash' })
  await ui.post({ button: 'left', x: 40, y: 3, columns: 120, rows: 4 }, { in: 'lash-backdrop' })
  expect(await lash()).toContain('translate(308.0,')
  // 112 units on, 5 cells in: the same spot the first click flew from.
  await ui.pointer({ type: 'down', x: 26, y: 3, button: 'left', in: 'lash-at-112' })
  await ui.pointer({ type: 'up', x: 26, y: 3, button: 'left', in: 'lash-at-112' })
  expect(await lash()).toContain('id=\\"lash2\\"')
  expect(await lash()).toContain('translate(308.0,')
})

test('the crew pane shows each mini as a card: its picture, task, model, status and buttons', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig', description: 'Dig a hole' } as never)
  await $.agent.spawn({ prompt: 'fill', description: 'Fill it in' } as never)
  const pane = (await $.ui.mount({
    plugin: 'mascot-crew',
    surface: 'desktop',
    component: 'Pane',
    requestId: 'crew',
    props: { title: 'Mini Claudes', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
  } as never)) as unknown as { findAll: (q: { type: string }) => Promise<unknown[]> }
  const text = JSON.stringify(await pane.findAll({ type: 'Text' }))
  expect(text).toContain('is waiting on 2 minis')
  expect(text).toContain('Dig a hole')
  expect(text).toContain('Fill it in')
  expect((await pane.findAll({ type: 'Svg' })).length).toBe(2)
  expect((await pane.findAll({ type: 'Button' })).length).toBe(4)
})

type Band = Drawing & {
  unmount: () => Promise<void>
  post: (data: unknown, scope?: { in?: string }) => Promise<void>
  findAll: (q: { type: string }) => Promise<unknown[]>
}
const drawings = async (ui: Band) => (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg))
// The bangs played, as the engine beneath the mod hears them.
const bangs = (on: On) => {
  const played: string[] = []
  on('audio.play', (_, e) => {
    played.push(JSON.stringify(e.clip))

    return { value: undefined }
  })

  return () => played.filter(clip => clip.includes('gunshot.wav')).length
}

test('with the revolver, the person shoots at the mascot feet: it hops, with a bang', async ($, on) => {
  pin(on, 'gun')
  engine(on)
  const played = bangs(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.post({ size: { columns: 14, rows: 4 } }, { in: 'lash' })
  await ui.post({ button: 'left', x: 40, y: 3, columns: 120, rows: 4 }, { in: 'lash-backdrop' })
  const all = await drawings(ui)
  const shot = all.find(svg => svg.includes('Gunshot')) ?? ''
  expect(shot).toContain('id=\\"lash1\\"')
  // The bullet lands at the feet, and the 💥 with it.
  expect(shot).toContain('💥')
  expect(all.some(svg => svg.includes('Lasso'))).toBe(false)
  // The mascot's own drawing hops; its work stays where it is.
  expect(all.find(svg => svg.includes('Claude at work')) ?? '').toContain('additive=\\"sum\\"')
  expect(played()).toBe(1)
})

test('with the revolver, the mascot shoots at each busy mini in turn, a bang for each', async ($, on) => {
  pin(on, 'gun')
  const clock = engine(on)
  const played = bangs(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  await $.agent.spawn({ prompt: 'fill' } as never)
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.pointer({ type: 'up', x: 30, y: 0, button: 'left', in: 'lash-backdrop' })
  const all = await drawings(ui)
  expect(all.some(svg => svg.includes('Gunshot'))).toBe(true)
  const minis = all.filter(svg => svg.includes('Mini at work'))
  expect(minis.length).toBe(2)
  for (const mini of minis) expect(mini).toContain('additive=\\"sum\\"')
  await clock.advance(1000)
  expect(played()).toBe(2)
})

test('in the terminal, the revolver fires at the minis and they hop', async ($, on) => {
  pin(on, 'gun')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = (await $.ui.mount({ ...BAND, surface: 'terminal' })) as unknown as Band
  await ui.press({ key: 'whip' })
  const text = JSON.stringify(await ui.findAll({ type: 'Text' }))
  expect(text).toContain('⌐╦╦═─')
  expect(text).toContain('💥')
})

test('one run punishes with one weapon, every click; the next run with the other', async ($, on) => {
  const clock = engine(on)
  const played: string[] = []
  on('audio.play', (_, e) => {
    const clip = JSON.stringify(e.clip)
    if (clip.includes('gunshot.wav')) played.push('gun')
    if (clip.includes('whip.wav')) played.push('lasso')
    if (clip.includes('splat.wav')) played.push('tomato')
    if (clip.includes('bow.wav')) played.push('bow')

    return { value: undefined }
  })
  const run = async (turnId: string) => {
    await $.turn.start({ text: 'go', turnId })
    const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing
    for (let k = 0; k < 3; k += 1) {
      await ui.pointer({ type: 'up', x: 30 + k, y: 0, button: 'left', in: 'lash-backdrop' })
      await clock.advance(1500)
    }
    await $.turn.complete({ answer: 'ok', durationMs: 1, reason: 'answer', isAborted: false, turnId })
    await clock.advance(10_000)
    const weapons = played.splice(0)

    return weapons
  }
  const first = await run('t1')
  expect(first.length).toBe(3)
  expect(new Set(first).size).toBe(1)
  const second = await run('t2')
  expect(new Set(second).size).toBe(1)
  expect(second[0]).not.toBe(first[0])
})

// The squelches played, as the engine beneath the mod hears them.
const squelches = (on: On) => {
  const played: string[] = []
  on('audio.play', (_, e) => {
    played.push(JSON.stringify(e.clip))

    return { value: undefined }
  })

  return () => played.filter(clip => clip.includes('splat.wav')).length
}

test('with a tomato, the person throws it in the mascot face: it splats there, with a squelch', async ($, on) => {
  pin(on, 'tomato')
  const clock = engine(on)
  const played = squelches(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.post({ size: { columns: 14, rows: 4 } }, { in: 'lash' })
  await ui.post({ button: 'left', x: 40, y: 3, columns: 120, rows: 4 }, { in: 'lash-backdrop' })
  const all = await drawings(ui)
  const tomato = all.find(svg => svg.includes('Tomato')) ?? ''
  expect(tomato).toContain('id=\\"lash1\\"')
  // It flies from the person's hand, left of where they clicked.
  expect(tomato).toContain('path=\\"M308.0 ')
  expect(all.some(svg => svg.includes('Lasso') || svg.includes('Gunshot'))).toBe(false)
  // The squelch comes as it lands, not as it leaves the hand.
  expect(played()).toBe(0)
  await clock.advance(400)
  expect(played()).toBe(1)
})

test('with a tomato, the mascot throws one at each busy mini in turn, a squelch for each', async ($, on) => {
  pin(on, 'tomato')
  const clock = engine(on)
  const played = squelches(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  await $.agent.spawn({ prompt: 'fill' } as never)
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.pointer({ type: 'up', x: 30, y: 0, button: 'left', in: 'lash-backdrop' })
  const tomato = (await drawings(ui)).find(svg => svg.includes('Tomato')) ?? ''
  expect(tomato.split('<animateMotion').length - 1).toBe(2)
  await clock.advance(1000)
  expect(played()).toBe(2)
})

test('in the terminal, the mascot throws tomatoes at the minis and they splat', async ($, on) => {
  pin(on, 'tomato')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  const ui = (await $.ui.mount({ ...BAND, surface: 'terminal' })) as unknown as Band
  await ui.press({ key: 'whip' })
  const text = JSON.stringify(await ui.findAll({ type: 'Text' }))
  expect(text).toContain('🍅')
  expect(text).toContain('💦')
})

test('the band speaks English until its gear picks Ukrainian, which the next session keeps', async ($, on) => {
  const stored = new Map<string, unknown>()
  on('store.get', (_, e) => ({ value: stored.get(e.key) }))
  on('store.set', (_, e) => {
    stored.set(e.key, e.value)

    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }) as never)
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const label = async (ui: Band & { find: (q: { key: string }) => Promise<unknown> }, key: string) =>
    JSON.stringify(await ui.find({ key }))
  type Gear = Band & { find: (q: { key: string }) => Promise<unknown>; unmount: () => Promise<void> }
  const term = (await $.ui.mount({ ...BAND, surface: 'terminal' })) as unknown as Gear
  expect(await label(term, 'whip')).toContain('FASTER')
  // The languages show once the gear is pressed.
  expect(await term.find({ key: 'lang-uk' })).toBeUndefined()
  await term.press({ key: 'gear' })
  await term.press({ key: 'lang-uk' })
  expect(await label(term, 'whip')).toContain('ШВИДШЕ')
  expect(await term.find({ key: 'lang-uk' })).toBeUndefined()
  expect(stored.get('lang')).toBe('uk')
  await term.unmount()
  // The desktop's gear sits in the band's corner; it speaks the same.
  const desk = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Gear
  expect(await desk.find({ key: 'gear-button' })).toBeDefined()
  expect((await drawings(desk)).some(svg => svg.includes('Клод працює'))).toBe(true)
  expect(await desk.find({ key: 'lash-backdrop' })).toBeDefined()
  await desk.press({ key: 'gear-button' })
  // While its menu is open, no click region can take a click meant for it.
  expect(await desk.find({ key: 'lash-backdrop' })).toBeUndefined()
  expect(await desk.find({ key: 'lash' })).toBeUndefined()
  await desk.press({ key: 'lang-en' })
  expect((await drawings(desk)).some(svg => svg.includes('Claude at work'))).toBe(true)
  expect(await desk.find({ key: 'lash-backdrop' })).toBeDefined()
  expect(stored.get('lang')).toBe('en')
  // A new session reads it back.
  stored.set('lang', 'uk')
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true } as never)
  await $.turn.start({ text: 'go', turnId: 't2' })
  const again = (await $.ui.mount({ ...BAND, surface: 'terminal' })) as unknown as Gear
  expect(await label(again, 'whip')).toContain('ШВИДШЕ')
})

test('quick tomato clicks each throw one more, none cutting the others short', async ($, on) => {
  pin(on, 'tomato')
  const clock = engine(on)
  const played = squelches(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.post({ size: { columns: 14, rows: 4 } }, { in: 'lash' })
  for (const x of [40, 50, 60]) {
    await ui.post({ button: 'left', x, y: 3, columns: 120, rows: 4 }, { in: 'lash-backdrop' })
    await clock.advance(100)
  }
  const tomato = (await drawings(ui)).find(svg => svg.includes('Tomato')) ?? ''
  for (const n of [1, 2, 3]) expect(tomato).toContain(`id=\\"lash${n}\\"`)
  expect(tomato.split('<animateMotion').length - 1).toBe(3)
  await clock.advance(1000)
  expect(played()).toBe(3)
  // Once they have all dripped away, the band drawn again draws none.
  await clock.advance(2000)
  await ui.unmount()
  const again = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  expect((await drawings(again)).some(svg => svg.includes('Tomato'))).toBe(false)
})

test('while it waits, the mascot holds the run\'s own weapon: the whip, the revolver or a tomato', async ($, on) => {
  // What each weapon looks like in its hand, drawn by nothing else: the
  // whip's lash, the revolver's barrel, the tomato's shine.
  const looks = {
    lasso: 'Q9 -4 7 3',
    gun: 'width=\\"7.4\\" height=\\"1.8\\"',
    tomato: '#ff8a80',
    bow: 'M-4.5 -10.5 L-4.50 0 L-4.5 10.5',
  } as const
  let armed: keyof typeof looks = 'lasso'
  on('state.get', { plugin: 'mascot-crew', key: 'armed' }, () => ({ value: { value: armed, version: 1 } }))
  const clock = engine(on)
  for (const weapon of ['lasso', 'gun', 'tomato', 'bow'] as const) {
    armed = weapon
    await $.turn.start({ text: 'go', turnId: `t-${weapon}` })
    await $.agent.spawn({ prompt: 'dig' } as never)
    await clock.advance(2500)
    const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
    const main = (await drawings(ui)).find(svg => svg.includes('Claude waits')) ?? ''
    expect(main).toContain(looks[weapon])
    for (const other of Object.keys(looks) as (keyof typeof looks)[]) {
      if (other !== weapon) expect(main).not.toContain(looks[other])
    }
    await ui.unmount()
  }
})

test('the gear turns weapons off: a run never picks one that is off, the last stays on, the next session keeps it', async ($, on) => {
  const stored = new Map<string, unknown>()
  on('store.get', (_, e) => ({ value: stored.get(e.key) }))
  on('store.set', (_, e) => {
    stored.set(e.key, e.value)

    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }) as never)
  const clock = engine(on)
  const played: string[] = []
  on('audio.play', (_, e) => {
    const clip = JSON.stringify(e.clip)
    if (clip.includes('gunshot.wav')) played.push('gun')
    if (clip.includes('whip.wav')) played.push('lasso')
    if (clip.includes('splat.wav')) played.push('tomato')

    return { value: undefined }
  })
  type Gear = Band & { find: (q: { key: string }) => Promise<unknown>; unmount: () => Promise<void> }
  const label = async (ui: Gear, key: string) => JSON.stringify(await ui.find({ key }))
  await $.turn.start({ text: 'go', turnId: 't0' })
  const desk = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Gear
  // All on at first.
  await desk.press({ key: 'gear-button' })
  for (const one of ['lasso', 'gun', 'tomato', 'bow']) expect(await label(desk, `weapon-${one}`)).toContain('☑')
  // Off with the revolver, the tomato and the bow; the menu stays open meanwhile.
  await desk.press({ key: 'weapon-gun' })
  await desk.press({ key: 'weapon-tomato' })
  await desk.press({ key: 'weapon-bow' })
  expect(await label(desk, 'weapon-bow')).toContain('☐')
  expect(await label(desk, 'weapon-gun')).toContain('☐')
  expect(await label(desk, 'weapon-tomato')).toContain('☐')
  // The lasso, the last one on, stays on.
  await desk.press({ key: 'weapon-lasso' })
  expect(await label(desk, 'weapon-lasso')).toContain('☑')
  expect(toasts.some(text => text.includes('At least one weapon'))).toBe(true)
  expect(stored.get('arsenal')).toEqual(['lasso'])
  await desk.press({ key: 'gear-button' })
  await desk.unmount()
  await $.turn.complete({ answer: 'ok', durationMs: 1, reason: 'answer', isAborted: false, turnId: 't0' })
  await clock.advance(10_000)
  // Run after run, only the lasso.
  for (const turnId of ['t1', 't2', 't3', 't4']) {
    await $.turn.start({ text: 'go', turnId })
    const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Gear
    await ui.pointer({ type: 'up', x: 30, y: 0, button: 'left', in: 'lash-backdrop' })
    await clock.advance(1500)
    await ui.unmount()
    await $.turn.complete({ answer: 'ok', durationMs: 1, reason: 'answer', isAborted: false, turnId })
    await clock.advance(10_000)
  }
  expect(played).toEqual(['lasso', 'lasso', 'lasso', 'lasso'])
  // A new session reads the choice back; the terminal's gear shows it too.
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true } as never)
  await $.turn.start({ text: 'go', turnId: 't5' })
  const term = (await $.ui.mount({ ...BAND, surface: 'terminal' })) as unknown as Gear
  await term.press({ key: 'gear' })
  expect(await label(term, 'weapon-gun')).toContain('☐')
  expect(await label(term, 'weapon-lasso')).toContain('☑')
  await term.press({ key: 'weapon-tomato' })
  expect(stored.get('arsenal')).toEqual(['lasso', 'tomato'])
})

// The sounds played, as the engine beneath the mod hears them.
const clips = (on: On) => {
  const played: string[] = []
  on('audio.play', (_, e) => {
    const clip = JSON.stringify(e.clip)
    if (clip.includes('bow.wav')) played.push('twang')
    if (clip.includes('thud.wav')) played.push('thud')

    return { value: undefined }
  })

  return played
}
// One step of a press, as the click region posts it: where in its cells
// (3 rows tall), on the main mascot's region or the bare band's.
const bowStep = (ui: Band, press: 'down' | 'move' | 'up', x: number, y: number, region = 'lash') =>
  ui.post({ press, x, y, columns: 120, rows: 3 }, { in: region })
const arrowsOf = (all: string[]) => all.filter(svg => svg.includes('Bow and arrow') && svg.includes('animateMotion'))

test('with the bow, a press draws the string, the cursor aims it, and letting go looses an arrow into the mascot', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  const played = clips(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  // 8 units a cell: the press is 100 units right, 23 down; the bow is held
  // 12 units right of it.
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  await bowStep(ui, 'down', 12.5, 2)
  const drawn = (await drawings(ui)).find(svg => svg.includes('Bow and arrow')) ?? ''
  // The person's fist holds the bow right of where they pressed, its string
  // drawing.
  expect(drawn).toContain('cx=\\"112.0\\"')
  expect(drawn).toContain('attributeName=\\"d\\"')
  expect(played).toEqual([])
  // Aimed left at the mascot, drawn to full, let go.
  await bowStep(ui, 'move', 2, 2)
  await clock.advance(2100)
  await bowStep(ui, 'up', 2, 2)
  const all = await drawings(ui)
  const arrow = arrowsOf(all)
  expect(arrow.length).toBe(1)
  expect(arrow[0]).toContain('id=\\"lash1\\"')
  expect(arrow[0]).toContain('rotate=\\"auto\\"')
  // No bow is drawn any more.
  expect(all.filter(svg => svg.includes('Bow and arrow')).length).toBe(1)
  expect(played).toEqual(['twang'])
  await clock.advance(200)
  expect(played).toEqual(['twang', 'thud'])
})

test('with the bow, a weak shot from far away falls short: no thud', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  const played = clips(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  // A real hold first: from now on, how long it is held is how hard it shoots.
  await bowStep(ui, 'down', 12.5, 2)
  await clock.advance(2100)
  await bowStep(ui, 'up', 2, 2)
  await clock.advance(4000)
  expect(played).toEqual(['twang', 'thud'])
  // Pressed far out on the bare band, aimed at the mascot, let go at once.
  await bowStep(ui, 'down', 60, 2, 'lash-backdrop')
  await bowStep(ui, 'move', 2, 2, 'lash-backdrop')
  await bowStep(ui, 'up', 2, 2, 'lash-backdrop')
  expect(arrowsOf(await drawings(ui)).length).toBe(1)
  await clock.advance(4000)
  expect(played).toEqual(['twang', 'thud', 'twang'])
})

test('with the bow, a press and release that come together shoot a strong arrow straight at the mascot', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  const played = clips(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  // Only the release reaches the mod, out on the bare band (from much
  // farther a quick shot falls short).
  await bowStep(ui, 'up', 25, 2, 'lash-backdrop')
  expect(arrowsOf(await drawings(ui)).length).toBe(1)
  await clock.advance(1000)
  expect(played).toEqual(['twang', 'thud'])
})

test('with the lasso, a press shows it ready in the fist, and letting go cracks it', async ($, on) => {
  pin(on, 'lasso')
  const clock = engine(on)
  const cracks: string[] = []
  on('audio.play', (_, e) => {
    if (JSON.stringify(e.clip).includes('whip.wav')) cracks.push('crack')

    return { value: undefined }
  })
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  await bowStep(ui, 'down', 12.5, 2)
  const ready = (await drawings(ui)).find(svg => svg.includes('Lasso')) ?? ''
  // The fist two cells left of the pointer, the whip in it, nothing cracked yet.
  expect(ready).toContain('cx=\\"84.0\\"')
  expect(ready).toContain('repeatCount=\\"indefinite\\"')
  expect(cracks).toEqual([])
  await clock.advance(500)
  await bowStep(ui, 'up', 12.5, 2)
  expect(cracks).toEqual(['crack'])
  // The ready whip is gone; the lash's own drawing swings it.
  expect((await drawings(ui)).some(svg => svg.includes('Lasso') && svg.includes('indefinite'))).toBe(false)
})

test('with the bow, arrows stack up in the mascot, each one falling off a second after it hit', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  for (let k = 0; k < 3; k += 1) {
    await bowStep(ui, 'down', 12.5, 2)
    await bowStep(ui, 'move', 2, 1.6 + k * 0.4)
    // Half drawn, quick: all three are still in it.
    await clock.advance(400)
    await bowStep(ui, 'up', 2, 1.6 + k * 0.4)
    await clock.advance(100)
  }
  const arrow = arrowsOf(await drawings(ui))[0] ?? ''
  for (const n of [1, 2, 3]) expect(arrow).toContain(`id=\\"lash${n}\\"`)
  // Stuck for a second of a 1.95 s life, then a fall to the ground.
  expect(arrow.split('keyTimes=\\"0;0.513;0.692;1\\"').length - 1).toBe(6)
})

test('with the bow, the mascot shoots one arrow at the minis, aimed and drawn as the person does', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  const played = clips(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  await $.agent.spawn({ prompt: 'fill' } as never)
  await clock.advance(2500)
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band
  // 10 units a cell; the first mini's chest is at (134, 32).
  await ui.post({ size: { columns: 11, rows: 3 } }, { in: 'lash' })
  await bowStep(ui, 'down', 13.4, 2.62, 'lash-backdrop')
  const aiming = await drawings(ui)
  // The mascot's own bow leaves its hand for the one it draws.
  expect(aiming.find(svg => svg.includes('Claude waits')) ?? '').toContain('dur=\\"3600.00s\\"')
  const bow = aiming.find(svg => svg.includes('Bow and arrow')) ?? ''
  expect(bow).toContain('translate(42.0,25.0)')
  await clock.advance(1100)
  await bowStep(ui, 'up', 13.4, 2.62, 'lash-backdrop')
  const arrow = arrowsOf(await drawings(ui))
  expect(arrow.length).toBe(1)
  expect(arrow[0]?.split('<animateMotion').length).toBe(2)
  // It struck the first mini: its eyes shut.
  expect(arrow[0]).toContain('translate(122,20.8) scale(0.6)')
  await clock.advance(300)
  expect(played).toEqual(['twang', 'thud'])
})

test('with the bow, the click region reports a press, its moves and its release', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  const played = clips(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band & {
    pointer: (event: { type: 'down' | 'move' | 'up'; x: number; y: number; button: 'left'; in?: string }) => Promise<void>
  }
  await ui.pointer({ type: 'down', x: 12, y: 1, button: 'left', in: 'lash' })
  expect((await drawings(ui)).some(svg => svg.includes('Bow and arrow'))).toBe(true)
  await ui.pointer({ type: 'move', x: 2, y: 1, button: 'left', in: 'lash' })
  await clock.advance(600)
  await ui.pointer({ type: 'up', x: 2, y: 1, button: 'left', in: 'lash' })
  expect(arrowsOf(await drawings(ui)).length).toBe(1)
  expect(played[0]).toBe('twang')
})

test('on the desktop, the region under the pointer draws the weapon in hand while held, the bow drawing as it is held', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band & {
    pointer: (event: { type: 'down' | 'move' | 'up'; x: number; y: number; button: 'left'; in?: string }) => Promise<void>
    drawn: (scope: { in: string }) => Promise<unknown>
    advance: (ms: number) => Promise<void>
  }
  // 8 units a cell.
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  const region = async () => JSON.stringify(await ui.drawn({ in: 'lash' }))
  await ui.pointer({ type: 'down', x: 12, y: 2, button: 'left', in: 'lash' })
  // The bow in the fist right of where it was pressed (100 units in, the bow
  // 12 more), barely drawn.
  const pressed = await region()
  expect(pressed).toContain('"type":"Svg"')
  expect(pressed).toContain('translate(112.0,')
  expect(pressed).toContain('width=\\"1.0\\"')
  await clock.advance(2200)
  await ui.advance(2200)
  // Drawn to full: the bar is red, the bow trembles.
  const full = await region()
  expect(full).toContain('#e53935')
  expect(full).toContain('repeatCount=\\"indefinite\\"')
  await ui.pointer({ type: 'up', x: 2, y: 2, button: 'left', in: 'lash' })
  expect(await region()).not.toContain('"type":"Svg"')
})

test('on the desktop, the bow stays where it was pressed while held, turning to the pointer', async ($, on) => {
  pin(on, 'bow')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band & {
    pointer: (event: { type: 'down' | 'move' | 'up'; x: number; y: number; button: 'left'; in?: string }) => Promise<void>
    drawn: (scope: { in: string }) => Promise<unknown>
  }
  // 8 units a cell.
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  const region = async () => JSON.stringify(await ui.drawn({ in: 'lash' }))
  const angleOf = (drawn: string) => drawn.match(/translate\(112\.0,[\d.-]+\) rotate\(([\d.-]+)\)/)?.[1]
  await ui.pointer({ type: 'down', x: 12, y: 2, button: 'left', in: 'lash' })
  const pressed = await region()
  const before = angleOf(pressed)
  expect(before).toBeDefined()
  expect(pressed).not.toContain('additive=\\"sum\\"')
  // Moved up and to the right: the bow is still at 112 units, aimed anew,
  // and sweeps there from the last aim rather than jumping.
  await ui.pointer({ type: 'move', x: 13, y: 0, button: 'left', in: 'lash' })
  const moved = await region()
  const after = angleOf(moved)
  expect(after).toBeDefined()
  expect(after).not.toBe(before)
  expect(moved).toContain('additive=\\"sum\\"')
  expect(moved).toContain('to=\\"0\\" dur=\\"120ms\\"')
  await ui.pointer({ type: 'up', x: 13, y: 0, button: 'left', in: 'lash' })
})

test('on the desktop, a press that has the mascot shoot at the minis draws the string on its own bow, nothing under the pointer', async ($, on) => {
  pin(on, 'bow')
  const clock = engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig' } as never)
  await $.agent.spawn({ prompt: 'fill' } as never)
  await clock.advance(2500)
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Band & {
    pointer: (event: { type: 'down' | 'move' | 'up'; x: number; y: number; button: 'left'; in?: string }) => Promise<void>
    drawn: (scope: { in: string }) => Promise<unknown>
    advance: (ms: number) => Promise<void>
  }
  await ui.post({ size: { columns: 14, rows: 3 } }, { in: 'lash' })
  const region = async (key: string) => JSON.stringify(await ui.drawn({ in: key }))
  await ui.pointer({ type: 'down', x: 1, y: 2, button: 'left', in: 'lash-backdrop' })
  await ui.advance(500)
  expect(await region('lash-backdrop')).not.toContain('"type":"Svg"')
  // The mascot's own region draws its bow where it holds it, a quarter drawn.
  const main = await region('lash')
  expect(main).toContain('translate(41.0,25.0) rotate(0.0) scale(0.8)')
  expect(main).toContain('width=\\"4.0\\"')
  await ui.pointer({ type: 'up', x: 1, y: 2, button: 'left', in: 'lash-backdrop' })
  await ui.advance(100)
  expect(await region('lash')).not.toContain('"type":"Svg"')
})
