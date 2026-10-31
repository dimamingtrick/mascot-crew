import type { ClientModule, RenderElement } from 'claude-code'
import type { HandKit } from './art'

// When a posted down is still waiting for its up: a press reports a down and
// an up, and the surface may pass on only one of them, so either one counts
// and the up of a posted down is let go. The up reaches the instance that
// took the down. No wait between presses: quick clicks each count.
let heldSince = 0
const HOLD_MS = 2000

// How far the bow is drawn while held: full in FULL_DRAW_MS, as the hooks
// module counts it (its FULL_DRAW).
const FULL_DRAW_MS = 2000
const TICK_MS = 100
// How many cells left of the pointer the hand is, as the hooks module draws it.
const HAND_LEFT = 2

// `ticks`: TICK_MS steps of the surface's frame clock since the press; `fx`
// and `fy` the pointer with the fraction of a cell, where known; `px` and
// `py` the same where it was pressed, where the bow stays while it is held.
type Held = { x: number; y: number; fx: number; fy: number; px: number; py: number; ticks: number }
// The weapon just let go (but the bow), still in the fist where it was let
// go until the band draws its strike from there: until the band's count of
// strikes, `lash`, moves on, LET_GO_TICKS at most. Gone on the release, it
// would leave the band's own picture, as it stood when the button went
// down, for as long as the strike takes to come.
type LetGo = { held: Held; lash: number; ticks: number }
const LET_GO_TICKS = 6
// `mainTicks`: how long the main mascot's bow has been drawn at the minis,
// for the main mascot's own region to draw.
type State = { held?: Held; mainTicks?: number; letGo?: LetGo }
// What the region needs to draw the weapon in hand as the band draws it: the
// parts, the cell's size in the drawing's units, where the region starts in
// them, whether it is the main mascot's, and whether busy minis are about
// (then a press off the main mascot has the main mascot use its weapon).
type Hand = { kit: HandKit; cellUnits: number; startsAt: number; onMain: boolean; minis: boolean }
type Point = { x: number; y: number }
const CELL_ASPECT = 2.1
const BOX = 40

// The main mascot's bow drawn at the minis, its ticks: set by whichever
// region took the press, drawn by the main mascot's own region, which covers
// the main mascot (every region of the band runs in this one module).
let mainDraw: number | undefined

const f1 = (n: number) => n.toFixed(1)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const SHAKE =
  '<animateTransform attributeName="transform" type="rotate" values="0;-7;0;7;0" dur="0.45s" repeatCount="indefinite"/>'
const TREMBLE =
  '<animateTransform attributeName="transform" type="rotate" values="0;1.2;-1.2;0" dur="0.12s" repeatCount="indefinite"/>'

// How long the bow takes to turn to a new aim: the pointer comes a cell at a
// time where the surface knows no finer, and the bow sweeps between them.
const TURN_MS = 120
// A turn under way: from `from` degrees to `to`, started `at`.
type Turn = { from: number; to: number; at: number }
// The shorter way from `a` to `b`, in degrees.
const turnBy = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180
const angleAt = (turn: Turn, now: number) =>
  turn.from + turnBy(turn.from, turn.to) * Math.min(1, Math.max(0, (now - turn.at) / TURN_MS))
// The bow's turn for this redraw toward `angle`: where it starts (as drawn
// now, mid-turn too) and for how long, or none when it is already there.
const turnToward = (last: Turn | undefined, angle: number, now: number): { turn: Turn; sweep?: { from: number; ms: number } } => {
  if (last === undefined) return { turn: { from: angle, to: angle, at: now } }
  const shown = angleAt(last, now)
  if (Math.abs(turnBy(last.to, angle)) > 0.05) return { turn: { from: shown, to: angle, at: now }, sweep: { from: shown, ms: TURN_MS } }
  const left = TURN_MS - (now - last.at)

  return left > 0 ? { turn: last, sweep: { from: shown, ms: left } } : { turn: last }
}

const powerOf = (ticks: number) => Math.min(1, Math.max(0.06, (ticks * TICK_MS) / FULL_DRAW_MS))
const drawBar = (at: Point, power: number) =>
  `<rect x="${f1(at.x - 8)}" y="${f1(at.y)}" width="16" height="2" rx="1" fill="#000" opacity="0.25"/>` +
  `<rect x="${f1(at.x - 8)}" y="${f1(at.y)}" width="${f1(16 * power)}" height="2" rx="1" fill="${power >= 1 ? '#e53935' : '#ffd54a'}"/>`
