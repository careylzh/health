import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultFetch, loadNights } from "./data/sheet";
import { loadFlags, type FlagData } from "./data/flags";
import { CHART_VIEWS, summarise, type ChartView } from "./data/stats";
import type { Night } from "./data/parse";
import { RANGES, STRINGS, type Lang, type RangeDays } from "./i18n";
import { unlockToken } from "./passcode";
import { Cross } from "./Cross";
import { CrossField } from "./CrossField";
import { SleepPage } from "./pages/SleepPage";
import { FlagsPage } from "./pages/FlagsPage";
import { MedsPage } from "./pages/MedsPage";

// Per-viewer conveniences only; the app works without storage.
const load = <T,>(k: string, ok: (v: string) => boolean, d: T): T => {
  try { const v = localStorage.getItem(k); return v !== null && ok(v) ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

const PAGES = ["sleep", "flags", "meds"] as const;
type Page = (typeof PAGES)[number];

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; nights: Night[]; flags: FlagData; at: Date };

export default function App() {
  const [lang, setLang] = useState<Lang>(() => load("lang", (v) => v === '"en"' || v === '"zh"', "en"));
  const [days, setDays] = useState<RangeDays>(() => load("days", (v) => RANGES.includes(Number(v) as RangeDays), 7));
  const [view, setView] = useState<ChartView>(() => load("view", (v) => CHART_VIEWS.includes(JSON.parse(v)), "total"));
  const [page, setPage] = useState<Page>(() => load("page", (v) => PAGES.includes(JSON.parse(v)), "sleep"));
  const [unlocked, setUnlocked] = useState(() => unlockToken() !== "" && load("meds", () => true, "") === unlockToken());
  const [drawer, setDrawer] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });
  const t = STRINGS[lang];

  // "Backend" = the viewer's browser fetching the sheet's CSV from Google on every load.
  const fetchData = useCallback(() => {
    setState({ status: "loading" });
    Promise.all([loadNights(new Date()), loadFlags(defaultFetch)])
      .then(([nights, flags]) => setState({ status: "ready", nights, flags, at: new Date() }))
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(fetchData, [fetchData]);
  useEffect(() => { save("lang", lang); document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"; document.title = t.title; }, [lang, t.title]);
  useEffect(() => save("days", days), [days]);
  useEffect(() => save("view", view), [view]);
  useEffect(() => { save("page", page); window.scrollTo({ top: 0, behavior: "auto" }); }, [page]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const summary = useMemo(
    () => (state.status === "ready" ? summarise(state.nights, days, new Date()) : null),
    [state, days],
  );

  const go = (p: Page) => { setPage(p); setDrawer(false); };
  const icons: Record<Page, string> = { sleep: "🌙", flags: "🚩", meds: unlocked ? "💊" : "🔒" };

  return (
    <>
      <CrossField />
      <header className="topbar">
        <div className="brand">
          <button className="menu" aria-label={t.nav.menu} aria-expanded={drawer} aria-controls="drawer" onClick={() => setDrawer(true)}>
            <span /><span /><span />
          </button>
          <span className="brand-mark"><Cross /></span><span className="brand-name">{t.title}</span>
        </div>
        <div className="controls">
          <select aria-label={t.heroEyebrow} value={days} onChange={(e) => setDays(Number(e.target.value) as RangeDays)}>
            {RANGES.map((d) => <option key={d} value={d}>{t.range[d]}</option>)}
          </select>
          <button className="lang" aria-label={t.langToggleLabel} onClick={() => setLang(lang === "en" ? "zh" : "en")}>
            {t.langToggle}
          </button>
        </div>
      </header>

      <div className={`scrim${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} aria-hidden="true" />
      <nav id="drawer" className={`drawer${drawer ? " open" : ""}`} aria-label={t.nav.menu} aria-hidden={!drawer} inert={!drawer}>
        <div className="drawer-head">
          <span className="brand-mark"><Cross /></span>
          <button className="drawer-close" aria-label={t.nav.close} onClick={() => setDrawer(false)}>×</button>
        </div>
        <ul>
          {PAGES.map((p) => (
            <li key={p}>
              <button aria-current={page === p ? "page" : undefined} onClick={() => go(p)}>
                <span className="b-icon" aria-hidden="true">{icons[p]}</span>{t.nav[p]}
              </button>
            </li>
          ))}
        </ul>
      </nav>

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
        ) : page === "flags" ? (
          <FlagsPage flags={state.flags.byDay} days={days} lang={lang} />
        ) : page === "meds" ? (
          <MedsPage
            nights={state.nights} flags={state.flags} days={days} lang={lang} unlocked={unlocked}
            onUnlock={() => { setUnlocked(true); save("meds", unlockToken()); }}
            onLock={() => { setUnlocked(false); save("meds", ""); }}
          />
        ) : (
          <SleepPage summary={summary} days={days} lang={lang} view={view} onView={setView} at={state.at} onRefresh={fetchData} />
        )}
      </main>
    </>
  );
}
