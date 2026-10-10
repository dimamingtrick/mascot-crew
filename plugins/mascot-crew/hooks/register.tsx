import { atom, read, update } from 'claude-code'
import type { AgentInfo, Elements, EngineInterface, Register, Timer } from 'claude-code'

import type { Lash, Mini, Popup, Scene, Whip } from '../types'
import type { Job, Stage, TermPose } from './art'
import {
  JOBS,
  HEIGHT,
  MAIN_WIDTH,
  PAIN_MS,
  MINI_WIDTH,
  SCALE,
  CALL_MS,
  FINISH_MS,
  WHIP_MS,
  jobOf,
  jumpingDown,
  stageWidth,
  fxWidth,
  finishing,
  miniAtDesk,
  ENTER_MS,
  EXIT_MS,
  deskX,
  leaveMs,
  miniGone,
  miniWorking,
  rising,
  shiftTime,
  speechBubble,
  saluting,
  termMain,
  termMini,
  waiting,
  stageFx,
  working,
} from './art'

const IDLE: Scene = {
  isWorking: false,
  isSaluting: false,
  job: -1,
  handoffAt: 0,
  enterAt: 0,
  leaveAt: 0,
  minis: [],
}
const scene = atom({ plugin: 'mascot-crew', key: 'scene' } as const, IDLE)

const tick = atom({ plugin: 'mascot-crew', key: 'tick' } as const, 0)
// Read by the terminal's drawing alone: the desktop does not redraw when a
// lash ends.
const whip = atom({ plugin: 'mascot-crew', key: 'whip' } as const, 'none' as Whip)
const NO_LASH: Lash = { n: 0, kind: 'self', row: '', at: 0, isStreak: false }
const lash = atom({ plugin: 'mascot-crew', key: 'lash' } as const, NO_LASH)
// The right-click menu or the details card open over one mini, if any.
const popup = atom({ plugin: 'mascot-crew', key: 'popup' } as const, null as Popup)

const SALUTE_MS = 4000
const FRAME_MS = 300
const ORANGE = '#D97757'
const MAX_MINIS = 6
// Rows of cells that cover the main mascot's height. The desktop sizes a
// Client by what it draws, so it draws this many rows.
const CLICK_ROWS = 4
// How often the stage is checked against the engine's own record of its
// agents, and how long one asked-about mini is left alone after.
const SWEEP_MS = 2000
const ASK_EVERY_MS = 10_000
const CREW_PANE = 'crew'
const howLong = (given: string) =>
  `How much longer for the subagent "${given}"? Briefly: what stage is it at, and roughly how long until its result?`

// A random profession none of `taken` has; any one once all are taken.
const pickJob = (...taken: number[]) => {
  const free = JOBS.map((_, job) => job).filter(job => !taken.includes(job))
  const from = free.length > 0 ? free : JOBS.map((_, job) => job)

  return from[Math.floor(Math.random() * from.length)] ?? 0
}

let saluteTimer: Timer | undefined
let exitTimer: Timer | undefined
let whipTimer: Timer | undefined
let frameTimer: Timer | undefined
let sweepTimer: Timer | undefined
// When the main turn last started and the salute began: what the sweep
// measures a stuck stage by.
let turnStartedAt = 0
let saluteAt = 0
// Per mini: when it was last asked about, and since when its subagent has
// sat with its turn over and no tool called (waiting on its own background
// work, a server it started perhaps, that may never end).
const askedAt = new Map<string, number>()
const pausedAt = new Map<string, number>()
// A subagent paused this long has done its work: its mini goes home and the
// work it left running stays in the background tasks. One woken later
// comes back.
const IDLE_MS = 60_000
// Every subagent spawned this session: one woken after its mini went home
// climbs out again.
const known = new Set<string>()
// Frames tick only for a terminal: the desktop's drawings animate themselves.
let isTerminalDrawn = false
// Per subagent: the background work it started and has not yet been woken
// by, and the timer taking its mini off stage.
const waitsOf = new Map<string, number>()
const leaving = new Map<string, Timer>()

// Writes the scene only when it changes: every write redraws the band.
async function patchScene($: EngineInterface, fn: (s: Scene) => Scene) {
  const now = await read($, scene)
  if (JSON.stringify(fn(now)) === JSON.stringify(now)) return
  await update($, scene, fn)
}

const isOnStage = (now: Scene) =>
  now.isWorking || now.isSaluting || now.leaveAt > 0 || now.minis.length > 0

// The lowest place in the row nobody holds.
const freeSlot = (minis: readonly Mini[]) => {
  let slot = 0
  while (minis.some(mini => mini.slot === slot)) slot += 1

  return slot
}

