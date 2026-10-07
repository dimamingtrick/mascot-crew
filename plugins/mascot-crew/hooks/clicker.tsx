import type { ClientModule } from 'claude-code'

// When the last lash was posted: a press reports a down and an up, and a
// surface may report only one of them, so either one lashes and its pair is
// let go.
let lastAt = 0

// A see-through region laid over the main mascot: a click on it is a lash,
// posted to the hooks module. The surface sizes the region by what it draws,
// so it draws `rows` blank rows across the whole width.
const Clicker: ClientModule<{ rows: number }> = (props, surface) => {
  surface.onPointer(event => {
    if (event.type !== 'down' && event.type !== 'up') return
    if (event.button === 'right' || event.button === 'middle') return
    const now = Date.now()
    if (now - lastAt < 350) return
    lastAt = now
    surface.post({ lash: true })
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
