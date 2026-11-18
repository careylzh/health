/**
 * All user-visible copy, English + 中文. Components never hard-code strings (AGENTS.md).
 * Bullet templates must stay 5–10 words (EN) / ≤ 20 characters (ZH) — i18n.test.ts enforces it.
 */
import type { Bullet } from "./data/insights";
import type { AppetiteState, TagKey } from "./data/keywords";
import type { ChartView, Quality } from "./data/stats";
import type { Flag } from "./data/flags";
import type { TrackedKey } from "./data/since";

export type Lang = "en" | "zh";

export const RANGES = [7, 14, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

const APPETITE_ORDER = ["good", "mixed", "dipped", "poor"] as const;
/** "1 day" / "2 days" — English only; 中文 has no plural. */
const d = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
const mg = (n: number) => `${n} mg`;
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
  viewLabel: "Chart view",
  view: { total: "Total", broken: "Broken", extra: "Back to sleep" } as Record<ChartView, string>,
  legendMain: "Main sleep",
  legendExtra: "Back to sleep",
  legendAvg: "Average",
  legendBroken: (k: number) => `Broken (${k})`,
  legendWhole: (k: number) => `Unbroken (${k})`,
  legendAvgExtra: "Average on broken nights",
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
    goodAppetite: "good appetite", dipAppetite: "appetite dipped", poorAppetite: "poor appetite",
  } as Record<TagKey, string>,
  appetiteState: { good: "good appetite", mixed: "mixed appetite", dipped: "appetite dipped", poor: "poor appetite" } as Record<AppetiteState, string>,
  scroll: "Scroll",
  nav: { menu: "Menu", close: "Close menu", sleep: "Sleep", flags: "Highlighted days", meds: "Medication" },
  flagsTitle: "Highlighted days",
  flag: { severe: "Severe", nosleep: "No sleep", green: "Green" } as Record<Flag, string>,
  flagsFrom: "From the sheet's red and green highlights",
  flagsNone: "Nothing highlighted in this range",
  flagsNotSynced: "No highlights synced yet",
  flagsGridTitle: "Day by day",
  flagsTap: "Tap a day for details",
  flagDay: (day: string, labels: string) => `${day}: ${labels || "not highlighted"}`,
  lockTitle: "Medication",
  lockSub: "Enter the passcode to view",
  lockInput: "Passcode",
  unlock: "Unlock",
  wrongCode: "That's not the passcode",
  notSetUp: "The passcode isn't set up yet",
  lockAgain: "Lock",
  liNow: "Lithium now",
  liMissed: "Missed",
  liSince: (from: string, last: string) => `since ${from} · last written ${last}`,
  liNone: "No lithium noted yet",
  liRange: (range: string, taken: number, missed: number) => `${range}: taken ${taken}, missed ${d(missed)}`,
  liChanges: "Lithium changes",
  liRun: (mgOrNull: number | null, missed: boolean, noted: number) =>
    missed ? `Missed (${d(noted)})` : mgOrNull !== null ? mg(mgOrNull) : "Taken",
  mirtTitle: "Mirtazapine, as needed",
  mirtBig: (k: number, n: number) => `${k} of ${n}`,
  mirtUnit: "nights",
  mirtSub: (doses: [number, number][], last: string) => `${doses.map(([m, k]) => `${mg(m)} ×${k}`).join(" · ")} · last ${last}`,
  mirtNone: "Not taken in this range",
  medsNote: "A blank day counts as no change.",
  tracked: { tcm: "TCM" } as Record<TrackedKey, string>,
  dayN: (n: number) => `Day ${n}`,
  trackedSince: (from: string) => `since starting on ${from}`,
  cmpTitle: (name: string) => `Before vs since ${name}`,
  cmpBefore: "Before",
  cmpSince: "Since",
  cmpDates: (a: string, b: string) => `${a} – ${b}`,
  cmpLogged: "Nights logged",
  cmpAvg: "Average sleep",
  cmpBroken: "Broken nights",
  cmpRed: "Red days",
  cmpLow: "Low mood noted",
  cmpGood: "Good mood noted",
  cmpNotEnough: (n: number, days: number, min: number) => `Not enough logged before to compare: ${n} of ${days} nights (needs ${min}).`,
  cmpLiCaveat: (dates: string) => `Lithium also changed in this time (${dates}), so a difference can't be put down to one thing.`,
  cmpNotProof: "Counts from the log, not a diagnosis.",
  greensTitle: "Green days: what they were",
  greensNone: "No green notes yet",
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
  viewLabel: "图表视图",
  view: { total: "总睡眠", broken: "中断", extra: "回笼觉" },
  legendMain: "主睡眠",
  legendExtra: "回笼觉",
  legendAvg: "平均",
  legendBroken: (k) => `中断（${k}）`,
  legendWhole: (k) => `未中断（${k}）`,
  legendAvgExtra: "中断晚平均",
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
    goodAppetite: "胃口好", dipAppetite: "胃口下降", poorAppetite: "胃口差",
  },
  appetiteState: { good: "胃口好", mixed: "胃口时好时差", dipped: "胃口下降", poor: "胃口差" },
  scroll: "下滑",
  nav: { menu: "菜单", close: "关闭菜单", sleep: "睡眠", flags: "标记日", meds: "用药" },
  flagsTitle: "标记日",
  flag: { severe: "严重", nosleep: "没睡", green: "绿色" },
  flagsFrom: "来自表格里的红色和绿色标记",
  flagsNone: "此期间没有标记",
  flagsNotSynced: "标记尚未同步",
  flagsGridTitle: "每日",
  flagsTap: "点击某天查看详情",
  flagDay: (day, labels) => `${day}：${labels || "无标记"}`,
  lockTitle: "用药",
  lockSub: "输入密码查看",
  lockInput: "密码",
  unlock: "解锁",
  wrongCode: "密码不对",
  notSetUp: "尚未设置密码",
  lockAgain: "锁定",
  liNow: "目前锂盐",
  liMissed: "漏服",
  liSince: (from, last) => `自 ${from} · 最后写于 ${last}`,
  liNone: "还没有锂盐记录",
  liRange: (range, taken, missed) => `${range}：服用 ${taken} 天，漏服 ${missed} 天`,
  liChanges: "锂盐变化",
  liRun: (mgOrNull, missed, noted) => (missed ? `漏服（${noted} 天）` : mgOrNull !== null ? mg(mgOrNull) : "已服用"),
  mirtTitle: "米氮平（按需）",
  mirtBig: (k, n) => `${k} / ${n}`,
  mirtUnit: "晚",
  mirtSub: (doses, last) => `${doses.map(([m, k]) => `${mg(m)} ×${k}`).join(" · ")} · 最近 ${last}`,
  mirtNone: "此期间没有服用",
  medsNote: "空白的日子算作没有变化。",
  tracked: { tcm: "中药" },
  dayN: (n) => `第 ${n} 天`,
  trackedSince: (from) => `自 ${from} 开始`,
  cmpTitle: (name) => `${name}之前与之后`,
  cmpBefore: "之前",
  cmpSince: "之后",
  cmpDates: (a, b) => `${a} – ${b}`,
  cmpLogged: "记录的晚数",
  cmpAvg: "平均睡眠",
  cmpBroken: "中断的晚数",
  cmpRed: "红色标记日",
  cmpLow: "记录情绪低落",
  cmpGood: "记录心情好",
  cmpNotEnough: (n, days, min) => `之前记录不足，无法比较：${days} 晚中仅 ${n} 晚（至少需要 ${min} 晚）。`,
  cmpLiCaveat: (dates) => `这段时间锂盐也有变化（${dates}），所以差别不能只归因于一件事。`,
  cmpNotProof: "以上是记录里的计数，不是诊断。",
  greensTitle: "绿色日子：当时是什么",
  greensNone: "还没有绿色备注",
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
        const text = !b.low ? `Mood: upbeat on ${b.up} of ${d(b.days)}`
          : b.up === 0 ? `Mood: ${tag(b.low[0])} on ${b.low[1]} of ${d(b.days)}`
          : `Mood: ${tag(b.low[0])} ${d(b.low[1])}, upbeat ${d(b.up)}`;
        return { icon: "💗", text };
      }
      case "moodNone": return { icon: "💗", text: "No mood notes in this period" };
      case "appetite": {
        const parts = APPETITE_ORDER.filter((k) => b[k] > 0);
        if (parts.length > 1) return { icon: "🍽️", text: `Appetite: ${parts.map((k) => `${b[k]} ${k}`).join(", ")}` };
        const one = parts[0], n = b[one];
        const text = one === "good" ? `Good appetite noted on ${d(n)}`
          : one === "poor" ? `Poor appetite noted on ${d(n)}`
          : one === "dipped" ? `Appetite dipped on ${d(n)}`
          : b.mixedWith === "dip" ? `Appetite mixed on ${d(n)}: good with a dip`
          : b.mixedWith === "poor" ? `Appetite mixed on ${d(n)}: good and poor`
          : `Appetite mixed on ${d(n)}`;
        return { icon: "🍽️", text };
      }
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
    case "appetite": {
      const parts = APPETITE_ORDER.filter((k) => b[k] > 0);
      const zh = { good: "好", mixed: "混合", dipped: "下降", poor: "差" } as const;
      if (parts.length > 1) return { icon: "🍽️", text: `胃口天数：${parts.map((k) => `${zh[k]}${b[k]}`).join(" ")}` };
      const one = parts[0], n = b[one];
      const text = one === "good" ? `${n} 天胃口好`
        : one === "poor" ? `${n} 天胃口差`
        : one === "dipped" ? `${n} 天胃口下降`
        : b.mixedWith === "dip" ? `${n} 天胃口好但有下降`
        : b.mixedWith === "poor" ? `${n} 天胃口时好时差`
        : `${n} 天胃口好坏不一`;
      return { icon: "🍽️", text };
    }
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
