import { useEffect, useMemo, useRef, useState } from "react";
import { totalHours, type Night } from "./data/parse";
import { barFor, chartScale, CHART_VIEWS, brokenCount, nightQuality, type ChartView } from "./data/stats";
import { appetiteState } from "./data/keywords";
import { formatDay, STRINGS, type Lang } from "./i18n";

interface Props {
  nights: Night[]; // logged nights only — empty rows are never plotted
  avg: number | null; // mean total hours over logged nights
  avgExtra: number | null; // mean back-to-sleep hours over broken nights
  view: ChartView;
  onView: (v: ChartView) => void;
  lang: Lang;
}

const H = 240;
const PAD = { top: 22, right: 10, bottom: 26, left: 28 };

/**
 * One bar per logged night. Views: total sleep stacked as main + back-to-sleep (with average +
 * quality dots), broken vs unbroken
 * nights, or back-to-sleep hours only (with the average over broken nights).
 */
export function NightChart({ nights, avg, avgExtra, view, onView, lang }: Props) {
  const t = STRINGS[lang];
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => setSel(null), [nights]);

  const bars = useMemo(() => nights.map((n) => barFor(n, view)), [nights, view]);
  const { maxY, step } = useMemo(() => chartScale(Math.max(0, ...bars.map((b) => b?.hours ?? 0)), view), [bars, view]);
  const broken = brokenCount(nights);
  const refLine = view === "total" ? avg : view === "extra" ? avgExtra : null;
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = nights.length ? plotW / nights.length : plotW;
  const barW = Math.max(2, Math.min(28, slot - 2)); // 2px surface gap between bars
  const y = (h: number) => PAD.top + plotH - (h / maxY) * plotH;
  const x = (i: number) => PAD.left + i * slot + (slot - barW) / 2;
  const r = Math.min(4, barW / 2);
  const ticks = Array.from({ length: maxY / step + 1 }, (_, i) => i * step);
  const labelIdx = nights.length <= 1 ? [0] : [0, Math.floor((nights.length - 1) / 2), nights.length - 1];

  const selected = sel !== null ? nights[sel] : null;
  const ariaSummary = nights
    .map((n, i) => `${formatDay(n.iso, lang)} ${t.hours(bars[i]?.hours ?? 0)}`)
    .join(", ");

  return (
    <div className="chart" ref={wrap}>
      <div className="seg" role="group" aria-label={t.viewLabel}>
        {CHART_VIEWS.map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => onView(v)}>{t.view[v]}</button>
        ))}
      </div>
      <ul className="legend">
        {view === "total" && <>
          <li><i className="sw sw-total" />{t.legendMain}</li>
          <li><i className="sw sw-extra" />{t.legendExtra}</li>
          <li><i className="sw sw-avg" />{t.legendAvg}</li>
        </>}
        {view === "broken" && <>
          <li><i className="sw sw-broken" />{t.legendBroken(broken)}</li>
          <li><i className="sw sw-whole" />{t.legendWhole(nights.length - broken)}</li>
        </>}
        {view === "extra" && <>
          <li><i className="sw sw-extra" />{t.legendExtra}</li>
          {avgExtra !== null && <li><i className="sw sw-avg" />{t.legendAvgExtra}</li>}
        </>}
      </ul>
      {view === "total" && (
        <ul className="legend legend-q">
          {(["good", "mixed", "poor"] as const).map((q) => (
            <li key={q}><i className={`dot q-${q}`} />{t.quality[q]}</li>
          ))}
        </ul>
      )}
      <svg
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label={`${t.chartTitle}: ${ariaSummary}`}
        onMouseLeave={() => setSel(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="axis" x={PAD.left - 6} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        {nights.map((n, i) => {
          const b = bars[i];
          const q = view === "total" ? nightQuality(n) : null;
          const dim = sel !== null && sel !== i;
          return (
            <g key={n.iso} className={dim ? "bar dim" : "bar"}>
              {b && b.main !== undefined && b.main < b.hours ? (
                <>
                  <path className="bar-total" d={roundedTop(x(i), y(b.main), barW, y(0) - y(b.main), 0)} />
                  <path className="bar-extra" d={roundedTop(x(i), y(b.hours), barW, Math.max(0, y(b.main) - y(b.hours) - 2), r)} />
                </>
              ) : b && <path className={`bar-${b.kind}`} d={roundedTop(x(i), y(b.hours), barW, y(0) - y(b.hours), r)} />}
              {q && b && <circle className={`q q-${q}`} cx={x(i) + barW / 2} cy={y(b.hours) - 8} r={Math.min(4, Math.max(2.5, barW / 3))} />}
              <rect
                className="hit"
                x={PAD.left + i * slot}
                y={PAD.top - 16}
                width={slot}
                height={plotH + 16}
                onMouseEnter={() => setSel(i)}
                onClick={() => setSel(sel === i ? null : i)}
              />
            </g>
          );
        })}
        {refLine !== null && (
          <g className="avg">
            <line x1={PAD.left} x2={width - PAD.right} y1={y(refLine)} y2={y(refLine)} />
          </g>
        )}
        {labelIdx.map((i) =>
          nights[i] ? (
            <text
              key={i}
              className="axis"
              x={x(i) + barW / 2}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === nights.length - 1 ? "end" : "middle"}
            >
              {formatDay(nights[i].iso, lang)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="chart-detail" aria-live="polite">
        {selected ? <Detail n={selected} lang={lang} />
          : view === "extra" && broken === 0 ? <span className="muted">{t.fragNone}</span>
          : <span className="muted">{t.tapHint}</span>}
      </div>
    </div>
  );
}

function Detail({ n, lang }: { n: Night; lang: Lang }) {
  const t = STRINGS[lang];
  const q = nightQuality(n);
  // Appetite shows as one state ("mixed appetite"), never as two contradicting tags.
  const app = appetiteState(n.tags);
  const tags = [
    ...n.tags.filter((k) => k !== "rested" && k !== "unrested" && !k.endsWith("Appetite")).map((k) => t.tag[k]),
    ...(app ? [t.appetiteState[app]] : []),
  ].slice(0, 2);
  return (
    <span>
      <b>{formatDay(n.iso, lang, { weekday: "short", day: "numeric", month: "short" })}</b>
      {" · "}
      {t.hours(totalHours(n))}
      {n.extraHours > 0 && <span className="muted"> ({t.hours(n.mainHours ?? 0)} + {t.hours(n.extraHours)})</span>}
      {q && <> · <i className={`dot q-${q}`} /> {t.quality[q]}</>}
      {tags.length > 0 && <span className="muted"> · {tags.join(", ")}</span>}
    </span>
  );
}

/** Rect path with only the top corners rounded (data-end rounding, flat baseline). */
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
