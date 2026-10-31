# mascot-crew

A Claude Code mod: while a task runs, the Claude mascot works above the prompt in one of 50 professions. Each subagent climbs out as a mini Claude with a profession of its own, works beside it, then walks back, salutes and jumps under the prompt. Up to six minis show at once.

## What you can do

- **Click the mascot** to punish it from where you clicked; **click anywhere else on the band** to have it punish the busy minis (just for fun, nothing is sent). In the terminal it's the 🪢 FASTER button. Each run picks a punishment at random as the mascot comes up and keeps it until it leaves: the mascot holds it while it waits, and every click gets the same one.
  - 🪢 **Lasso**: a lash and a 💥 over the head.
  - 🔫 **Revolver**: a shot at the feet with a bang, a 💥 where the bullet lands, and a hop. At the minis the mascot fires once at each, left to right.
  - 🍅 **Tomato**: thrown in an arc, it splats on the face with a squelch, then slides down the body to the ground, leaving a trail of juice and a puddle. Quick clicks throw one after another. At the minis the mascot throws one at each, left to right.

  Everyone gets all three, and they come up about equally often across runs.
- **Hover a mini** to see its model and the task it was given (`Sonnet 5.5: Native: photo sheet + live receipt`).
- **Click a mini** to open the crew pane: every working subagent's task, model, status, time and recent steps, each with ⏹ Stop and ⏱ How long left? buttons. In the terminal it's the 📋 Minis button.
- **Right-click a mini** for its menu: stop it, ask Claude how long it has left, or show its details.
- **Click the ⚙ gear** in the band's right corner to pick the language (English, the default, or Ukrainian) and which weapons a run may pick: untick the lasso, the revolver or the tomato to leave it out (all are on by default, and the last one on stays on). Both choices are kept for later sessions.

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

Everything happens inside Claude Code, nothing leaves your machine. The mod reads the session's own events (turns, subagent spawns, tool calls) to draw the band, plays its bundled sounds (the lash, the gunshot, the splat), and on your request from a mini's menu stops that subagent (TaskStop) or asks Claude in the chat how long it has left. It reads and writes no files and makes no network requests; the only things it keeps between sessions are your language and your weapons, in the mod's own store.

## License

MIT
