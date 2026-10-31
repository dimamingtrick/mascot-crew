import type { ClientModule, RenderElement } from 'claude-code'
import type { HandKit } from './art'

// When a posted down is still waiting for its up: a press reports a down and
// an up, and the surface may pass on only one of them, so either one counts
// and the up of a posted down is let go. The up reaches the instance that
// took the down. No wait between presses: quick clicks each count.
let heldSince = 0
const HOLD_MS = 2000

// How far the bow is drawn while held: full in FULL_DRAW_MS, as the hooks
// module counts it.
const FULL_DRAW_MS = 1000
const TICK_MS = 100
// How many cells left of the pointer the hand is, as the hooks module draws it.
const HAND_LEFT = 2

// `ticks`: TICK_MS steps of the surface's frame clock since the press; `fx`
// and `fy` the pointer with the fraction of a cell, where known.
type Held = { x: number; y: number; fx: number; fy: number; ticks: number }
type State = { held?: Held }
// What the region needs to draw the weapon in hand as the band draws it: the
// parts, the cell's size in the drawing's units, where the region starts in
// them, whether it is the main mascot's, and whether busy minis are about
// (then a press off the main mascot has the main mascot use its weapon).
type Hand = { kit: HandKit; cellUnits: number; startsAt: number; onMain: boolean; minis: boolean }
type Point = { x: number; y: number }
const CELL_ASPECT = 2.1
const BOX = 40

const f1 = (n: number) => n.toFixed(1)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const SHAKE =
  '<animateTransform attributeName="transform" type="rotate" values="0;-7;0;7;0" dur="0.45s" repeatCount="indefinite"/>'
const TREMBLE =
  '<animateTransform attributeName="transform" type="rotate" values="0;1.2;-1.2;0" dur="0.12s" repeatCount="indefinite"/>'

