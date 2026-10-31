import type { ClientModule } from 'claude-code'

// When a posted down is still waiting for its up: a press reports a down and
// an up, and the surface may pass on only one of them, so either one counts
// and the up of a posted down is let go. The up reaches the instance that
// took the down. No wait between presses: quick clicks each count.
let heldSince = 0
const HOLD_MS = 2000

// The weapon drawn under the pointer while a press is held, and how far the
// bow is drawn: full in FULL_DRAW_MS, as the hooks module counts it.
const FULL_DRAW_MS = 1000
const BAR = 5
const TICK_MS = 100
const READY: Record<string, string> = { lasso: '🪢', gun: '🔫', tomato: '🍅', bow: '🏹' }
// How many cells left of the pointer the hand is, as the hooks module draws it.
const HAND_LEFT = 2

// `ticks`: TICK_MS steps of the surface's frame clock since the press.
type Held = { x: number; y: number; ticks: number }
type State = { held?: Held }

// A see-through region laid over the band. It posts to the hooks module:
// - `{ button, x, y, columns, rows }` for a click: left or right (the right
//   button, or a ctrl+click), where in the region, and how big it is;
// - with `steps`, `{ press, x, y, columns, rows }` instead for each step of
//   a left press (the right button's clicks stay as above): `down`, every
//   `move` while it is held (the region keeps the pointer until the button
//   comes up, past its edges too), and `up`; `x` and `y` in cells with the
//   fraction kept, the middle of a cell where the surface knows no finer;
// - with `reportsSize`, `{ size }` whenever its size changes.
// With `ready`, the run's weapon, it draws that weapon in the hand under the
// pointer while a left press is held, and the bow's draw over it: the
// desktop holds the band's own drawing still until the button comes up, but
// not this region's.
// The surface sizes the region by what it draws, so it draws `rows` blank
// rows across the whole width.
const Clicker: ClientModule<{ rows: number; reportsSize?: boolean; steps?: boolean; ready?: string }, State> = (
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
          surface.setState({ held: { x: event.x, y: event.y, ticks: was?.ticks ?? 0 } })
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
  const glyph = props.ready === undefined ? undefined : READY[props.ready]
  let inHand = null
  if (held !== undefined && glyph !== undefined) {
    const left = Math.max(0, Math.min(surface.columns - 2, held.x - HAND_LEFT))
    const top = Math.max(0, Math.min(props.rows - 1, held.y))
    const drawn = Math.min(BAR, Math.round(((held.ticks * TICK_MS) / FULL_DRAW_MS) * BAR))
    const isFull = drawn >= BAR
    inHand = (
      <Box key="in-hand" position="absolute" left={left} top={Math.max(0, top - (props.ready === 'bow' ? 1 : 0))} flexDirection="column">
        {props.ready === 'bow' && top > 0 && (
          <Text key="draw" color={isFull ? 'red' : 'yellow'}>
            {'▰'.repeat(drawn) + '▱'.repeat(BAR - drawn)}
          </Text>
        )}
        <Text key="weapon">{glyph}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" width="100%" height={props.rows}>
      {rows}
      {inHand}
    </Box>
  )
}

export default Clicker
