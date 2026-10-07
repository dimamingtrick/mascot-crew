import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Ask, Lash, Mini, Scene, Whip } from '../types'
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
  askTimer,
  ASK_TIMER_SIZE,
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
const NO_ASK: Ask = { at: 0, isOn: false }
const ask = atom({ plugin: 'mascot-crew', key: 'ask' } as const, NO_ASK)

const SALUTE_MS = 4000
const ASK_EVERY_MS = 10_000
const FRAME_MS = 300
const ORANGE = '#D97757'
const MAX_MINIS = 6
// Rows of cells that cover the main mascot's height. The desktop sizes a
// Client by what it draws, so it draws this many rows.
const CLICK_ROWS = 4
const HOW_LONG_MINIS =
  'How much longer? Briefly: what stage are the subagents at, and roughly how long until the results?'
const HOW_LONG_SELF =
  'How much longer? Briefly: what are you working on now, and roughly how long until you are done?'

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
let lastAskedAt = -ASK_EVERY_MS
let askTimerEnd: Timer | undefined
let lastToastAt = 0
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

const newMini = (s: Scene, id: string, at: number, task = ''): Mini => ({
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
  if (mini === undefined && !waitsOf.has(id)) return
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
  saluteTimer?.cancel()
  saluteTimer = $.clock.after(SALUTE_MS, () => {
    void exitStage($)
  })
}

// A toast's text cannot change once shown, so the seconds left run on a
// clock face drawn over the main mascot; the toast says so once per click,
// not more often than it can be read.
function toastWaiting($: EngineInterface, at: number) {
  if (at - lastToastAt < 1200) return
  lastToastAt = at
  const left = Math.ceil((ASK_EVERY_MS - (at - lastAskedAt)) / 1000)
  $.ui.toast(`Уже спросил — следующий вопрос через ${left} с`, { timeoutMs: 1500 })
}

// Puts the countdown on show from `at`, and takes it off when it runs out.
async function startAskTimer($: EngineInterface, at: number) {
  await update($, ask, () => ({ at, isOn: true }))
  askTimerEnd?.cancel()
  askTimerEnd = $.clock.after(ASK_EVERY_MS, () => {
    void update($, ask, last => ({ ...last, isOn: false }))
    $.ui.toast('Можно спрашивать снова', { timeoutMs: 1500 })
  })
}

async function crackWhip($: EngineInterface) {
  const now = await read($, scene)
  const hasBusyMinis = now.minis.some(mini => !mini.isDone)
  // One click is one lash, drawn over the row as it stands; the actors'
  // own drawings stay as they are.
  const kind: Lash['kind'] = hasBusyMinis ? 'minis' : 'self'
  const at = await $.clock.now()
  await update($, lash, last => ({
    n: last.n + 1,
    kind,
    row: rowOf(now),
    at,
    isStreak: last.n > 0 && last.kind === kind && at - last.at < PAIN_MS,
  }))
  await update($, whip, () => kind)
  void $.audio.play({ asset: 'sounds/whip.wav' }).catch(() => undefined)
  startFrames($)
  whipTimer?.cancel()
  whipTimer = $.clock.after(WHIP_MS, () => {
    void update($, whip, () => 'none' as Whip)
  })
  // The minis are asked about while any works; else the main mascot about
  // its own work, while it has some.
  // Every lash says what came of it in a toast.
  if (!hasBusyMinis && !now.isWorking) {
    $.ui.toast('Спрашивать не о чем — все свободны')

    return
  }
  // Lashes are free; the question reaches the chat once in 10 seconds.
  if (at - lastAskedAt < ASK_EVERY_MS) {
    toastWaiting($, at)

    return
  }
  lastAskedAt = at
  await startAskTimer($, at)
  const text = hasBusyMinis ? HOW_LONG_MINIS : HOW_LONG_SELF
  $.ui.toast(hasBusyMinis ? 'Спросил клодиков, долго ли ещё' : 'Спросил Клода, долго ли ещё')
  // A prompt of a plugin's own waits for a running turn to end, too late to
  // ask how long it has left: the running turn reads the question at its
  // next step instead, and the chat shows it as a note. An idle session
  // gets it as a message of the person's own.
  if (now.isWorking) {
    try {
      await $.session.append({ message: { type: 'user', content: [{ type: 'text', text }] } })
      await $.session.append({ message: { type: 'system', content: [{ type: 'text', text: `🪢 ${text}` }] } })

      return
    } catch {
      // The running turn took no row: ask once it is over instead.
    }
  }
  try {
    await $.prompt.submit({ text, asUser: true })
  } catch {
    // Nowhere to send it (no session to prompt): the lash alone it is.
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await patchScene($, () => IDLE)

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    saluteTimer?.cancel()
    exitTimer?.cancel()
    const at = await $.clock.now()
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
          minis: [...s.minis, newMini(s, id, startsAt, e.description ?? '')],
        }
      })
      waitsOf.set(id, 0)
      startFrames($)
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
      if (waits > 0 && e.reason === 'answer') waitsOf.set(id, waits - 1)
      else await sendMiniHome($, id)
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id === undefined) return next(e)
    await keepMiniBusy($, id)
    // What it is doing now, as the background tasks list says it: the call's
    // own description (`Wait for 95 seconds`), else the tool's name.
    const doing = 'description' in e && typeof e.description === 'string' ? e.description : String(e.tool)
    await patchScene($, s => ({
      ...s,
      minis: s.minis.map(mini => (mini.id === id ? { ...mini, task: doing } : mini)),
    }))
    const ran = await next(e)
    if (waitsOf.has(id) && startsBackgroundWork(String(e.tool), e, ran.result)) {
      waitsOf.set(id, (waitsOf.get(id) ?? 0) + 1)
    }

    return ran
  })

  on('ui.message', { element: 'lash' }, async ($, e, next) => {
    await crackWhip($)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, scene)
    if (e.props.hasSurvey || !isOnStage(now)) return next(e)

    const job = jobOf(Math.max(0, now.job))
    const isWaiting = now.minis.length > 0
    const minis = now.minis.slice(0, MAX_MINIS)
    const onWhip = () => void crackWhip($)

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
          <Button key="whip" label="🪢 FASTER" plain onPress={onWhip} />
        </Box>
      )
    }

    const elements = $.ui.resolve(e)
    const { Box, Button, Svg } = elements
    // A click on the main mascot cracks the whip, where the surface can take
    // the click (a Client); elsewhere the FASTER button does.
    const Client = 'Client' in elements ? elements.Client : undefined
    const at = await $.clock.now()
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
    const asked = await read($, ask)
    const askLeft = ASK_EVERY_MS - (at - asked.at)
    const timer = asked.isOn && askLeft > 0 ? askTimer(askLeft, ASK_EVERY_MS) : undefined
    const fx =
      isFresh || leavers.length > 0
        ? stageFx(stage, isFresh ? { ...last, elapsed: (at - last.at) / 1000 } : undefined, leavers)
        : undefined

    // Each actor keeps its own drawing in its own keyed place; a lash is a
    // transparent drawing laid over the row, so it redraws nobody. Drawn as
    // images, not interactive frames: a frame loads blank white on every
    // redraw of the band.
    return (
      <Box flexDirection="column" alignItems="flex-start">
        {timer !== undefined && (
          // In the band's top right corner: the seconds till the next
          // question can be asked.
          <Box key="ask-timer" position="absolute" top={0} right={0}>
            <Svg
              source={timer}
              alt={`Следующий вопрос через ${Math.ceil(askLeft / 1000)} с`}
              width={ASK_TIMER_SIZE}
              height={ASK_TIMER_SIZE}
            />
          </Box>
        )}
        {Client === undefined && <Button key="whip" label="🪢 FASTER" plain onPress={onWhip} />}
        <Box key="row" flexDirection="row" alignItems="flex-end">
          <Box key="main">
            <Svg
              source={main.source}
              alt={main.alt}
              width={MAIN_WIDTH * SCALE}
              height={HEIGHT * SCALE}
            />
          </Box>
          {slotsOf(now).map((mini, slot) => {
            const drawn =
              mini === undefined
                ? { source: miniGone(), alt: 'Свободное место' }
                : miniSvg(mini, jobOf(mini.job), at)
            const task = mini !== undefined && !mini.isDone ? mini.task : ''

            const bubble = task === '' ? undefined : speechBubble(task)

            // Hovering a working mini shows its bubble over its head. The
            // bubble sits in a placed layer that is always there, empty till
            // then, so showing it moves nobody and grows nothing.
            return (
              <Box key={`slot-${slot}`}>
                <Svg
                  source={drawn.source}
                  alt={task === '' ? drawn.alt : `${drawn.alt}: ${task}`}
                  width={MINI_WIDTH * SCALE}
                  height={HEIGHT * SCALE}
                />
                {bubble !== undefined && (
                  <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    width={`${Math.ceil((bubble.width / (MINI_WIDTH * SCALE)) * 100)}%`}
                  >
                    {/* Drawn all along, parked far out of sight where the band
                        clips it, so its picture is loaded before the first
                        hover; the hover brings it in. */}
                    <Box
                      position="absolute"
                      bottom={0}
                      left={-1000}
                      width="100%"
                      hover={{ left: 0 }}
                    >
                      <Svg
                        source={bubble.source}
                        alt={`Клодик говорит: ${task}`}
                        width={bubble.width}
                        height={bubble.height}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )
          })}
          {/* Last in the row, so the whip, the shut eyes and the cracks paint
              over everyone's pictures. */}
          {fx !== undefined && (
            <Box key="whip-fx" position="absolute" top={0} left={0} width="100%">
              <Svg
                source={fx}
                alt="Хлыст"
                width={stageWidth(stage) * SCALE}
                height={HEIGHT * SCALE}
              />
            </Box>
          )}
          {Client !== undefined && (
            // Over everything, the whip's layer included, so every click on
            // the main mascot lands; its cell is the row's first.
            <Box
              key="lash-area"
              position="absolute"
              top={0}
              left={0}
              width={`${Math.floor((MAIN_WIDTH / stageWidth(stage)) * 100)}%`}
            >
              <Client
                key="lash"
                module="./clicker.tsx"
                props={{ rows: CLICK_ROWS }}
                width="100%"
                height={CLICK_ROWS}
              />
            </Box>
          )}
        </Box>
      </Box>
    )
  })
}
