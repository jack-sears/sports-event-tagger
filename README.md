# Sports Events Tagger

A browser-based tool for tagging sports events while watching match video. Mark event types, players, pitch locations, and metadata, then export everything as CSV.

**Stack:** static HTML, CSS, and JavaScript — no build step or npm install.

## Features

- **Video** — Upload MP4 or QuickTime (`.mov`) files; native controls plus keyboard shortcuts.
- **Sports** — Soccer, hockey, or basketball field/rink/court diagram on the canvas (dimensions update per sport).
- **Lineup** — Define up to 18 players; click a player to tag them for the next event.
- **Event types** — Default tags include Pass, Shot, Tackle, Clearance, Error (customizable).
- **Pitch / court locations** — Click the diagram: two clicks for Pass / Shot / Clearance (start → end); one click for Tackle / Error.
- **Outcomes & context** — Outcome, possession type, body part (all editable).
- **Custom categories** — Add extra button groups in **Edit Buttons**; values are saved on each event and included in CSV columns.
- **Table** — Review and inline-edit tags; delete rows.
- **Export** — Download CSV with timestamped filename (includes sport in the name, e.g. `soccer-events-2025-03-18.csv`).
- **Persistence** — Sport choice, tag button layout, and categories are stored in `localStorage` in your browser.

## How to run

1. Clone or copy this folder.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).

   Some browsers restrict `file://` for certain features; if anything misbehaves, serve the folder locally, for example:

   ```bash
   # Python 3
   python -m http.server 8080
   ```

   Then visit `http://localhost:8080`.

## Quick workflow

1. **Upload** a video.
2. (Optional) **Enter** your lineup via **Edit** next to Team Lineup, then **Save Lineup**.
3. Choose **Sport** (soccer / hockey / basketball) so the diagram matches your footage.
4. Select **event type** and any outcome / possession / body-part (or custom) buttons.
5. **Click** the field/court for start (and end where needed).
6. Select a **player** from the grid (or events will use `"Unknown"`).
7. Click **Add Event** to append a row.
8. Repeat; use **Export CSV** when done.

## Keyboard (when not typing in an input)

| Key | Action |
|-----|--------|
| **Space** | Play / pause video |
| **←** / **→** | Skip 5 seconds |
| **Shift** + **←** / **→** | Skip 10 seconds |

Shortcuts are disabled while focus is in inputs, text areas, selects, or on buttons so normal typing and UI interaction aren’t affected.

## CSV columns

Default columns (in order):

`eventType`, `player`, `startX`, `startY`, `endX`, `endY`, `time`, `outcome`, `possession`, `bodypart`

Coordinates are in the same units as the diagram (per sport). `time` is the video timestamp in seconds when the tag was placed.

Any **custom categories** you add appear as **extra columns** after these (sorted alphabetically by key).

## Project structure

```
sports-event-tagger/
├── index.html    # Page layout
├── style.css     # Layout and styling
├── script.js     # Tagging logic, modals, export
└── README.md     # This file
```

## Tips

- Use **Edit Buttons** to rename categories, add/remove tag options, or add new categories for your sport.
- You can **edit cells** in the events table directly; changes update the data used for export.
- Clearing site data for the origin will reset saved button layouts and sport preference.

