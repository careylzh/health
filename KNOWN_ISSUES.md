# Known issues

Traps that are known and not yet fixed. Each item: symptom · cause · direction.

## 1. Google `gviz` returns the first tab for an unknown sheet name
**Symptom:** requesting `sheet=2027` before that tab exists silently returns another year's rows.
**Cause:** endpoint behaviour, no 404. **Handled:** see `docs/decisions/0002-data-source.md`
(duplicate detection + future-date check). Keep the test in `src/data/sheet.test.ts` green.

## 2. Free-text sleep segments are heuristic
"went back to sleep from 6.30-10am" is parsed with regexes. Unusual phrasing is ignored (never
guessed). If a night looks short, check its remark wording and add a test case.

## 3. Zero-duration rows are ambiguous
`0.00` with no sleep/wake times is treated as **not logged** (many such rows are pre-filled
future placeholders). A genuinely sleepless night should be recorded with a note or times.