// A model id or alias as people name it: `claude-sonnet-5-5` → `Sonnet 5.5`,
// `claude-haiku-4-5-20251001` → `Haiku 4.5`, `opus` → `Opus`; anything else
// as it came.
const modelName = (model: string) => {
  const id = model.replace(/\[.*\]$/, '').toLowerCase()
  const family = /(opus|sonnet|haiku|fable)/.exec(id)?.[1]
  if (family === undefined) return model
  const name = family[0]?.toUpperCase() + family.slice(1)
  const after = new RegExp(`${family}-(\\d{1,2})(?:-(\\d{1,2}))?(?!\\d)`).exec(id)
  const before = new RegExp(`(\\d{1,2})-(\\d{1,2})-${family}`).exec(id)
  const version = after ?? before
  if (version === null) return name

  return `${name} ${version[1]}${version[2] === undefined ? '' : `.${version[2]}`}`
}

// What a mini's bubble says: its model, then what it is doing now.
const bubbleText = (mini: Mini) => (mini.model === '' ? mini.task : `${mini.model}: ${mini.task}`)

const newMini = (s: Scene, id: string, at: number, task = '', type = '', model = ''): Mini => ({
  id,
  // Unique on stage: not the main mascot's, nor another mini's.
  job: pickJob(s.job, ...s.minis.map(mini => mini.job)),
  isDone: false,
  isSettled: false,
  at,
  doneAt: 0,
  fromX: 0,
  slot: freeSlot(s.minis),
  task,
  given: task,
  type,
  model,
  tools: 0,
  recent: [],
})

// Leaves the stage: the main mascot hops down under the prompt first.
async function exitStage($: EngineInterface) {
  const at = await $.clock.now()
  await patchScene($, s => ({ ...s, isSaluting: false, leaveAt: at }))
  exitTimer?.cancel()
  exitTimer = $.clock.after(EXIT_MS + 100, () => {
    void patchScene($, s => ({ ...s, leaveAt: 0 }))
  })
}

// The terminal's frames: a tick redraws the band while anyone is on stage.
async function nextFrame($: EngineInterface) {
  if (isOnStage(await read($, scene))) {
    await update($, tick, n => n + 1)
  } else {
    frameTimer?.cancel()
    frameTimer = undefined
  }
}

function startFrames($: EngineInterface) {
  if (!isTerminalDrawn) return
  frameTimer ??= $.clock.every(FRAME_MS, () => {
    void nextFrame($)
  })
}

// The surface may load a drawing again on any redraw, which plays its
// animation from the start: what has already happened is drawn as done.
const WALK_IN_MS = 1100
// A lash is drawn while it can still be seen: its crack and the pain after.
const LASH_FRESH_MS = PAIN_MS + 150

// A redraw may load every drawing again; each is drawn as far into its
// animation as it already got, so a redraw (a lash, a mini coming or going)
// never makes anyone start their swing over.
const miniSvg = (mini: Mini, job: Job, at: number) =>
  mini.isDone
    ? { source: miniGone(), alt: 'Клодик сдал работу и пошёл к Клоду' }
    : {
        source:
          mini.isSettled || at - mini.at > WALK_IN_MS
            ? shiftTime(miniAtDesk(job), (at - mini.at) / 1000)
            : shiftTime(
                miniWorking(job, Math.max(0, mini.at - at) / 1000),
                Math.max(0, at - mini.at) / 1000,
              ),
        alt: `Клодик работает: ${job.name}`,
      }

const shown = (now: Scene) => now.minis.filter(mini => mini.slot < MAX_MINIS)

// The row the whip is drawn over: the main mascot's pose and every mini.
const rowOf = (now: Scene) =>
  `${now.minis.length > 0 ? 'wait' : now.isWorking ? 'work' : 'salute'}|${shown(now)
    .map(mini => `${mini.slot}:${mini.id}${mini.isDone ? '.' : ''}`)
    .join(',')}`

// One place per slot up to the last one held, empty ones included: nobody
// shifts when a mini leaves, and the main mascot keeps one width.
const slotsOf = (now: Scene) =>
  Array.from(
    { length: Math.max(0, ...shown(now).map(mini => mini.slot + 1)) },
    (_, slot) => shown(now).find(mini => mini.slot === slot),
  )

const stageOf = (now: Scene): Stage => ({
  mainWidth: MAIN_WIDTH,
  minis: slotsOf(now).map(mini => ({ isBusy: mini !== undefined && !mini.isDone })),
})

// The mini of a finished subagent salutes and jumps under the prompt.
async function sendMiniHome($: EngineInterface, id: string) {
  const at = await $.clock.now()
  const slot = (await read($, scene)).minis.find(mini => mini.id === id)?.slot ?? 0
  const fromX = deskX(slot)
  await patchScene($, s => ({
    ...s,
    minis: s.minis.map(mini => (mini.id === id ? { ...mini, isDone: true, doneAt: at, fromX } : mini)),
  }))
  leaving.get(id)?.cancel()
  leaving.set(
    id,
    $.clock.after(leaveMs(fromX) + 100, () => {
      leaving.delete(id)
      waitsOf.delete(id)
      void patchScene($, s => ({
        ...s,
        minis: s.minis.filter(mini => mini.id !== id),
      })).then(() => saluteWhenDone($))
    }),
  )
}

