# Beatronome v0.16.5 — Reference Card & QA Fix

- Fixed Music Knowledge favorite star and expand (+ / −) buttons overlapping.
- Both controls now live in an accessible inline header action group (no absolute positioning).
- Favorite remains available even while cards are collapsed.
- Expanded/collapsed status is communicated with aria-expanded; favorite uses aria-pressed.
- Added small-screen wrapping/width limits; app audio engines untouched.
- UI smoke tests and overlap audit results are in QA_V0165.md.
