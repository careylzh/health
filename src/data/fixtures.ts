// SYNTHETIC test data only — never paste real health notes here (AGENTS.md).
export const HEADER =
  '"Dates","Pharmacology last night","Positive Observations","Negative observations ","Duration slept last night(estimated)","Sleep time","Wake time","reasons for change","remarks"';

export const row = (cells: string[]) => cells.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");

export const TAB_2026 = [
  HEADER,
  row(["20/12", "x", "felt calm", "", "", "", "", "", ""]), // previous-year row at top
  row(["5/1/26", "", "", "", "7.00", "23:00", "06:00", "", ""]),
  row(["10/10", "", "great appetite at dinner", "", "4.00", "01:00", "05:00", "", ""]),
  row(["16/10", "", "did not wake up feeling unrested", "", "5.50", "22:30", "04:00", "", "slept from 5.30-8.30am, waking up intermittently"]),
  row(["18/10", "", "", "Obvious depressive symptoms. Dull frontal headache", "5.00", "22:00", "03:00", "", "Slept from 4am-8am"]),
  row(["22/10", "", "", "", "0.00", "", "", "", ""]), // not logged
  row(["26/10", "", "", "", "6.00", "00:00", "06:00", "", "then went back to sleep from 6.30-7.30, 8-10am"]),
  row(["27/10", "a note-only row", "", "", "", "", "", "", ""]),
  row(["27/10", "", "", "anxious after training", "0.00", "", "", "", ""]),
  row(["9/10", "", "", "", "0.00", "07:00", "09:00", "", ""]), // 0 but has times
  row(["14/10", "", "", "slept 1-2 hours in the early morning", "4.50", "02:30", "07:30", "", ""]),
  row(["", "", "", "", "0.00", "", "", "", ""]),
  row(["6/11", "", "", "", "0.00", "", "", "", ""]), // future placeholder
].join("\n");