const drawBow = (kit: HandKit, at: Point, angle: number, power: number, scale: number, sweep?: { from: number; ms: number }) => {
  const pull = kit.pull * power
  const string = `<path d="M-4.5 -10.5 L${(-4.5 - pull).toFixed(2)} 0 L-4.5 10.5" stroke="#eceff1" stroke-width="0.55" fill="none"/>`
  const arrow = `<g transform="translate(${(-4.5 - pull + 15).toFixed(2)},0)">${kit.arrow}</g>`

  // Turning: the rest of the way from where it was drawn, laid over the
  // aim (the scale is even, so the order does not matter).
  const turning =
    sweep === undefined
      ? ''
      : `<animateTransform attributeName="transform" type="rotate" additive="sum" from="${turnBy(angle, sweep.from).toFixed(1)}" to="0" dur="${Math.round(sweep.ms)}ms" fill="freeze"/>`

  return `<g transform="translate(${f1(at.x)},${f1(at.y)}) rotate(${angle.toFixed(1)})${scale === 1 ? '' : ` scale(${scale})`}">${turning}<g>${power >= 1 ? TREMBLE : ''}${string}${kit.limbs}${arrow}</g></g>`
}

// The main mascot's bow at the minis, laid right over the one it holds in
// the band's still picture, its string drawn as far as it has been held.
export const mainBow = (kit: HandKit, ticks: number) => {
  const power = powerOf(ticks)
  const at = kit.mainBowAt

  return { body: drawBar({ x: at.x, y: at.y - 15 }, power) + drawBow(kit, at, 0, power, kit.mainBow), center: at }
}

// The person's weapon in their fist, in the drawing's units: the bow right
// of where it was pressed, drawn as far as it has been held and aimed at the pointer
// (or, close to it, at the main mascot), as the hooks module shoots it; the
// revolver by the pointer at the main mascot's feet, the whip or a tomato
// raised there. Returns the markup and the point it is around. `turn` is
// how the bow turned last, for it to sweep to its new aim; the turn it is
// now on comes back.
export const inHand = (
  weapon: string,
  hand: Hand,
  cursor: Point,
  ticks: number,
  rows: number,
  pressedAt: Point = cursor,
  turn?: Turn,
  now = Date.now(),
): { body: string; center: Point; turn?: Turn } => {
  const { kit } = hand
  const fist = (p: Point, r = 2.2) => `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${r}" fill="#5b3a1e"/>`
  const at = (p: Point, inner: string) => `<g transform="translate(${f1(p.x)},${f1(p.y)})">${inner}</g>`
  const top = kit.bottom - rows * hand.cellUnits * CELL_ASPECT
  if (weapon === 'bow') {
    const anchor = { x: Math.max(kit.personBowX, pressedAt.x + kit.personBowRight), y: clamp(pressedAt.y, 4, 36) }
    // Still where it was pressed: aimed at the mascot, as the hooks module
    // shoots it.
    const isNear = Math.hypot(cursor.x - pressedAt.x, cursor.y - pressedAt.y) < 3
    const target = isNear ? kit.chest : cursor
    const angle = (Math.atan2(target.y - anchor.y, target.x - anchor.x) * 180) / Math.PI
    const power = powerOf(ticks)
    const bar = drawBar({ x: anchor.x, y: Math.max(top, anchor.y - 15) }, power)
    const next = turnToward(turn, angle, now)

    return { body: bar + drawBow(kit, anchor, angle, power, 1, next.sweep) + fist(anchor, 2.4), center: anchor, turn: next.turn }
  }
  const grip = { x: cursor.x - HAND_LEFT * hand.cellUnits, y: clamp(cursor.y, top + 2, kit.bottom - 2) }
  if (weapon === 'gun') {
    const target = kit.feet
    const from = Math.hypot(grip.x - target.x, grip.y - target.y) < 16 ? { x: grip.x, y: target.y - 16 } : grip
    const angle = (Math.atan2(target.y - from.y, target.x - from.x) * 180) / Math.PI
    const gun = `<g transform="rotate(${angle.toFixed(1)})"><g transform="scale(1,${target.x < from.x ? -1 : 1})">${kit.gun}</g></g>`

    return { body: at(from, gun) + fist({ x: from.x, y: from.y + 1.5 }), center: from }
  }
  if (weapon === 'tomato')
    return { body: at(grip, `<g transform="translate(0,-3) scale(0.85)"><g>${SHAKE}${kit.tomato}</g></g>`) + fist(grip), center: grip }
  const whip = `<g transform="scale(${grip.x >= 36 ? -1 : 1},1)"><g>${SHAKE}${kit.whip}</g></g>`

  return { body: at(grip, whip) + fist(grip), center: grip }
}

