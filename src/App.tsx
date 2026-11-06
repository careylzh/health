import { useCallback, useEffect, useMemo, useState } from "react";
import { loadNights } from "./data/sheet";
import { CHART_VIEWS, summarise, type ChartView } from "./data/stats";
import { buildBullets, countTags } from "./data/insights";
import type { Night } from "./data/parse";
import { bulletText, formatTime, RANGES, STRINGS, type Lang, type RangeDays } from "./i18n";
import { Cross } from "./Cross";
import { CrossField } from "./CrossField";
import { NightChart } from "./NightChart";

// Per-viewer conveniences only; the app works without storage.
const load = <T,>(k: string, ok: (v: string) => boolean, d: T): T => {
  try { const v = localStorage.getItem(k); return v !== null && ok(v) ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

type State = { status: "loading" } | { status: "error" } | { status: "ready"; nights: Night[]; at: Date };

export default function App() {
  const [lang, setLang] = useState<Lang>(() => load("lang", (v) => v === '"en"' || v === '"zh"', "en"));
  const [days, setDays] = useState<RangeDays>(() => load("days", (v) => RANGES.includes(Number(v) as RangeDays), 7));
  const [view, setView] = useState<ChartView>(() => load("view", (v) => CHART_VIEWS.includes(JSON.parse(v)), "total"));
  const [state, setState] = useState<State>({ status: "loading" });
  const t = STRINGS[lang];

  // "Backend" = the viewer's browser fetching the sheet's CSV from Google on every load.
  const fetchData = useCallback(() => {
    setState({ status: "loading" });
    loadNights(new Date())
      .then((nights) => setState({ status: "ready", nights, at: new Date() }))
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(fetchData, [fetchData]);
  useEffect(() => { save("lang", lang); document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"; document.title = t.title; }, [lang, t.title]);
  useEffect(() => save("days", days), [days]);
  useEffect(() => save("view", view), [view]);

  const summary = useMemo(
    () => (state.status === "ready" ? summarise(state.nights, days, new Date()) : null),
    [state, days],
  );
  const bullets = useMemo(
    () => (summary ? buildBullets(summary, countTags(summary.window), summary.window.length) : []),
    [summary],
  );

  return (
    <>
      <CrossField />
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Cross /></span><span className="brand-name">{t.title}</span></div>
        <div className="controls">
          <select aria-label={t.heroEyebrow} value={days} onChange={(e) => setDays(Number(e.target.value) as RangeDays)}>
            {RANGES.map((d) => <option key={d} value={d}>{t.range[d]}</option>)}
          </select>
          <button className="lang" aria-label={t.langToggleLabel} onClick={() => setLang(lang === "en" ? "zh" : "en")}>
            {t.langToggle}
          </button>
        </div>
      </header>

      <main>
        {state.status !== "ready" || !summary ? (
          <section className="screen">
            <div className="card center">
              {state.status === "loading" ? (
                <><div className="pulse"><Cross /></div><p className="muted">{t.loading}</p></>
              ) : (
                <><p>{t.error}</p><button className="primary" onClick={fetchData}>{t.retry}</button></>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="screen" id="hero">
              <div className="hero">
                <p className="eyebrow">{t.heroEyebrow} · {t.range[days]}</p>
                {summary.avgHours !== null ? (
                  <>
                    <h1 className="big"><span className="pulse small"><Cross /></span>{summary.avgHours.toFixed(1)}<span className="unit">{t.hoursUnit}</span></h1>
                    <p className="sub">{t.heroSub(summary.nights.length, summary.minHours!.toFixed(1), summary.maxHours!.toFixed(1))}</p>
                  </>
                ) : (
                  <h1 className="big none">{t.noData}</h1>
                )}
                <button className="updated" onClick={fetchData} aria-label={t.refresh}>
                  ↻ {t.updated(formatTime(state.at, lang))}
                </button>
              </div>
              <a className="scroll-cue" href="#chart" aria-label={t.scroll}>⌄</a>
            </section>

            <section className="screen" id="chart">
              <div className="card">
                <h2>{t.chartTitle}</h2>
                {summary.nights.length ? <NightChart nights={summary.nights} avg={summary.avgHours} avgExtra={summary.avgExtraHours} view={view} onView={setView} lang={lang} /> : <p className="muted">{t.noData}</p>}
              </div>
            </section>

            <section className="screen" id="broken">
              <div className="card center">
                <h2>{t.fragTitle}</h2>
                {summary.fragmented > 0 ? (
                  <>
                    <p className="big mid">{t.fragBig(summary.fragmented, summary.nights.length)}<span className="unit">{t.fragUnit}</span></p>
                    <p className="sub">{t.fragSub(summary.avgExtraHours ?? 0)}</p>
                  </>
                ) : (
                  <p className="sub">{t.fragNone}</p>
                )}
              </div>
            </section>

            <section className="screen" id="glance">
              <div className="card">
                <h2>{t.glanceTitle} · {t.range[days]}</h2>
                <ul className="bullets">
                  {bullets.map((b, i) => {
                    const { icon, text } = bulletText(b, lang);
                    return <li key={i}><span className="b-icon" aria-hidden="true">{icon}</span>{text}</li>;
                  })}
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
