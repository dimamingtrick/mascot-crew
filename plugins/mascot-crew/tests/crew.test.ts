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
  pointer: (event: { type: 'down' | 'up'; x: number; y: number; button: 'left' | 'right'; in?: string }) => Promise<void>
}
const lash = (ui: Drawing, surface: 'terminal' | 'desktop') =>
  surface === 'terminal'
    ? ui.press({ key: 'whip' })
    : ui.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'lash' })

// A run punishes with a weapon picked at random; this arms it with one.
const pin = (on: On, weapon: 'lasso' | 'gun') =>
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
  await $.agent.spawn({ prompt: 'dig', description: 'Найти баг в авторизации' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(JSON.stringify(await ui.findAll({ type: 'Svg' }))).toContain('Клодик говорит: Haiku: Найти баг в авторизации')
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

test('the hover keeps the task given while the subagent calls tools', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig', description: 'Тестовый сабагент' } as never)
  await $.tool.call({ tool: 'Bash', command: 'sleep 95', description: 'Wait for 95 seconds', agentId: 'mini-1' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const drawn = JSON.stringify(await ui.findAll({ type: 'Svg' }))
  expect(drawn).toContain('Клодик говорит: Haiku: Тестовый сабагент')
  expect(drawn).not.toContain('Клодик говорит: Haiku: Wait for 95 seconds')
  await ui.unmount()
})

test('a right click on a mini opens its menu, and Stop stops its subagent', async ($, on) => {
  const clock = engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.agent.spawn({ prompt: 'dig', description: 'Копать' } as never)
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
  const lashes = async () => (await ui.findAll({ type: 'Svg' })).filter(svg => JSON.stringify(svg).includes('Хлыст')).length
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
  const whip = (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Хлыст'))
  expect(whip).toContain('translate(324.0,')
})

test('quick clicks each crack the whip, a press counting once, the next one left of the last too', async ($, on) => {
  pin(on, 'lasso')
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't' })
  const ui = (await $.ui.mount({ ...BAND, surface: 'desktop' })) as unknown as Drawing & {
    findAll: (q: { type: 'Svg' }) => Promise<unknown[]>
  }
  const lash = async () =>
    (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Хлыст')) ?? ''
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
  const whip = (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Хлыст'))
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
    (await ui.findAll({ type: 'Svg' })).map(svg => JSON.stringify(svg)).find(svg => svg.includes('Хлыст')) ?? ''
  await ui.post({ size: { columns: 14, rows: 4 } }, { in: 'lash' })
  await ui.post({ button: 'left', x: 40, y: 3, columns: 120, rows: 4 }, { in: 'lash-backdrop' })
  expect(await lash()).toContain('translate(324.0,')
  // 112 units on, 5 cells in: the same spot the first click flew from.
  await ui.pointer({ type: 'down', x: 26, y: 3, button: 'left', in: 'lash-at-112' })
  expect(await lash()).toContain('id=\\"lash2\\"')
  expect(await lash()).toContain('translate(324.0,')
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
    props: { title: 'Клодики', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
  } as never)) as unknown as { findAll: (q: { type: string }) => Promise<unknown[]> }
  const text = JSON.stringify(await pane.findAll({ type: 'Text' }))
  expect(text).toContain('ждёт 2 клодиков')
  expect(text).toContain('Dig a hole')
  expect(text).toContain('Fill it in')
  expect((await pane.findAll({ type: 'Svg' })).length).toBe(2)
  expect((await pane.findAll({ type: 'Button' })).length).toBe(4)
})

type Band = Drawing & {
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
  const shot = all.find(svg => svg.includes('Выстрел')) ?? ''
  expect(shot).toContain('id=\\"lash1\\"')
  // The bullet lands at the feet, and the 💥 with it.
  expect(shot).toContain('💥')
  expect(all.some(svg => svg.includes('Хлыст'))).toBe(false)
  // The mascot's own drawing hops; its work stays where it is.
  expect(all.find(svg => svg.includes('Клод работает')) ?? '').toContain('additive=\\"sum\\"')
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
  expect(all.some(svg => svg.includes('Выстрел'))).toBe(true)
  const minis = all.filter(svg => svg.includes('Клодик работает'))
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
