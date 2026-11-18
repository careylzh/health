# 0009 — Green has no fixed meaning; days since TCM; blank pharmacology = no change
**Date:** 2026-11-18 · **Status:** accepted (amends 0008)

## Context
Carey (2026-11-18):
- Green does not necessarily mean good mood or health. It can just mean a new med or supplement
  was started, and Carey needs to know what each green day actually was.
- Carey wants to track how many days it has been since starting TCM.
- Carey wants to know whether mental health has objectively improved since then.
- "Take blanks in the pharmacology column as no change." The first "resumed Li 200mg" is the day
  it was resumed at 200 mg. After that nothing changes unless something like "missed Li" is
  written.

## Decision
- **Green is just "Green".** The bot writes the flag `green` (the old `good` still reads as green).
  The public Highlighted days page shows only the label and counts.
- **What a green day was:** for green rows only, the bot adds a `Note` column to the `flags` tab:
  - the row's pharmacology cell, or its positive observation when that cell is empty or only a
    time like "(10.30pm)";
  - collapsed to one line, at most 140 characters.

  It is the same text that is already in the link-readable year tab. The site shows it **only
  behind the passcode**, as "Green days: what they were", newest first. Consecutive days with the
  same note are grouped. Red rows never carry text.
- **TCM day counter:** the start is the first green note that says it started ("start/began…")
  and mentions TCM. The start day is day 1. Carey says TCM is ongoing, so "no more TCM" (10 Nov)
  does not stop the counter. Other treatments can be added to `TRACKED` in `src/data/since.ts`.
  Undated rows can't be placed: "started new sleep TCM meds" has no date, so it is not on the
  timeline until it gets one.
- **Before vs since:** same-length stretches either side of the start. The table shows:
  - nights logged;
  - average sleep (total sleep time);
  - broken nights;
  - red days (severe or no-sleep);
  - days with low mood / good mood noted.

  The "before" column appears **only when both sides have ≥ 10 logged nights**. Otherwise the page
  says so, with the count: 4 of 41 nights at the time of writing. Lithium changes after the start
  are listed as a caveat, and the card says the counts are not a diagnosis.
- **Older tabs as a baseline:** checked read-only on 2026-11-18. None has daily sleep hours:
  - "Symptoms Tracking Apr–Jul 2025" is weekly 0–10 ratings over 11 weeks;
  - "Mirt Withdrawal Timeline" is free text;
  - "Raw Data" and "Episodes" are dose changes.

  They are not used.
- **Blank pharmacology = no change** (lithium, `src/data/meds.ts`):
  - A written dose carries forward to every blank day, up to today.
  - A "missed" note covers its own day. Blank days after it stay missed only when the next lithium
    note is another miss or a "resumed …" (resuming means it was paused). Otherwise they go back
    to the dose before the miss.
  - Counts for a range cover every calendar day.
  - As-needed mirtazapine stays per night: a blank night is a night without it.

## Rejected
- Splitting green automatically into "med change" vs "good day" by wording: Carey chose the
  neutral label plus notes.
- Calling the before/since table an improvement score: there is no baseline, lithium changed in the
  same weeks, and mood counts come from keywords, not a rating.
- "Blank = not noted" (0008's rule): replaced at Carey's request.

## Consequences
- An objective trend needs a regular measure. A daily 0–10 mood rating, like the Apr–Jul 2025
  tab had, could be added to the bot's morning questions if Carey wants it.
- New wording for starting a treatment ("commenced", "first dose of…") needs a test in
  `since.test.ts`.