// The weapon in hand, in the drawing's units: the person's in their fist by
// the pointer, the bow drawn as far as it has been held and aimed at the
// pointer (or, close to it, at the main mascot). At the minis, the main
// mascot's own bow, laid right over the one it holds in the band's still
// picture, drawn the same way; its other weapons stay as they are drawn
// (undefined: nothing to draw). Returns the markup and the point it is
// around.
export const inHand = (weapon: string, hand: Hand, cursor: Point, ticks: number, rows: number) => {
  const { kit } = hand
  const isMain = hand.minis && !hand.onMain && hand.startsAt === 0
  if (isMain && weapon !== 'bow') return undefined
  const fist = (p: Point, r = 2.2) => (isMain ? '' : `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${r}" fill="#5b3a1e"/>`)
  const at = (p: Point, inner: string) => `<g transform="translate(${f1(p.x)},${f1(p.y)})">${inner}</g>`
  const top = kit.bottom - rows * hand.cellUnits * CELL_ASPECT
  if (weapon === 'bow') {
    const anchor = isMain ? kit.mainBowAt : { x: Math.max(kit.personBowX, cursor.x), y: clamp(cursor.y, 4, 36) }
    const isNear = Math.hypot(cursor.x - anchor.x, cursor.y - anchor.y) < 3
    const target = isNear ? kit.chest : cursor
    const angle = isMain ? 0 : (Math.atan2(target.y - anchor.y, target.x - anchor.x) * 180) / Math.PI
    const power = Math.min(1, Math.max(0.06, (ticks * TICK_MS) / FULL_DRAW_MS))
    const pull = kit.pull * power
    const isFull = power >= 1
    const string = `<path d="M-4.5 -10.5 L${(-4.5 - pull).toFixed(2)} 0 L-4.5 10.5" stroke="#eceff1" stroke-width="0.55" fill="none"/>`
    const arrow = `<g transform="translate(${(-4.5 - pull + 15).toFixed(2)},0)">${kit.arrow}</g>`
    const barY = Math.max(top, anchor.y - 15)
    const bar = `<rect x="${f1(anchor.x - 8)}" y="${f1(barY)}" width="16" height="2" rx="1" fill="#000" opacity="0.25"/>` +
      `<rect x="${f1(anchor.x - 8)}" y="${f1(barY)}" width="${f1(16 * power)}" height="2" rx="1" fill="${isFull ? '#e53935' : '#ffd54a'}"/>`
    const bow = `<g transform="translate(${f1(anchor.x)},${f1(anchor.y)}) rotate(${angle.toFixed(1)})${isMain ? ` scale(${kit.mainBow})` : ''}"><g>${isFull ? TREMBLE : ''}${string}${kit.limbs}${arrow}</g></g>`

    return { body: bar + bow + fist(anchor, 2.4), center: anchor }
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
// The surface sizes the region by what it draws, so it draws `rows` blank
// rows across the whole width.
const Clicker: ClientModule<{ rows: number; reportsSize?: boolean; steps?: boolean; ready?: string; hand?: Hand }, State> = (
  props,
  surface,
) => {
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
    // The bow's bar grows while held.
    surface.every(TICK_MS, () => {
      const held = surface.state?.held
      if (held !== undefined && held.ticks * TICK_MS < FULL_DRAW_MS) surface.setState({ held: { ...held, ticks: held.ticks + 1 } })
    })
  }
  surface.onPointer(event => {
    if (props.steps === true && event.button === 'left' && event.ctrl !== true) {
      if (event.type !== 'down' && event.type !== 'move' && event.type !== 'up') return
      if (props.ready !== undefined) {
        const was = surface.state?.held
        if (event.type === 'up') surface.setState({})
        else if (event.type === 'down' || was !== undefined)
          surface.setState({
            held: { x: event.x, y: event.y, fx: event.fine?.x ?? event.x + 0.5, fy: event.fine?.y ?? event.y + 0.5, ticks: was?.ticks ?? 0 },
          })
      }
      surface.post({
        press: event.type,
        x: event.fine?.x ?? event.x + 0.5,
        y: event.fine?.y ?? event.y + 0.5,
        columns: surface.columns,
        rows: surface.rows,
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
      rows: surface.rows,
    })
  })
  const { Box, Text } = surface.elements
  const rows = Array.from({ length: props.rows }, (_, row) => <Text key={`r${row}`}> </Text>)
  const held = surface.state?.held
  let drawnInHand = null
  const hand = props.hand
  if (held !== undefined && props.ready !== undefined && hand !== undefined && hand.cellUnits > 0) {
    // The band's own picture, laid where the region sits over it.
    const { kit, cellUnits, startsAt } = hand
    const rowUnits = cellUnits * CELL_ASPECT
    const top = kit.bottom - props.rows * rowUnits
    const cursor = { x: startsAt + held.fx * cellUnits, y: top + held.fy * rowUnits }
    const drawn = inHand(props.ready, hand, cursor, held.ticks, props.rows)
    if (drawn !== undefined) {
      // Whole cells for the place, the picture's own frame moved to match.
      const left = Math.floor((drawn.center.x - BOX / 2 - startsAt) / cellUnits)
      const down = Math.floor((drawn.center.y - BOX / 2 - top) / rowUnits)
      const x0 = startsAt + left * cellUnits
      const y0 = top + down * rowUnits
      const px = BOX * kit.scale
      // An Svg built by hand: the region's table has none, and the desktop
      // draws one here as it does in the band.
      const picture = {
        type: 'Svg',
        props: {
          source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(x0)} ${f1(y0)} ${BOX} ${BOX}" width="${f1(px)}" height="${f1(px)}">${drawn.body}</svg>`,
          alt: props.ready,
          width: px,
          height: px,
        },
      } as unknown as RenderElement
      drawnInHand = (
        <Box key="in-hand" position="absolute" left={left} top={down}>
          {picture}
        </Box>
      )
    }
  }

  return (
    <Box flexDirection="column" width="100%" height={props.rows}>
      {rows}
      {drawnInHand}
    </Box>
  )
}

export default Clicker
