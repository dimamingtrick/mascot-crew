# mascot-crew

A Claude Code mod: while a task runs, the Claude mascot works above the prompt in one of 50 professions. Each subagent climbs out as a mini Claude with a profession of its own, works beside it, then walks back, salutes and jumps under the prompt. 
## What you can do

- **Click the mascot** to punish it from where you clicked; **click anywhere else on the band** to have it punish the busy minis (just for fun, nothing is sent). In the terminal it's the 🪢 FASTER button. Each run picks a punishment at random and keeps it: from your prompt until the mascot leaves, every click gets the same one.
  - 🪢 **Lasso**: a lash and a 💥 over the head.
  - 🔫 **Revolver**: a shot at the feet with a bang, a 💥 where the bullet lands, and a hop. At the minis the mascot fires once at each, left to right.

  Everyone gets both, and they come up about equally often across runs.
- **Hover a mini** to see its model and the task it was given (`Sonnet 5.5: Native: photo sheet + live receipt`).
- **Click a mini** to open the crew pane: every subagent's task, model, status, time and recent steps.
- **Right-click a mini** for its menu: stop it, ask Claude how long it has left, or show its details.

A mini whose subagent left work running in the background (a dev server, say) goes home after a minute of quiet; the work keeps running in Background tasks.

## Install

One line (installs, or updates when already installed):

```
curl -fsSL https://raw.githubusercontent.com/dimamingtrick/mascot-crew/main/install.sh | bash
```

Or by hand:

```
claude plugin marketplace add dimamingtrick/mascot-crew
claude plugin install mascot-crew@dimamingtrick-mods
```

Animated drawings show in the desktop app's Code tab; the terminal draws a block-glyph version.

## Update

Run the install line again, or:

```
claude plugin marketplace update dimamingtrick-mods
claude plugin update mascot-crew@dimamingtrick-mods
```

Then start a new session.

## What it runs

Everything happens inside Claude Code, nothing leaves your machine. The mod reads the session's own events (turns, subagent spawns, tool calls) to draw the band, plays a bundled sound, and on your request from a mini's menu stops that subagent (TaskStop) or asks Claude in the chat how long it has left. It reads and writes no files and makes no network requests.

## License

MIT
