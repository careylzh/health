import { useMemo, useState } from "react";
import { FLAGS, summariseFlags, type Flag } from "../data/flags";
import { formatDay, STRINGS, type Lang, type RangeDays } from "../i18n";

interface Props { flags: Map<string, Flag[]>; days: RangeDays; lang: Lang }

/** Red / light-red / green highlighted days: counts, then a day-by-day grid. No note text. */
export function FlagsPage({ flags, days, lang }: Props) {
  const t = STRINGS[lang];
  const s = useMemo(() => summariseFlags(flags, days, new Date()), [flags, days]);
  const [picked, setPicked] = useState<string | null>(null);
  const any = FLAGS.some((f) => s.counts[f] > 0);
  const pickedDay = s.days.find((d) => d.iso === picked);
  // Leading blanks so columns are weekdays (Mon first).
  const lead = s.days.length ? (new Date(s.days[0].iso + "T00:00").getDay() + 6) % 7 : 0;

  return (
    <>
      <section className="screen">
        <div className="card center">
          <h2>{t.flagsTitle} · {t.range[days]}</h2>
          {flags.size === 0 ? (
            <p className="sub">{t.flagsNotSynced}</p>
          ) : (
            <>
              <ul className="tiles">
                {FLAGS.map((f) => (
                  <li key={f} className={`tile tile-${f}`}>
                    <span className="tile-n">{s.counts[f]}</span>
                    <span className="tile-l">{t.flag[f]}</span>
                  </li>
                ))}
              </ul>
              <p className="sub">{any ? t.flagsFrom : t.flagsNone}</p>
            </>
          )}
        </div>
      </section>

      {flags.size > 0 && (
        <section className="screen">
          <div className="card">
            <h2>{t.flagsGridTitle}</h2>
            <ul className="legend">
              {FLAGS.map((f) => <li key={f}><span className={`sw sw-${f}`} />{t.flag[f]}</li>)}
            </ul>
            <div className={`daygrid${days > 30 ? " dense" : ""}`} role="list">
              {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} className="day blank" aria-hidden="true" />)}
              {s.days.map((d) => {
                const label = t.flagDay(formatDay(d.iso, lang), d.flags.map((f) => t.flag[f]).join(", "));
                return (
                  <button
                    key={d.iso}
                    role="listitem"
                    className={`day ${d.flags.map((f) => `has-${f}`).join(" ")}${d.flags.length > 1 ? " two" : ""}${picked === d.iso ? " on" : ""}`}
                    data-a={d.flags[0]}
                    data-b={d.flags[1]}
                    aria-label={label}
                    onClick={() => setPicked(picked === d.iso ? null : d.iso)}
                  />
                );
              })}
            </div>
            <p className="chart-detail">
              {pickedDay ? t.flagDay(formatDay(pickedDay.iso, lang, { weekday: "short", day: "numeric", month: "short" }), pickedDay.flags.map((f) => t.flag[f]).join(", ")) : t.flagsTap}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