// A subagent that calls a tool is at work: one whose mini was already on its
// way out (the subagent was resumed) is put back at its desk.
async function keepMiniBusy($: EngineInterface, id: string) {
  const at = await $.clock.now()
  const mini = (await read($, scene)).minis.find(one => one.id === id)
  if (mini !== undefined && !mini.isDone) return
  if (mini === undefined && !known.has(id)) return
  leaving.get(id)?.cancel()
  leaving.delete(id)
  await patchScene($, s => ({
    ...s,
    isSaluting: false,
    minis: s.minis.some(one => one.id === id)
      ? s.minis.map(one => (one.id === id ? { ...one, isDone: false, isSettled: true } : one))
      : [...s.minis, newMini(s, id, at)],
  }))
  startFrames($)
}

const startsBackgroundWork = (tool: string, input: object, result: unknown) =>
  tool === 'Monitor' ||
  ('run_in_background' in input && input.run_in_background === true) ||
  (typeof result === 'object' && result !== null && 'backgroundTaskId' in result)

// Salutes the person once the main turn and every subagent are done.
async function saluteWhenDone($: EngineInterface) {
  const now = await read($, scene)
  if (now.isWorking || now.minis.length > 0 || now.job < 0) return
  await patchScene($, s => ({ ...s, isSaluting: true }))
  saluteAt = await $.clock.now()
  saluteTimer?.cancel()
  saluteTimer = $.clock.after(SALUTE_MS, () => {
    void exitStage($)
  })
}

// A click on the main mascot cracks the whip: a lash and its crack, for
// fun; nobody is asked anything.
// One text cell of the band in the drawing's units, as the main mascot's
// click region reports its size (that region is MAIN_WIDTH units across); a
// cell is taken to be about twice as tall as it is wide.
let cellUnits: number | undefined
const CELL_ASPECT = 2.1
type Click = { button: 'left' | 'right'; x: number; y: number; columns: number; rows: number }

const clickOf = (data: unknown): Click | undefined =>
  typeof data === 'object' && data !== null && 'button' in data ? (data as Click) : undefined

// Where a click on a region hung from the row's bottom lands, in the
// drawing's units from the stage's left and the row's top.
const pointOf = (click: Click) => {
  if (cellUnits === undefined || typeof click.x !== 'number') return undefined
  const fromBottom = (click.rows - click.y - 0.5) * cellUnits * CELL_ASPECT

  return {
    x: Math.max(0, (click.x + 0.5) * cellUnits),
    y: Math.min(HEIGHT - 2, Math.max(2, HEIGHT - fromBottom)),
  }
}

// `isAtMain`: the click was on the main mascot itself, which takes the lash
// from the person's hand; elsewhere it lashes the busy minis, if any.
async function crackWhip($: EngineInterface, from?: { x: number; y: number }, isAtMain = false) {
  const now = await read($, scene)
  const hasBusyMinis = now.minis.some(mini => !mini.isDone)
  // One click is one lash, drawn over the row as it stands; the actors'
  // own drawings stay as they are.
  const kind: Lash['kind'] = hasBusyMinis && !isAtMain ? 'minis' : 'self'
  const at = await $.clock.now()
  await update($, lash, last => ({
    n: last.n + 1,
    kind,
    row: rowOf(now),
    at,
    isStreak: last.n > 0 && last.kind === kind && at - last.at < PAIN_MS,
    ...(from === undefined ? {} : { from }),
  }))
  await update($, whip, () => kind)
  void $.audio.play({ asset: 'sounds/whip.wav' }).catch(() => undefined)
  startFrames($)
  whipTimer?.cancel()
  whipTimer = $.clock.after(WHIP_MS, () => {
    void update($, whip, () => 'none' as Whip)
  })
}

const STATUS_WORDS: Record<string, string> = {
  pending: 'запускается',
  running: 'работает',
  waiting: 'ждёт фоновую задачу',
  idle: 'ждёт сообщения',
  completed: 'готово',
  failed: 'ошибка',
  killed: 'остановлен',
}

const statusWord = (agent: AgentInfo | undefined) =>
  agent === undefined ? 'нет в списке задач' : (STATUS_WORDS[agent.status] ?? agent.status)

