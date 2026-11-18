import { useMemo, useState, type FormEvent } from "react";
import { lithiumRuns, summariseMeds } from "../data/meds";
import type { Night } from "../data/parse";
import type { Summary } from "../data/stats";
import { checkPasscode, passcodeSet } from "../passcode";
import { formatDay, STRINGS, type Lang, type RangeDays } from "../i18n";

interface Props {
  nights: Night[];
  summary: Summary;
  days: RangeDays;
  lang: Lang;
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

/** Lithium dose changes and as-needed mirtazapine, behind a passcode (decision 0008). */
export function MedsPage({ nights, summary, days, lang, unlocked, onUnlock, onLock }: Props) {
  const t = STRINGS[lang];
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const runs = useMemo(() => lithiumRuns(nights), [nights]);
  const s = useMemo(() => summariseMeds(summary.window, days), [summary, days]);
  const day = (iso: string) => formatDay(iso, lang);

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
  return (
    <>
      <section className="screen">
        <div className="card center">
          <p className="eyebrow">{t.liNow}</p>
          {now ? (
            <>
              <p className="big mid">
                {now.state.kind === "missed" ? t.liMissed : now.state.mg ?? "✓"}
                {now.state.kind === "taken" && now.state.mg !== null && <span className="unit">mg</span>}
              </p>
              <p className="sub">{t.liSince(day(now.from), day(now.to))}</p>
              <p className="sub">{t.liRange(t.range[days], s.liTaken, s.liMissed)}</p>
            </>
          ) : (
            <p className="sub">{t.liNone}</p>
          )}
          <button className="updated" onClick={onLock}>🔒 {t.lockAgain}</button>
        </div>
      </section>

      {runs.length > 0 && (
        <section className="screen">
          <div className="card">
            <h2>{t.liChanges}</h2>
            <ul className="runs">
              {runs.slice(-6).reverse().map((r) => (
                <li key={r.from} className={r.state.kind === "missed" ? "missed" : ""}>
                  <span className="run-when">{r.from === r.to ? day(r.from) : `${day(r.from)} – ${day(r.to)}`}</span>
                  <span className="run-what">{t.liRun(r.state.mg, r.state.kind === "missed", r.noted)}</span>
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