// The latest props of each instance, for its timer.
const propsOf = new WeakMap<object, { hand?: Hand; lash?: number }>()
// How each instance's bow turned last while held.
const turnOf = new WeakMap<object, Turn>()

// A see-through region laid over the band. It posts to the hooks module:
// - `{ button, x, y, columns, rows }` for a click: left or right (the right
//   button, or a ctrl+click), where in the region, and how big it is;
// - with `steps`, `{ press, x, y, columns, rows }` instead for each step of
//   a left press (the right button's clicks stay as above): `down`, every
//   `move` while it is held (the region keeps the pointer until the button
//   comes up, past its edges too), and `up`; `x` and `y` in cells with the
//   fraction kept, the middle of a cell where the surface knows no finer;
// - with `reportsSize`, `{ size }` whenever its size changes.
// With `ready`, the run's weapon, and `hand`, it draws that weapon in hand
// while a left press is held, as the band draws it: the desktop holds the
// band's own picture still until the button comes up, but not this region's.
// A press that has the main mascot shoot its bow at the minis draws nothing
// under the pointer: the main mascot's own region draws the string drawing
// on its bow.
// The surface sizes the region by what it draws, so it draws `rows` blank
// rows across the whole width.
const Clicker: ClientModule<
  { rows: number; reportsSize?: boolean; steps?: boolean; ready?: string; hand?: Hand; lash?: number },
  State
