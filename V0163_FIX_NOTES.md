# Beatronome v0.16.3 — Responsive Layout Fix

Based on v0.16.2, preserving all sound, tuner, backing player, cloud, and offline functionality.

## Confirmed root causes

1. At desktop widths, a legacy `#tabPractice.active` 2-column page grid restricted the **entire** backing player to half of the available width. The backing player's own nested two-column layout was therefore squeezed into ~600 px, producing cramped speed/key steppers and wrapping/overlap.
2. In the backing pane, file/player, speed/key, loop, and advanced tools were directly positioned by brittle child/grid-row rules. Hidden file/video and expanded `<details>` states could leave large blank tracks or tiny controls.
3. `quality.js` appended the ninth **앱 상태 진단** tile directly to `#tabMore`, **outside** the `.more-grid`, producing a third detached row even though 9 items fit in two rows with five columns.

## Fixed

- The practice player occupies the entire page width. Its left playback column and right settings column become two columns only when the *actual card content width* is at least 940 px; otherwise they stack in one column.
- Player columns use semantic wrappers, preventing the legacy grid row assignments from placing controls into incorrect/narrow tracks.
- Speed/Key input and steppers have min-width safeguards. Loop actions use a four-column grid. Advanced-tool title/description and expand icon have separate tracks.
- App diagnostics tile is inserted **inside** the More grid. At desktop widths >=980 px, 9 More cards fit in **2 rows (5 + 4)**. Tablet/mobile columns reduce responsively.
- Responsive tweaks are isolated in `responsive-v0163.css`, loaded after the prior design styles to avoid regressions in other screens.
- Version and service worker shell/cache bumped to 0.16.3. Offline cache includes the new CSS file.

## Validation limits

Static checks cover HTML structure, duplicated IDs, CSS syntax, JS syntax, asset references, and ZIP integrity. Live Chromium navigation was blocked by the current test environment, so real browser screenshot/gesture tests could not be completed here. After deploying, verify at actual device/browser sizes, including opened advanced tools and backing audio/video playback.
