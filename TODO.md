# TODO — forward-looking work

State → [HANDOFF.md](HANDOFF.md). Tick a box only for behaviour you observed (see AGENTS.md).

## Next up
- [ ] Carey: set the meds passcode: `node scripts/set-passcode.mjs`, commit `src/passcodeHash.ts`,
      push. Until then the Medication page says "not set up".
- [ ] After the bot deploy: check that the `flags` tab appears in the sheet and the Highlighted days
      page shows real counts (decision 0008).
- [ ] 31 Dec 2026: check that the bot created the `2027` tab and messaged the chat. On 1 Jan,
      check that the site reads it.
- [ ] Carey: connect GitHub in the Claude app's Code tab, then ship one change from the phone to
      prove the path (decision 0007). The Actions deploy itself went green on 2026-11-09.
- [ ] Sleep Log bot: deployed to the DigitalOcean droplet 2026-11-04. Check that the 08:00 SGT
      question arrives on 2026-11-05, then tick this.
- [ ] Walk the live site on a real phone and iPad in both languages; note anything cluttered.
- [ ] "Share/present" mode: hide the dropdown and toggle, auto-advance screens every ~8 s.
- [ ] Custom date range (from/to) in addition to the presets.
- [ ] Sleep timing screen: typical bedtime / wake time (median) for the range.
- [ ] Offline/last-good cache: keep the last successful fetch in `localStorage` for clinic Wi-Fi.

## Ideas (not committed to)
- Weekly trend line across months.
- Printable one-page PDF for doctors.