> = (
  props,
  surface,
) => {
  propsOf.set(surface, props)
  if (surface.state === undefined) {
    surface.setState({})
    if (props.reportsSize === true) {
      let columns = 0
      surface.every(300, () => {
        if (surface.columns === 0 || surface.columns === columns) return
        columns = surface.columns
        surface.post({ size: { columns: surface.columns, rows: surface.rows } })
      })
    }
    // The bow's string draws while held; the main mascot's region follows
    // its bow being drawn at the minis.
    surface.every(TICK_MS, () => {
      const state = surface.state ?? {}
      const { held } = state
      const isAtMinis = isMinisPress(propsOf.get(surface)?.hand)
      let next: State = state
      if (held !== undefined && held.ticks * TICK_MS < FULL_DRAW_MS) {
        next = { ...next, held: { ...held, ticks: held.ticks + 1 } }
        if (isAtMinis) mainDraw = held.ticks + 1
      }
      if (propsOf.get(surface)?.hand?.onMain === true && next.mainTicks !== mainDraw)
        next = mainDraw === undefined ? { held: next.held } : { ...next, mainTicks: mainDraw }
      const { letGo } = next
      if (letGo !== undefined) {
        const { letGo: _, ...rest } = next
        const isStruck = propsOf.get(surface)?.lash !== letGo.lash || letGo.ticks + 1 >= LET_GO_TICKS
        next = isStruck ? rest : { ...rest, letGo: { ...letGo, ticks: letGo.ticks + 1 } }
      }
      if (next !== state) surface.setState(next)
    })
  }
  // The region's height in rows as laid out, which the pointer's row counts
  // from; its own before the first layout. The hooks module places the
  // strike by the same, so it leaves from where this region drew the fist.
  const tall = () => (surface.rows > 0 ? surface.rows : props.rows)
  surface.onPointer(event => {
    if (props.steps === true && event.button === 'left' && event.ctrl !== true) {
      if (event.type !== 'down' && event.type !== 'move' && event.type !== 'up') return
      if (props.ready !== undefined) {
        const was = surface.state?.held
        const isAtMinis = isMinisPress(props.hand)
        if (event.type === 'up') {
          const { lash } = props
          const keeps = was !== undefined && props.ready !== 'bow' && !isAtMinis && lash !== undefined
          const fx = event.fine?.x ?? event.x + 0.5
          const fy = event.fine?.y ?? event.y + 0.5
          surface.setState(keeps ? { letGo: { held: { ...was, x: event.x, y: event.y, fx, fy }, lash, ticks: 0 } } : {})
          if (isAtMinis) mainDraw = undefined
        } else if (event.type === 'down' || was !== undefined) {
          const fx = event.fine?.x ?? event.x + 0.5
          const fy = event.fine?.y ?? event.y + 0.5
          // A down seen again while held keeps the first press's point.
          surface.setState({
            held: { x: event.x, y: event.y, fx, fy, px: was?.px ?? fx, py: was?.py ?? fy, ticks: was?.ticks ?? 0 },
          })
          if (isAtMinis && props.ready === 'bow') mainDraw = was?.ticks ?? 0
        }
      }
      surface.post({
        press: event.type,
        x: event.fine?.x ?? event.x + 0.5,
        y: event.fine?.y ?? event.y + 0.5,
        columns: surface.columns,
        rows: tall(),
      })

      return
    }
    if (event.type !== 'down' && event.type !== 'up') return
    if (event.button === 'middle') return
    const now = Date.now()
    if (event.type === 'up') {
      const isPairOfDown = now - heldSince < HOLD_MS
      heldSince = 0
      if (isPairOfDown) return
    } else heldSince = now
    surface.post({
      button: event.button === 'right' || event.ctrl === true ? 'right' : 'left',
      x: event.x,
      y: event.y,
      columns: surface.columns,
      rows: tall(),
    })
  })
  const { Box, Text } = surface.elements
  const rows = Array.from({ length: props.rows }, (_, row) => <Text key={`r${row}`}> </Text>)
  const { held, mainTicks, letGo } = surface.state ?? {}
  const hand = props.hand
  // A new press turns from where it aims, not from the last one's aim.
  if (held === undefined) turnOf.delete(surface)
  // Let go: drawn until the band's picture has the strike.
  const inFist = held ?? (letGo !== undefined && letGo.lash === props.lash ? letGo.held : undefined)
  let drawn: { body: string; center: Point } | undefined
  if (hand !== undefined && hand.cellUnits > 0 && props.ready !== undefined) {
    const rowUnits = hand.cellUnits * CELL_ASPECT
    const top = hand.kit.bottom - tall() * rowUnits
    if (inFist !== undefined && !isMinisPress(hand)) {
      const toDrawing = (x: number, y: number) => ({ x: hand.startsAt + x * hand.cellUnits, y: top + y * rowUnits })
      const made = inHand(props.ready, hand, toDrawing(inFist.fx, inFist.fy), inFist.ticks, tall(), toDrawing(inFist.px, inFist.py), turnOf.get(surface))
      if (made.turn === undefined) turnOf.delete(surface)
      else turnOf.set(surface, made.turn)
      drawn = made
    } else if (mainTicks !== undefined && hand.onMain && props.ready === 'bow') drawn = mainBow(hand.kit, mainTicks)
  }
  let drawnInHand = null
  if (drawn !== undefined && hand !== undefined) {
    // The band's own picture, laid where the region sits over it: from the
    // band's bottom, which the region shares, up the band's height, and from
    // the region's left edge, which the band draws at `startsAt`. Laid from
    // a cell instead, it would go by `cellUnits`, only an estimate of a
    // cell's width, and on the release the band's own bow would jump from
    // it. Only what reaches left of the region goes from a cell.
    const { kit, cellUnits, startsAt } = hand
    const left = Math.min(0, Math.floor((drawn.center.x - BOX / 2 - startsAt) / cellUnits))
    const x0 = startsAt + left * cellUnits
    const span = Math.max(BOX, drawn.center.x + BOX / 2 - x0)
    const width = span * kit.scale
    const height = kit.height * kit.scale
    // An Svg built by hand: the region's table has none, and the desktop
    // draws one here as it does in the band.
    const picture = {
      type: 'Svg',
      props: {
        source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(x0)} ${f1(kit.bottom - kit.height)} ${f1(span)} ${kit.height}" width="${f1(width)}" height="${f1(height)}">${drawn.body}</svg>`,
        alt: props.ready,
        width,
        height,
      },
    } as unknown as RenderElement
    drawnInHand = (
      <Box key="in-hand" position="absolute" left={left} bottom={0}>
        {picture}
      </Box>
    )
  }

  return (
    <Box flexDirection="column" width="100%" height={props.rows}>
      {rows}
      {drawnInHand}
    </Box>
  )
}

// A press there has the main mascot use its weapon on the busy minis.
const isMinisPress = (hand: Hand | undefined) => hand !== undefined && hand.minis && !hand.onMain

export default Clicker
