/**
 * All user-visible copy, English + 中文. Components never hard-code strings (AGENTS.md).
 * Bullet templates must stay 5–10 words (EN) / ≤ 20 characters (ZH) — i18n.test.ts enforces it.
 */
import type { Bullet } from "./data/insights";
import type { TagKey } from "./data/keywords";
import type { Quality } from "./data/stats";

export type Lang = "en" | "zh";

export const RANGES = [7, 14, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

const h1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

const en = {
  title: "Pink of Health",
  range: { 7: "Past week", 14: "Past 2 weeks", 30: "Past month", 90: "Past 3 months" } as Record<RangeDays, string>,
  langToggle: "中文",
  langToggleLabel: "Switch to Chinese",
  loading: "Fetching the latest log…",
  error: "Couldn't reach the sheet. Pull to retry.",
  retry: "Retry",
  updated: (t: string) => `Updated ${t}`,
  refresh: "Refresh",
  heroEyebrow: "Average sleep",
  hoursUnit: "h / night",
  heroSub: (n: number, lo: string, hi: string) => `${n} nights logged · ${lo}–${hi} h`,
  noData: "No nights logged in this range",
  chartTitle: "Night by night",
  legendMain: "Main sleep",
  legendExtra: "Back to sleep",
  legendAvg: "Average",
  tapHint: "Tap a bar for details",
  fragTitle: "Broken sleep",
  fragBig: (k: number, n: number) => `${k} of ${n}`,
  fragUnit: "nights",
  fragSub: (h: number) => `+${h1(h)} h back to sleep, on average`,
  fragNone: "No broken nights noted",
  glanceTitle: "At a glance",
  hours: (n: number) => `${h1(n)} h`,
  quality: { good: "Rested", mixed: "Mixed", poor: "Restless" } as Record<Quality, string>,
  tag: {
    rested: "rested", unrested: "unrested", wokeOften: "woke often", coldSweat: "cold sweats",
    nausea: "nausea", headache: "headache", gut: "stomach upset", lowMood: "low mood",
    anxious: "anxiety", irritable: "irritability", goodMood: "upbeat mood",
    goodAppetite: "good appetite", poorAppetite: "poor appetite",
  } as Record<TagKey, string>,
  scroll: "Scroll",
};

const zh: typeof en = {
  title: "粉红健康",
  range: { 7: "过去一周", 14: "过去两周", 30: "过去一个月", 90: "过去三个月" },
  langToggle: "EN",
  langToggleLabel: "切换到英文",
  loading: "正在获取最新记录…",
  error: "无法连接表格，请重试。",
  retry: "重试",
  updated: (t) => `更新于 ${t}`,
  refresh: "刷新",
  heroEyebrow: "平均睡眠",
  hoursUnit: "小时 / 晚",
  heroSub: (n, lo, hi) => `记录 ${n} 晚 · ${lo}–${hi} 小时`,
  noData: "此期间没有睡眠记录",
  chartTitle: "每晚睡眠",
  legendMain: "主睡眠",
  legendExtra: "回笼觉",
  legendAvg: "平均",
  tapHint: "点击柱子查看详情",
  fragTitle: "睡眠中断",
  fragBig: (k, n) => `${k} / ${n}`,
  fragUnit: "晚",
  fragSub: (h) => `平均多睡 ${h1(h)} 小时回笼觉`,
  fragNone: "没有记录到中断",
  glanceTitle: "一览",
  hours: (n) => `${h1(n)} 小时`,
  quality: { good: "精神好", mixed: "一般", poor: "睡不安稳" },
  tag: {
    rested: "精神好", unrested: "没睡好", wokeOften: "常醒", coldSweat: "冒冷汗",
    nausea: "恶心", headache: "头痛", gut: "肠胃不适", lowMood: "情绪低落",
    anxious: "焦虑", irritable: "易怒", goodMood: "心情好",
    goodAppetite: "胃口好", poorAppetite: "胃口差",
  },
  scroll: "下滑",
};

export const STRINGS: Record<Lang, typeof en> = { en, zh };

/** Render one deterministic bullet. Emoji is decoration, the text stands alone. */
export function bulletText(b: Bullet, lang: Lang): { icon: string; text: string } {
  const t = STRINGS[lang];
  const tag = (k: TagKey) => t.tag[k];
  if (lang === "en") {
    switch (b.kind) {
      case "sleep":
        return { icon: "🌙", text: `Averaged ${h1(b.avg)} h; ${b.fragmented} of ${b.nights} nights broken` };
      case "sleepNone": return { icon: "🌙", text: "No sleep logged in this period" };
      case "mood": {
        const d = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
        const text = !b.low ? `Mood: upbeat on ${b.up} of ${b.days} days`
          : b.up === 0 ? `Mood: ${tag(b.low[0])} on ${b.low[1]} of ${b.days} days`
          : `Mood: ${tag(b.low[0])} ${d(b.low[1])}, upbeat ${d(b.up)}`;
        return { icon: "💗", text };
      }
      case "moodNone": return { icon: "💗", text: "No mood notes in this period" };
      case "appetite":
        return {
          icon: "🍽️",
          text: b.poor === 0 ? `Good appetite noted on ${b.good} ${b.good === 1 ? "day" : "days"}`
            : b.good === 0 ? `Poor appetite noted on ${b.poor} ${b.poor === 1 ? "day" : "days"}`
            : `Appetite: good ${b.good} days, poor ${b.poor} days`,
        };
      case "appetiteNone": return { icon: "🍽️", text: "No appetite notes in this period" };
      case "body":
        return { icon: "🩺", text: `Physical: ${b.top.map(([k, c]) => `${tag(k)} ×${c}`).join(", ")}` };
      case "bodyNone": return { icon: "🩺", text: "No physical symptoms noted this period" };
    }
  }
  switch (b.kind) {
    case "sleep": return { icon: "🌙", text: `平均 ${h1(b.avg)} 小时，${b.nights} 晚中 ${b.fragmented} 晚中断` };
    case "sleepNone": return { icon: "🌙", text: "此期间没有睡眠记录" };
    case "mood": {
      const text = !b.low ? `情绪：${b.days} 天中 ${b.up} 天心情好`
        : b.up === 0 ? `情绪：${b.days} 天中 ${b.low[1]} 天${tag(b.low[0])}`
        : `情绪：${tag(b.low[0])} ${b.low[1]} 天，心情好 ${b.up} 天`;
      return { icon: "💗", text };
    }
    case "moodNone": return { icon: "💗", text: "此期间没有情绪记录" };
    case "appetite":
      return {
        icon: "🍽️",
        text: b.poor === 0 ? `${b.good} 天胃口好` : b.good === 0 ? `${b.poor} 天胃口差` : `胃口好 ${b.good} 天，差 ${b.poor} 天`,
      };
    case "appetiteNone": return { icon: "🍽️", text: "此期间没有胃口记录" };
    case "body": return { icon: "🩺", text: `身体：${b.top.map(([k, c]) => `${tag(k)} ×${c}`).join("，")}` };
    case "bodyNone": return { icon: "🩺", text: "此期间没有身体不适" };
  }
}

export function formatTime(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatDay(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-GB", opts).format(new Date(y, m - 1, d));
}
