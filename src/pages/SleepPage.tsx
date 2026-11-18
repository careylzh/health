import { useMemo } from "react";
import { buildBullets, countTags } from "../data/insights";
import type { ChartView, Summary } from "../data/stats";
import { bulletText, formatTime, STRINGS, type Lang, type RangeDays } from "../i18n";
import { Cross } from "../Cross";
import { NightChart } from "../NightChart";

interface Props {
  summary: Summary;
  days: RangeDays;
  lang: Lang;
  view: ChartView;
  onView: (v: ChartView) => void;
  at: Date;
  onRefresh: () => void;
}

/** The original four sleep screens: average, night by night, broken sleep, at a glance. */
export function SleepPage({ summary, days, lang, view, onView, at, onRefresh }: Props) {
  const t = STRINGS[lang];
  const bullets = useMemo(() => buildBullets(summary, countTags(summary.window), summary.window.length), [summary]);
  return (
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
          <button className="updated" onClick={onRefresh} aria-label={t.refresh}>
            ↻ {t.updated(formatTime(at, lang))}
          </button>
        </div>
        <a className="scroll-cue" href="#chart" aria-label={t.scroll}>⌄</a>
      </section>

      <section className="screen" id="chart">
        <div className="card">
          <h2>{t.chartTitle}</h2>
          {summary.nights.length ? <NightChart nights={summary.nights} avg={summary.avgHours} avgExtra={summary.avgExtraHours} view={view} onView={onView} lang={lang} /> : <p className="muted">{t.noData}</p>}
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
  );
}
