# Architecture overview

```
Google Sheet (tab per year) ──gviz CSV──▶ src/data/sheet.ts   fetch current + previous year, de-dupe
                                          src/data/csv.ts     RFC-4180 CSV parser
                                          src/data/parse.ts   rows → Night { date, mainHours, extraHours, … }
                                          src/data/stats.ts   range filter → averages, fragmentation, tallies
                                                   │
                                                   ▼
                                          src/App.tsx         range dropdown + language toggle, screens:
                                            Hero (avg hours) · Nights (bar chart) · Fragmented · Mood & appetite
                                          src/CrossField.tsx  decorative floating crosses
                                          src/i18n.ts         en / zh strings
```
Everything under `src/data/` is pure and unit-tested; components only render.
