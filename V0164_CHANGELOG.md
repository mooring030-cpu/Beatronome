# Beatronome v0.16.4 — Loop & YouTube Speed

- Local and YouTube player: renamed A–B LOOP to LOOP, SET A to START, and SET B to END.
- YouTube requested speed: range 25–200%, 5% steps, numeric entry and ±5% buttons.
- IFrame API limitation: a video may not support every 5% increment. UI reports requested and actual playback rates separately, using getPlaybackRate/onPlaybackRateChange.
- Existing backing-track preferences are retained; no storage key reset.
- UI updates, no metronome engine changes.
