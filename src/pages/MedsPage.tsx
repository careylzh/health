import { useMemo, useState, type FormEvent } from "react";
import { lithiumRuns, summariseMeds } from "../data/meds";
import type { FlagData } from "../data/flags";
import type { Night } from "../data/parse";
import { compareSince, dayNumber, greenTimeline, MIN_LOGGED, TRACKED, trackedStart, type PeriodStats } from "../data/since";
import { checkPasscode, passcodeSet } from "../passcode";
import { formatDay, STRINGS, type Lang, type RangeDays } from "../i18n";

interface Props {
  nights: Night[];
  flags: FlagData;
  days: RangeDays;
  lang: Lang;
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

const h1 = (n: number | null) => (n === null ? "—" : `${(Math.round(n * 10) / 10).toFixed(1)} h`);

/** Behind a passcode (decisions 0008, 0009): days since starting TCM, an honest before/since
 *  comparison, what each green day was, lithium changes and as-needed mirtazapine. */
export function MedsPage({ nights, flags, days, lang, unlocked, onUnlock, onLock }: Props) {
  const t = STRINGS[lang];
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = useMemo(() => new Date(), []);
  const runs = useMemo(() => lithiumRuns(nights, today), [nights, today]);
  const s = useMemo(() => summariseMeds(nights, runs, days, today), [nights, runs, days, today]);
  const greens = useMemo(() => greenTimeline(flags.notes), [flags]);
  const tracked = useMemo(
    () => TRACKED.map((x) => ({ key: x.key, start: trackedStart(greens, x.match) })).filter((x) => x.start !== null) as { key: (typeof TRACKED)[number]["key"]; start: string }[],
    [greens],
  );
  const main = tracked[0] ?? null;
  const cmp = useMemo(() => (main ? compareSince(nights, flags.byDay, runs, main.start, today) : null), [main, nights, flags, runs, today]);
  const day = (iso: string) => formatDay(iso, lang);
  const span = (a: string, b: string) => (a === b ? day(a) : t.cmpDates(day(a), day(b)));

  if (!unlocked) {
    const submit = async (e: FormEvent) => {
      e.preventDefault();
      setBusy(true);
      const ok = await checkPasscode(code);
      setBusy(false);
      setWrong(!ok);
      if (ok) { setCode(""); onUnlock(); }
    };
    return (
      <section className="screen">
        <div className="card center">
          <h2>🔒 {t.lockTitle}</h2>
          {passcodeSet() ? (
            <form className="lock" onSubmit={submit}>
              <p className="sub">{t.lockSub}</p>
              <input
                type="password" autoComplete="current-password" aria-label={t.lockInput} placeholder={t.lockInput}
                value={code} onChange={(e) => { setCode(e.target.value); setWrong(false); }}
              />
              <button className="primary" type="submit" disabled={busy || !code}>{t.unlock}</button>
              <p className="lock-msg" role="status">{wrong ? t.wrongCode : ""}</p>
            </form>
          ) : (
            <p className="sub">{t.notSetUp}</p>
          )}
        </div>
      </section>
    );
  }

  const now = runs[runs.length - 1];
  const rows: [string, (p: PeriodStats) => string][] = [
    [t.cmpLogged, (p) => `${p.logged} / ${p.days}`],
    [t.cmpAvg, (p) => h1(p.avgHours)],
    [t.cmpBroken, (p) => String(p.broken)],
    [t.cmpRed, (p) => String(p.redDays)],
    [t.cmpLow, (p) => String(p.lowMood)],
    [t.cmpGood, (p) => String(p.goodMood)],
  ];

  return (
    <>
      {main && (
        <section className="screen">
          <div className="card center">
            <p className="eyebrow">{t.tracked[main.key]}</p>
            <p className="big mid">{t.dayN(dayNumber(main.start, today))}</p>
            <p className="sub">{t.trackedSince(day(main.start))}</p>
            <button className="updated" onClick={onLock}>🔒 {t.lockAgain}</button>
          </div>
        </section>
      )}

      {main && cmp && (
        <section className="screen">
          <div className="card">
            <h2>{t.cmpTitle(t.tracked[main.key])}</h2>
            <table className="compare">
              <thead>
                <tr>
                  <th />
                  {cmp.enough && <th>{t.cmpBefore}<br />{span(cmp.before.from, cmp.before.to)}</th>}
                  <th>{t.cmpSince}<br />{span(cmp.since.from, cmp.since.to)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, f]) => (
                  <tr key={label}><td>{label}</td>{cmp.enough && <td>{f(cmp.before)}</td>}<td>{f(cmp.since)}</td></tr>
                ))}
              </tbody>
            </table>
            {!cmp.enough && <p className="caveat">{t.cmpNotEnough(cmp.before.logged, cmp.before.days, MIN_LOGGED)}</p>}
            {cmp.liChanges.length > 0 && (
              <p className="caveat">{t.cmpLiCaveat(cmp.liChanges.slice(0, 3).map((r) => day(r.from)).join(", "))}</p>
            )}
            <p className="sub small">{t.cmpNotProof}</p>
          </div>
        </section>
      )}

      <section className="screen">
        <div className="card">
          <h2>{t.greensTitle}</h2>
          {greens.length ? (
            <ul className="greens">
              {greens.slice(-8).reverse().map((g) => (
                <li key={g.from}>
                  <span className="g-when">{span(g.from, g.to)}</span>
                  <span className="g-note">{g.note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t.greensNone}</p>
          )}
        </div>
      </section>

      <section className="screen">
        <div className="card center">
          <p className="eyebrow">{t.liNow}</p>
          {now ? (
            <>
              <p className="big mid">
                {now.state.kind === "missed" ? t.liMissed : now.state.mg ?? "✓"}
                {now.state.kind === "taken" && now.state.mg !== null && <span className="unit">mg</span>}
              </p>
              <p className="sub">{t.liSince(day(now.from), day(now.lastNoted || now.from))}</p>
              <p className="sub">{t.liRange(t.range[days], s.liTaken, s.liMissed)}</p>
            </>
          ) : (
            <p className="sub">{t.liNone}</p>
          )}
          {!main && <button className="updated" onClick={onLock}>🔒 {t.lockAgain}</button>}
        </div>
      </section>

      {runs.length > 0 && (
        <section className="screen">
          <div className="card">
            <h2>{t.liChanges}</h2>
            <ul className="runs">
              {runs.slice(-6).reverse().map((r) => (
                <li key={r.from} className={r.state.kind === "missed" ? "missed" : ""}>
                  <span className="run-when">{span(r.from, r.to)}</span>
                  <span className="run-what">{t.liRun(r.state.mg, r.state.kind === "missed", dayNumber(r.from, new Date(r.to + "T00:00")))}</span>
                </li>
              ))}
            </ul>
            <p className="sub small">{t.medsNote}</p>
          </div>
        </section>
      )}

      <section className="screen">
        <div className="card center">
          <h2>{t.mirtTitle}</h2>
          {s.mirtNights > 0 ? (
            <>
              <p className="big mid">{t.mirtBig(s.mirtNights, days)}<span className="unit">{t.mirtUnit}</span></p>
              <p className="sub">{t.mirtSub(s.mirtDoses, day(s.lastMirt!))}</p>
            </>
          ) : (
            <p className="sub">{t.mirtNone} · {t.range[days]}</p>
          )}
        </div>
      </section>
    </>
  );
}
