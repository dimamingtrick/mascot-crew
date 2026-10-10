import type { ClientModule } from 'claude-code'

// When the last click was posted: a press reports a down and an up, and the
// surface may pass on only one of them, so either one counts and its pair is
// let go.
let lastAt = 0

// A see-through region laid over the band. It posts to the hooks module:
// - `{ button, x, y, columns, rows }` for a click: left or right (the right
//   button, or a ctrl+click), where in the region, and how big it is;
// - with `reportsSize`, `{ size }` whenever its size changes.
// The surface sizes the region by what it draws, so it draws `rows` blank
// rows across the whole width.
const Clicker: ClientModule<{ rows: number; reportsSize?: boolean }, boolean> = (props, surface) => {
  if (surface.state === undefined) {
    surface.setState(true)
    if (props.reportsSize === true) {
      let columns = 0
      surface.every(300, () => {
        if (surface.columns === 0 || surface.columns === columns) return
        columns = surface.columns
        surface.post({ size: { columns: surface.columns, rows: surface.rows } })
      })
    }
  }
  surface.onPointer(event => {
    if (event.type !== 'down' && event.type !== 'up') return
    if (event.button === 'middle') return
    const now = Date.now()
    if (now - lastAt < 350) return
    lastAt = now
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

  return (
    <Box flexDirection="column" width="100%" height={props.rows}>
      {rows}
    </Box>
  )
}

export default Clicker