// `1:05`, `12 с`: how long a mini has been at it.
const sinceText = (ms: number) => {
  const seconds = Math.max(0, Math.round(ms / 1000))

  return seconds < 60 ? `${seconds} с` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

async function agentsNow($: EngineInterface) {
  try {
    return await $.agent.list()
  } catch {
    return undefined
  }
}

// Asks the main mascot in the chat how long one mini has left, at most once
// in 10 seconds a mini. A running turn reads it at its next step; an idle
// session gets it as the person's own message.
async function askAboutMini($: EngineInterface, id: string) {
  const now = await read($, scene)
  const mini = now.minis.find(one => one.id === id)
  if (mini === undefined || mini.isDone) return
  const at = await $.clock.now()
  const last = askedAt.get(id) ?? -ASK_EVERY_MS
  if (at - last < ASK_EVERY_MS) {
    $.ui.toast(`Уже спросил — про этого клодика можно снова через ${Math.ceil((ASK_EVERY_MS - (at - last)) / 1000)} с`)

    return
  }
  askedAt.set(id, at)
  const text = howLong(mini.given || mini.task)
  $.ui.toast(`Спросил Клода, сколько осталось клодику «${mini.given || mini.task}»`)
  if (now.isWorking) {
    try {
      await $.session.append({ message: { type: 'user', content: [{ type: 'text', text }] } })
      await $.session.append({ message: { type: 'system', content: [{ type: 'text', text: `⏱ ${text}` }] } })

      return
    } catch {
      // The running turn took no row: ask once it is over instead.
    }
  }
  try {
    await $.prompt.submit({ text, asUser: true })
  } catch {
    $.ui.toast('Не получилось отправить вопрос в чат')
  }
}

// Stops a mini's subagent as the background tasks list does, and sends the
// mini home.
async function stopMini($: EngineInterface, id: string) {
  const mini = (await read($, scene)).minis.find(one => one.id === id)
  await update($, popup, () => null)
  if (mini === undefined || mini.isDone) return
  try {
    const stopped = await $.tool.call({ tool: 'TaskStop', task_id: id })
    if ('deny' in stopped && stopped.deny !== undefined) {
      $.ui.toast(`Не удалось остановить: ${stopped.deny}`)

      return
    }
  } catch (error) {
    $.ui.toast(`Не удалось остановить: ${error instanceof Error ? error.message : String(error)}`)

    return
  }
  $.ui.toast(`Клодик «${mini.given || mini.task}» остановлен`)
  waitsOf.delete(id)
  await sendMiniHome($, id)
}

// The crew's pane: every mini's task and status, side by side with the chat.
async function openCrew($: EngineInterface) {
  try {
    const opened = await $.ui.open({ id: CREW_PANE, title: 'Клодики' })
    if (!opened.isPlaced) $.ui.toast('Панель клодиков не помещается: расширь окно')
  } catch {
    $.ui.toast('Не получилось открыть панель клодиков')
  }
}

// The engine's own record of its agents is the truth: a mini whose subagent
// is over (finished, failed, stopped, gone) goes home, and anyone a lost
// timer left behind (a mini halfway home, the salute, the hop down) moves on.
async function sweep($: EngineInterface) {
  const now = await read($, scene)
  if (!isOnStage(now)) {
    sweepTimer?.cancel()
    sweepTimer = undefined

    return
  }
  const at = await $.clock.now()
  const agents = await agentsNow($)
  for (const mini of now.minis) {
    if (mini.isDone) {
      if (!leaving.has(mini.id) && at - mini.doneAt > leaveMs(mini.fromX) + 1000) {
        waitsOf.delete(mini.id)
        await patchScene($, s => ({ ...s, minis: s.minis.filter(one => one.id !== mini.id) }))
        await saluteWhenDone($)
      }
      continue
    }
    if (at < mini.at) continue
    // Paused past the limit: home, whatever the list says or if it is out.
    if (at - (pausedAt.get(mini.id) ?? at) > IDLE_MS) {
      pausedAt.delete(mini.id)
      await sendMiniHome($, mini.id)
      continue
    }
    if (agents === undefined) continue
    const agent = agents.find(one => one.id === mini.id)
    const waits = waitsOf.get(mini.id) ?? 0
    // Its turn over, it may still wait on work of its own: counted as paused
    // from the first sweep that sees it so.
    if (agent !== undefined && agent.status !== 'running' && agent.status !== 'pending' && !pausedAt.has(mini.id)) {
      pausedAt.set(mini.id, at)
    }
    const isOver =
      agent === undefined
        ? at - mini.at > 5000
        : agent.status === 'failed' ||
          agent.status === 'killed' ||
          (agent.status === 'completed' && waits === 0)
    if (isOver) {
      pausedAt.delete(mini.id)
      await sendMiniHome($, mini.id)
    }
  }
  const after = await read($, scene)
  if (after.isSaluting && at - saluteAt > SALUTE_MS + 1500) await exitStage($)
  if (after.leaveAt > 0 && at - after.leaveAt > EXIT_MS + 1500) {
    await patchScene($, s => ({ ...s, leaveAt: 0 }))
  }
}

function startSweep($: EngineInterface) {
  sweepTimer ??= $.clock.every(SWEEP_MS, () => {
    void sweep($)
  })
}

// The band says the main turn is over while the stage still has it at work
// (its end was missed): it finishes as the end would have it.
async function settleMainTurn($: EngineInterface) {
  await patchScene($, s => ({ ...s, isWorking: false }))
  if ((await read($, scene)).minis.length === 0) await saluteWhenDone($)
}

// A mini's right-click menu, or its details card: a small framed box in a
// row of its own above the stage (the band shows nothing above its top),
// over its mini; about this wide.
const MENU_PX = 210
const DETAILS_PX = 320
// A see-through strip `width` pixels wide: what moves a popup over its mini.
// The surface sizes a picture by its own markup, so the markup says so too.
const spacer = (width: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 1" width="${width}" height="1"></svg>`

function popupCard(
  elements: Pick<Elements['desktop'], 'Box' | 'Button' | 'Text'>,
  $: EngineInterface,
  kind: 'menu' | 'details',
  mini: Mini,
  agent: AgentInfo | undefined,
  at: number,
) {
  const { Box, Button, Text } = elements
  const close = () => void update($, popup, () => null)
  const job = jobOf(mini.job)
  const title = `${job.emoji} ${mini.given || mini.task}`
  if (kind === 'menu') {
    return (
      <Box key={`menu-${mini.id}`} flexDirection="column" borderStyle="round" borderColor={ORANGE} paddingX={1}>
        <Text bold>{`${job.emoji}${mini.model === '' ? '' : ` ${mini.model}`}`}</Text>
        <Button key={`menu-stop-${mini.id}`} label="⏹ Остановить" plain onPress={() => void stopMini($, mini.id)} />
        <Button
          key={`menu-ask-${mini.id}`}
          label="⏱ Сколько осталось?"
          plain
          onPress={() => {
            close()
            void askAboutMini($, mini.id)
          }}
        />
        <Button
          key={`menu-more-${mini.id}`}
          label="ℹ️ Подробнее"
          plain
          onPress={() => void update($, popup, () => ({ id: mini.id, kind: 'details' as const }))}
        />
        <Button key={`menu-close-${mini.id}`} label="✕ Закрыть" plain onPress={close} />
      </Box>
    )
  }

  return (
    <Box key={`details-${mini.id}`} flexDirection="column" borderStyle="round" borderColor={ORANGE} paddingX={1}>
      <Text bold>{title}</Text>
      <Text>{`Профессия: ${job.name}${mini.model === '' ? '' : ` · ${mini.model}`}${mini.type === '' ? '' : ` · агент ${mini.type}`}`}</Text>
      <Text>{`Статус: ${statusWord(agent)} · ${sinceText(at - mini.at)} · инструментов: ${mini.tools}`}</Text>
      <Text>{`Сейчас: ${mini.task}`}</Text>
      {mini.recent.length > 1 && <Text dimColor>{`Недавно: ${mini.recent.slice(1).join(' ← ')}`}</Text>}
      <Box flexDirection="row" gap={2}>
        <Button key={`details-stop-${mini.id}`} label="⏹ Остановить" plain onPress={() => void stopMini($, mini.id)} />
        <Button key={`details-close-${mini.id}`} label="✕ Закрыть" plain onPress={close} />
      </Box>
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await patchScene($, () => IDLE)
    await update($, popup, () => null)

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    saluteTimer?.cancel()
    exitTimer?.cancel()
    const at = await $.clock.now()
    turnStartedAt = at
    // Off stage (or on its way down), it jumps back up from under the prompt,
    // and only then takes up a new profession: one task keeps one.
    await patchScene($, s => {
      const isEntering = !isOnStage(s) || s.leaveAt > 0

      return {
        ...s,
        isWorking: true,
        isSaluting: false,
        job: isEntering || s.job < 0 ? pickJob(s.job) : s.job,
        enterAt: isEntering ? at : s.enterAt,
        leaveAt: 0,
      }
    })
    startFrames($)
    startSweep($)

    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)
    const id = spawned.agentId
    if (id !== undefined) {
      const at = await $.clock.now()
      // The first mini of a batch waits for the main mascot to finish its
      // own task and call for them; those spawned with it climb out together.
      await patchScene($, s => {
        if (s.minis.some(mini => mini.id === id)) return s
        const handoffAt = s.minis.length === 0 && s.isWorking ? at : s.handoffAt
        const startsAt = Math.max(at, handoffAt + CALL_MS)

        return {
          ...s,
          handoffAt,
          minis: [
            ...s.minis,
            newMini(s, id, startsAt, e.description ?? '', e.subagentType ?? '', modelName(spawned.model ?? '')),
          ],
        }
      })
      waitsOf.set(id, 0)
      known.add(id)
      startFrames($)
      startSweep($)
    }

    return spawned
  })

  on('turn.complete', async ($, e, next) => {
    const id = e.agentId
    if (id === undefined) {
      await patchScene($, s => ({ ...s, isWorking: false }))
      if (e.reason !== 'aborted') await saluteWhenDone($)
      else if ((await read($, scene)).minis.length === 0) await exitStage($)
    } else {
      // A subagent that stopped to wait for its own background work is not
      // done: it runs again when that work reports, and only then goes home.
      const waits = waitsOf.get(id) ?? 0
      if (waits > 0 && e.reason === 'answer') {
        waitsOf.set(id, waits - 1)
        pausedAt.set(id, await $.clock.now())
      } else await sendMiniHome($, id)
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id === undefined) return next(e)
    pausedAt.delete(id)
    await keepMiniBusy($, id)
    // What it is doing now, as the background tasks list says it: the call's
    // own description (`Wait for 95 seconds`), else the tool's name.
    const doing = 'description' in e && typeof e.description === 'string' ? e.description : String(e.tool)
    await patchScene($, s => ({
      ...s,
      minis: s.minis.map(mini =>
        mini.id === id
          ? { ...mini, task: doing, tools: mini.tools + 1, recent: [doing, ...mini.recent].slice(0, 4) }
          : mini,
      ),
    }))
    const ran = await next(e)
    if (known.has(id) && startsBackgroundWork(String(e.tool), e, ran.result)) {
      waitsOf.set(id, (waitsOf.get(id) ?? 0) + 1)
    }

    return ran
  })

  // Clicks on the band's regions. The main mascot's and the backdrop's
  // across the whole band: a left click anywhere cracks the whip and closes
  // a mini's open menu. A mini's: a left click opens the crew's pane, a right
  // click its menu (again, if open: a press may be reported twice).
  on('ui.message', async ($, e, next) => {
    const data = e.data
    if (e.element === 'lash' && typeof data === 'object' && data !== null && 'size' in data) {
      const size = data.size as { columns: number }
      if (size.columns > 0) cellUnits = MAIN_WIDTH / size.columns

      return next(e)
    }
    const click = clickOf(data)
    const isRight = click?.button === 'right'
    if (e.element === 'lash' || (e.element === 'lash-backdrop' && !isRight)) {
      await update($, popup, () => null)
      await crackWhip($, click === undefined ? undefined : pointOf(click), e.element === 'lash')
    } else if (e.element.startsWith('mini:')) {
      const id = e.element.slice('mini:'.length)
      if (isRight) await update($, popup, (): Popup => ({ id, kind: 'menu' }))
      else {
        await update($, popup, () => null)
        await openCrew($)
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: CREW_PANE }, async ($, e, next) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const now = await read($, scene)
    const at = await $.clock.now()
    const agents = (await agentsNow($)) ?? []
    const busy = now.minis.filter(mini => !mini.isDone)
    const job = jobOf(Math.max(0, now.job))
    const head = !isOnStage(now)
      ? 'Клод отдыхает под инпутом'
      : busy.length > 0
        ? `Клод (${job.name}) ждёт ${busy.length} клодик(ов)`
        : now.isWorking
          ? `Клод работает: ${job.name}`
          : 'Все задачи выполнены'

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>{head}</Text>
        {busy.length === 0 && <Text dimColor>Клодиков сейчас нет.</Text>}
        {busy.map(mini => {
          const agent = agents.find(one => one.id === mini.id)

          return (
            <Box key={`crew-${mini.id}`} flexDirection="column">
              <Text bold color={ORANGE}>
                {`${jobOf(mini.job).emoji} ${mini.given || mini.task}`}
              </Text>
              {mini.model !== '' && <Text dimColor>{`Модель: ${mini.model}${mini.type === '' ? '' : ` · агент ${mini.type}`}`}</Text>}
              <Text>{`Статус: ${statusWord(agent)} · ${sinceText(at - mini.at)} · инструментов: ${mini.tools}`}</Text>
              <Text>{`Сейчас: ${mini.task}`}</Text>
              {mini.recent.length > 1 && <Text dimColor>{`Недавно: ${mini.recent.slice(1).join(' ← ')}`}</Text>}
              <Box flexDirection="row" gap={2}>
                <Button key={`crew-stop-${mini.id}`} label="⏹ Остановить" plain onPress={() => void stopMini($, mini.id)} />
                <Button key={`crew-ask-${mini.id}`} label="⏱ Сколько осталось?" plain onPress={() => void askAboutMini($, mini.id)} />
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, scene)
    if (e.props.hasSurvey || !isOnStage(now)) return next(e)

    const job = jobOf(Math.max(0, now.job))
    const isWaiting = now.minis.length > 0
    const minis = now.minis.slice(0, MAX_MINIS)
    const onWhip = () => void crackWhip($)
    const at = await $.clock.now()
    // The band knows when the main turn is over: a stage still showing it at
    // work has missed its end.
    if (now.isWorking && !e.props.isWorking && at - turnStartedAt > 3000) void settleMainTurn($)
    startSweep($)

    if (e.surface === 'terminal') {
      const { Box, Button, Text } = $.ui.resolve(e)
      isTerminalDrawn = true
      startFrames($)
      const isOdd = (await read($, tick)) % 2 === 1
      const whipping = await read($, whip)
      const pose: TermPose =
        whipping === 'minis'
          ? 'whip'
          : whipping === 'self'
            ? 'ouch'
            : isWaiting
              ? 'wait'
              : now.isWorking
                ? 'work'
                : 'salute'
      const actors = [
        termMain(pose, job, isOdd),
        ...minis.map((mini, i) =>
          termMini(
            mini.isDone ? 'salute' : whipping === 'minis' ? 'ouch' : 'work',
            jobOf(mini.job),
            isOdd !== (i % 2 === 1),
          ),
        ),
      ]

      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={1}>
            {actors.map(rows => (
              <Box flexDirection="column">
                {rows.map(row => (
                  <Text color={ORANGE}>{row === '' ? ' ' : row}</Text>
                ))}
              </Box>
            ))}
          </Box>
          <Box flexDirection="row" gap={2}>
            <Button key="whip" label="🪢 FASTER" plain onPress={onWhip} />
            {isWaiting && <Button key="crew" label="📋 Клодики" plain onPress={() => void openCrew($)} />}
          </Box>
        </Box>
      )
    }

    const elements = $.ui.resolve(e)
    const { Box, Button, Svg } = elements
    // A click on the main mascot cracks the whip, where the surface can take
    // the click (a Client); elsewhere the FASTER button does.
    const Client = 'Client' in elements ? elements.Client : undefined
    const handoffLeft = now.handoffAt + FINISH_MS - at
    // A fresh lash at the minis takes the whip out of the main mascot's hand
    // for the swing that the whip's own drawing shows.
    const lastLash = await read($, lash)
    const lashAtWait =
      lastLash.n > 0 && lastLash.kind === 'minis' && at - lastLash.at < LASH_FRESH_MS
        ? lastLash.at
        : undefined
    const drawn = now.leaveAt > 0
      ? { source: jumpingDown((at - now.leaveAt) / 1000, job), alt: 'Клод прыгает под инпут' }
      : isWaiting
      ? handoffLeft > 0
        ? {
            source: finishing(job, handoffLeft / 1000),
            alt: `Клод доделывает свою задачу (${job.name}) и зовёт клодиков в громкоговоритель`,
          }
        : {
            source: shiftTime(
              waiting(job, lashAtWait === undefined ? undefined : (lashAtWait - now.enterAt) / 1000),
              (at - now.enterAt) / 1000,
            ),
            alt: 'Клод ждёт сабагентов и поглядывает на часы' }
      : now.isWorking
        ? { source: shiftTime(working(job), (at - now.enterAt) / 1000), alt: `Клод работает: ${job.name}` }
        : { source: saluting(job), alt: 'Клод отдаёт честь: всё готово' }
    const sinceEnter = at - now.enterAt
    const main =
      now.leaveAt === 0 && sinceEnter < ENTER_MS
        ? { ...drawn, source: rising(drawn.source, sinceEnter / 1000) }
        : drawn
    const stage = stageOf(now)
    const last = await read($, lash)
    const isFresh = last.n > 0 && last.row === rowOf(now) && at - last.at < LASH_FRESH_MS
    const leavers = shown(now)
      .filter(mini => mini.isDone)
      .map(mini => ({
        fromX: mini.fromX,
        elapsed: Math.max(0, at - mini.doneAt) / 1000,
        job: jobOf(mini.job),
      }))
    const slots = slotsOf(now)
    const width = stageWidth(stage)
    const pctOf = (w: number) => `${Math.floor((w / width) * 100)}%`
    // What is open for a mini: its menu or its card, above it.
    const open = await read($, popup)
    const openMini = open === null ? undefined : shown(now).find(mini => mini.id === open.id && !mini.isDone)
    // The popup's left edge: centred over its mini, as far left as the
    // band's edge allows.
    const popupLeft =
      openMini === undefined
        ? 1
        : Math.max(
            1,
            Math.round(
              (MAIN_WIDTH + (openMini.slot + 0.5) * MINI_WIDTH) * SCALE -
                (open?.kind === 'details' ? DETAILS_PX : MENU_PX) / 2,
            ),
          )
    const openCard = open !== null && openMini !== undefined
      ? popupCard(elements, $, open.kind, openMini, (await agentsNow($))?.find(one => one.id === openMini.id), at)
      : undefined
    const fxW = fxWidth(stage, isFresh && last.kind === 'self' ? last.from : undefined)
    const fx =
      isFresh || leavers.length > 0
        ? stageFx(stage, isFresh ? { ...last, elapsed: (at - last.at) / 1000 } : undefined, leavers)
        : undefined

    // Each actor keeps its own drawing in its own keyed place; a lash is a
    // transparent drawing laid over the row, so it redraws nobody. Drawn as
    // images, not interactive frames: a frame loads blank white on every
    // redraw of the band.
    return (
      <Box flexDirection="column" alignItems="flex-start" width="100%">
        {Client === undefined && <Button key="whip" label="🪢 FASTER" plain onPress={onWhip} />}
        {Client !== undefined && (
          // Under everything else, across the whole band: a click on the
          // bare band cracks the whip.
          <Box key="backdrop" position="absolute" bottom={0} left={0} width="100%">
            <Client
              key="lash-backdrop"
              module="./clicker.tsx"
              props={{ rows: CLICK_ROWS }}
              width="100%"
              height={CLICK_ROWS}
            />
          </Box>
        )}
        {openCard !== undefined && openMini !== undefined && (
          // Centred over its mini (as far left as the band's edge allows);
          // placed, so it lies over the backdrop and its buttons take clicks.
          <Box key="popup-row" position="relative" flexDirection="row" alignItems="flex-end">
            <Svg
              source={spacer(popupLeft)}
              alt=""
              width={popupLeft}
              height={1}
            />
            {openCard}
          </Box>
        )}
        <Box key="row" flexDirection="row" alignItems="flex-end">
          <Box key="main">
            <Svg
              source={main.source}
              alt={main.alt}
              width={MAIN_WIDTH * SCALE}
              height={HEIGHT * SCALE}
            />
          </Box>
          {slots.map((mini, slot) => {
            const drawn =
              mini === undefined
                ? { source: miniGone(), alt: 'Свободное место' }
                : miniSvg(mini, jobOf(mini.job), at)
            const task = mini !== undefined && !mini.isDone ? mini.task : ''

            return (
              <Box key={`slot-${slot}`}>
                <Svg
                  source={drawn.source}
                  alt={task === '' ? drawn.alt : `${drawn.alt}: ${task}`}
                  width={MINI_WIDTH * SCALE}
                  height={HEIGHT * SCALE}
                />
              </Box>
            )
          })}
          {/* Over everyone's pictures, so the whip, the shut eyes and the
              cracks paint over them. */}
          {fx !== undefined && (
            // As wide as the drawing, past the stage's end when the lash flies
            // from a click beyond it: a picture is never squeezed into a
            // narrower box.
            <Box key="whip-fx" position="absolute" top={0} left={0} width={`${Math.ceil((fxW / width) * 100)}%`}>
              <Svg source={fx} alt="Хлыст" width={fxW * SCALE} height={HEIGHT * SCALE} />
            </Box>
          )}
          {Client !== undefined && (
            // Over everything, the whip's layer included, so every click
            // lands: one region over the main mascot (a lash), one over each
            // working mini (its pane, its menu), and each mini's bubble shown
            // while its region is hovered.
            // Hung from the row's bottom: a region may be taller than the row,
            // and what rises past the band's top is clipped.
            <Box
              key="hit-row"
              position="absolute"
              bottom={0}
              left={0}
              width="100%"
              flexDirection="row"
              alignItems="flex-end"
            >
              <Box key="hit-main" width={pctOf(MAIN_WIDTH)}>
                <Client
                  key="lash"
                  module="./clicker.tsx"
                  props={{ rows: CLICK_ROWS, reportsSize: true }}
                  width="100%"
                  height={CLICK_ROWS}
                />
              </Box>
              {slots.map((mini, slot) => {
                const busy = mini !== undefined && !mini.isDone ? mini : undefined
                const bubble = busy !== undefined && busy.task !== '' ? speechBubble(bubbleText(busy)) : undefined

                // Hovering a working mini's region shows its bubble over its
                // head. The bubble sits in a placed layer that is always
                // there, so showing it moves nobody and grows nothing.
                return (
                  <Box key={`hit-${slot}`} width={pctOf(MINI_WIDTH)}>
                    {bubble !== undefined && busy !== undefined && (
                      <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        width={`${Math.ceil((bubble.width / (MINI_WIDTH * SCALE)) * 100)}%`}
                      >
                        {/* Drawn all along, parked far out of sight where the
                            band clips it, so its picture is loaded before the
                            first hover; the hover brings it in. */}
                        <Box position="absolute" bottom={0} left={-1000} width="100%" hover={{ left: 0 }}>
                          <Svg
                            source={bubble.source}
                            alt={`Клодик говорит: ${bubbleText(busy)}`}
                            width={bubble.width}
                            height={bubble.height}
                          />
                        </Box>
                      </Box>
                    )}
                    {/* Over the bubble, which covers the mini while it shows:
                        a click lands on the region all the same. */}
                    {busy !== undefined && (
                      <Box position="absolute" bottom={0} left={0} width="100%">
                        <Client
                          key={`mini:${busy.id}`}
                          module="./clicker.tsx"
                          props={{ rows: CLICK_ROWS }}
                          width="100%"
                          height={CLICK_ROWS}
                        />
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    )
  })
}
