/**
 * Keyword tags for short, privacy-safe summaries (never verbatim notes).
 * Each tag: a regex over the day's observation text (English + 中文).
 */
export const TAGS = {
  rested: /\brested\b|\brefreshed\b|\bslept (?:really |very |quite |so |pretty )?(?:well|soundly|deeply|great|good)\b|\bsleep (?:really |very |quite |so )?well\b|\bgood (?:night['’]?s? )?sleep\b|\bsound sleep\b|\bslept through\b|did not wake up feeling unrested|睡得(?:很|挺|还|比较)?(?:好|香|不错)|睡了个好觉|精神(?:很|挺)?好/i,
  unrested: /\bunrested\b|\bexhausted\b|\btired\b|\bfatigue\w*|\bgroggy\b|\bdrained\b|\bslept (?:really |very |so )?(?:badly|poorly|terribly|horribly|awfully)\b|\b(?:bad|poor|terrible|awful|rough|little) (?:night['’]?s? )?sleep\b|\b(?:bad|rough|terrible|restless|awful|sleepless) night\b|\b(?:couldn['’]?t|could not|can['’]?t|cannot|unable to) (?:fall )?(?:back )?(?:asleep|sleep)\b|\binsomnia\b|\bsleepless\b|没睡好|睡得不好|失眠|(?<!积)累(?!计)|疲惫|疲劳|[很好犯]困/i,
  wokeOften: /\b(?:wak(?:e|ing)|woke)(?: up)? (?:very |so |quite )?(?:often|frequently|repeatedly|intermittently|a lot|several times|many times|multiple times|a few times|a couple (?:of )?times|\d+ times|twice|thrice|(?:two|three|four|five|six|seven|eight) times|every (?:hour|\d+))|\bkept (?:on )?waking\b|\binterrupt\w*|\b(?:broken|fragmented|disturbed|choppy) sleep\b|醒了(?:很多|好几|几)次|老是醒|经常醒|频繁醒|一直醒|多次醒/i,
  coldSweat: /\bcold sweat|\bnight sweat|\b(?:woke|waking|wake) up (?:sweating|drenched|soaked)|\bsweating at night|盗汗|冷汗/i,
  nausea: /\bnause|\bthrew up\b|\bthrow(?:ing)? up\b|\bvomit|\bpuk(?:e|ed|ing)\b|\bretch|恶心|想吐|呕吐|吐了/i,
  headache: /headache|\bmigraine|\bhead (?:hurt|ache|pain|pound)\w*|头痛|头疼/i,
  gut: /\bstomach\w*\s?ache|\bstomache\b|\bstomach ?(?:pain|cramp|upset|issue|problem|bug|flu)\w*|\bupset stomach|\btummy ache|\bdiarrh|\bconstipat|\bbloat|\bindigestion|\bacid reflux|胃痛|胃疼|肚子(?:疼|痛)|拉肚子|腹泻|便秘|胀气/i,
  lowMood: /depress|\bsad(?:ness)?\b|\b(?:feel\w*|felt) (?:a ?bit |abit |so |very |really |quite |pretty )?(?:down|low|blue|empty|numb|hopeless|worthless|heavy)\b|\blow mood\b|\blonel\w*|\bunmotivated\b|\bcr(?:y|ied|ying)\b|\btear(?:y|ful)\b|\bhopeless|\bworthless|\bunhappy\b|\bmiserable\b|\bnot happy\b|抑郁|难过|低落|伤心|想哭|哭了|不开心|心情(?:不好|差)/i,
  anxious: /anxi|\bruminat|\bbrood|\bworr\w*|\bstress|\bpanic\w*|\bnervous|\bon edge\b|\btense\b|\buneasy\b|焦虑|担心|紧张|不安|恐慌/i,
  irritable: /\banger\b|\bangry\b|\birritab|\birritated\b|\bresent|\bfrustrat|\bannoy|\bsnapp(?:ed|ing) at\b|\bshort[- ]tempered|\blost my temper|\brage\b|\bfurious|生气|烦躁|恼火|发火|易怒/i,
  goodMood: /\bhopeful|\bcalm|\bhappy\b|\bhappi|\bgrateful|\bgratitude|\brelaxed|\benergetic|\b(?:feel\w*|felt) (?:really |very |so |quite |pretty )?(?:great|good|fine|better|positive|content|amazing|fantastic|light)\b|\bfantastic|\bgood mood|\bcheerful|\bjoy|\bupbeat|\bmotivated\b|开心|平静|感恩|清晰|心情(?:很|还|挺)?好|快乐|高兴/i,
  // Appetite fixed phrases. appetiteEvents() also reads "appetite" + a describing word in the same
  // clause (or a following "except …/but …" clause). Three kinds, never collapsed:
  //   good = a good state or a return to it · dip = a change downward · poor = an explicitly bad state.
  goodAppetite: /\b(?:great|good|healthy|big|hearty|normal|strong) appetit|\bate (?:well|a lot|normally|properly|heartily)\b|\beating (?:well|normally|properly)\b|胃口(?:很|还|挺|比较)?(?:好|不错|正常|恢复)|食欲(?:很|还|挺)?(?:好|不错|正常|恢复)|吃得(?:很|挺|还)?(?:好|香)|(?:胃口|食欲)(?:没有?|并不|并没有?)(?:变)?(?:差|不好|下降)/i,
  dipAppetite: /\b(?:ate|eat|eating) less\b|\bless hungry\b|\bsmaller (?:meals|portions)\b|\b(?:lower|reduced|decreased|less|smaller|weaker) appetit|(?:\bnot|n['’]t|\b(?:did|do|does|was|were|is)nt)\s+(?:quite\s+)?(?:(?:eat|eating|ate)\s+)?as\s+(?:hungry|much|good|great|strong|big)\b|(?:胃口|食欲)(?:有点|有些|稍微|略)?(?:下降|变差|减退|变小|不如)|吃得(?:比较|有点)?少/i,
  poorAppetite: /\b(?:no|poor|bad|low|zero|minimal) (?:real |much )?appetit|\b(?:lost|losing|lose|loss of) (?:my |the |all |any |of )?appetit|\bappetite (?:is |was |has )?(?:gone|lost|non-?existent)|\bbarely (?:ate|eat)|\bskipped (?:meals|lunch|dinner|breakfast)|没(?:有)?(?:胃口|食欲)|胃口(?:很|有点|比较)?(?:差|不好|不太好)|食欲(?:很|有点)?(?:差|不振|不好)|不想吃|吃不下/i,
} as const;

export type TagKey = keyof typeof TAGS;

// ── Appetite ────────────────────────────────────────────────────────────────────────────
// Negators: didn't / did not / won't / will not / wasn't / can't / cannot / never / no longer /
// without / hardly / barely … (straight or curly apostrophe, or none: "didnt"). A negator up to
// three words before a describing word flips it: "did not drop" → good, "won't improve" → poor.
/** "didnt", "couldnt", "wont" … — notes are often typed without the apostrophe. */
const NT_BARE = String.raw`\b(?:did|do|does|was|were|is|are|have|has|had|could|would|should|ca|wo|ai|must|need)nt\b`;
const NEG = String.raw`(?:\bnot|n['’]t|${NT_BARE}|\bnever|\bno longer|\bcannot|\bwithout|\bhardly|\bbarely|\bscarcely)`;
const GAP = String.raw`(?:\s+[\w'’]+){0,3}?\s+`;
const GOOD_W = String.raw`(?:good|great|fine|normal|ok|okay|better|returned|return|(?:is|was|came|come|coming) back|back to normal|healthy|improv\w*|strong|hearty|hungry|picked up|recover\w*)`;
const DIP_W = String.raw`(?:dip\w*|drop\w*|reduc\w*|decreas\w*|lower\w*|weak\w*|worse\w*|suppress\w*|affect\w*|declin\w*|went down|gone down|going down|dwindl\w*|less)`;
const POOR_W = String.raw`(?:poor|bad|terrible|awful|horrible|low|non-?existent|gone|minimal)`;
const re = (src: string, flags = "i") => new RegExp(src, flags);

const NEG_GOOD = re(`${NEG}${GAP}${GOOD_W}\\b`, "gi");
const NEG_DIP = re(`${NEG}${GAP}${DIP_W}\\b`, "gi");
const NEG_POOR = re(`${NEG}${GAP}${POOR_W}\\b`, "gi");
// 中文 describing words for a clause that already talks about 胃口/食欲 (or carries on from one).
const ZH_GOOD = "不错|很好|挺好|正常|恢复";
const ZH_DIP = "下降|变差|减少|减退|少了|不如";
const ZH_POOR = "很差|不好|没胃口";
const ZH_NEG = "(?:没有?|并没有?|并不|不)";
const PLAIN = {
  good: re(`\\b${GOOD_W}\\b|${ZH_GOOD}`, "gi"),
  dip: re(`\\b${DIP_W}\\b|${ZH_DIP}`, "gi"),
  poor: re(`\\b${POOR_W}\\b|${ZH_POOR}`, "gi"),
};
const ZH_NEG_BAD = re(`${ZH_NEG}(?:变)?(?:${ZH_DIP}|差)`, "gi");
/** Whole-text phrases that need no "appetite" word: "didn't eat much", "won't be hungry". */
const NOT_EATING = re(`${NEG}(?:\\s+[\\w'’]+){0,2}?\\s+(?:eat|eating|ate|hungry)\\b|${NEG}\\s+(?:have |had |has |feel |felt )?(?:much |an? |any |the )?appetit`, "gi");
const HUNGRY = /\bhungry\b/gi;
const APPETITE = /appetit|胃口|食欲/i;
/** A clause that starts like this still talks about the previous clause's subject. */
const CARRY_ON = /^\s*(?:with the exception of|except(?: for)?|apart from|other than|aside from|besides|but|though|although|however|yet|save for|除了|但是?|不过|可是)/i;

export type AppetiteKind = "goodAppetite" | "dipAppetite" | "poorAppetite";
/** One finding: which tag, and where in the text (so a time phrase can be attached later). */
export interface TagEvent { tag: TagKey; at: number }

const blank = (t: string, r: RegExp) => t.replace(r, (m) => " ".repeat(m.length));
const matches = (t: string, r: RegExp) => [...t.matchAll(r)].map((m) => m.index!);

/** Clause spans of a sentence: split on , ; ， 、 and contrast words, keeping offsets. */
function clauseSpans(sentence: string): { start: number; text: string }[] {
  const out: { start: number; text: string }[] = [];
  const SPLIT = /[,;，、]|(?=\b(?:but|except|though|although|however|whereas)\b)|(?=但是|不过|可是|除了)/gi;
  let last = 0;
  for (const m of sentence.matchAll(SPLIT)) {
    if (m.index! > last) out.push({ start: last, text: sentence.slice(last, m.index!) });
    last = m.index! + m[0].length;
  }
  out.push({ start: last, text: sentence.slice(last) });
  return out.filter((c) => c.text.trim());
}

/** Any non-appetite tag word in a clause means the clause has moved on to another subject. */
const otherSubject = (t: string) => GENERIC.some((k) => TAGS[k].test(t));

function appetiteEvents(sentence: string, base: number): TagEvent[] {
  const ev: TagEvent[] = [];
  const add = (tag: AppetiteKind, at: number) => ev.push({ tag, at: base + at });
  // 1. Fixed phrases, most specific first; each is blanked so a weaker reading can't reuse it.
  let t = sentence;
  for (const k of ["dipAppetite", "poorAppetite", "goodAppetite"] as const) {
    const g = new RegExp(TAGS[k].source, "gi");
    for (const i of matches(t, g)) add(k, i);
    t = blank(t, g);
  }
  for (const i of matches(t, NOT_EATING)) add("poorAppetite", i);
  t = blank(t, NOT_EATING);
  for (const i of matches(t, HUNGRY)) add("goodAppetite", i);
  t = blank(t, HUNGRY);
  // 2. "appetite" + describing word in the same clause, or in a following clause that carries on
  //    ("…, with the exception of a dip") and has not moved to another subject ("…, less anxious").
  const spans = clauseSpans(sentence); // offsets are shared by `sentence` and its blanked copy `t`
  let inScope = false;
  for (const c of spans) {
    const original = c.text;
    if (APPETITE.test(original)) inScope = true;
    else if (!(inScope && CARRY_ON.test(original) && !otherSubject(original))) {
      inScope = false;
      continue;
    }
    let u = t.slice(c.start, c.start + c.text.length); // with fixed phrases blanked out
    for (const i of matches(u, NEG_GOOD)) add("poorAppetite", c.start + i);
    for (const i of matches(u, NEG_DIP)) add("goodAppetite", c.start + i);
    for (const i of matches(u, NEG_POOR)) add("goodAppetite", c.start + i);
    for (const i of matches(u, ZH_NEG_BAD)) add("goodAppetite", c.start + i);
    u = blank(blank(blank(blank(u, NEG_GOOD), NEG_DIP), NEG_POOR), ZH_NEG_BAD);
    for (const i of matches(u, PLAIN.good)) add("goodAppetite", c.start + i);
    for (const i of matches(u, PLAIN.dip)) add("dipAppetite", c.start + i);
    for (const i of matches(u, PLAIN.poor)) add("poorAppetite", c.start + i);
  }
  return ev;
}

// ── Negation for every non-appetite tag ─────────────────────────────────────────────────
// A match is negated when, inside its clause, a negator sits at most three words before it and
// no contrast word ("but", "though", "and" …) sits between them; "no headache or nausea" negates
// both. 中文: 不/没/没有/并不… directly before (optionally 太/很/怎么/觉得…). "stress-free" too.
const EN_NEG_BEFORE = re(String.raw`(?:\b(?:not|never|no|cannot|without|hardly|barely|nor|neither)|n['’]t|${NT_BARE})(?![\w'’])(?:\s+[\w'’-]+){0,3}\s*$`);
const ZH_NEG_BEFORE = /(?:不|没|没有|并不|并没有?|毫不|从不|从没有?|别)(?:太|很|怎么|再|有|觉得|感到|感觉)?$/;
const CONTRAST = /\b(?:but|and|though|although|yet|however|so|because|while|except|then|whereas)\b|[,，]/i;
const FREE_AFTER = /^[\s-]*free\b/i;
/** Negated `rested` means poor sleep ("didn't sleep well", "not rested"). Others just drop. */
const FLIP: Partial<Record<TagKey, TagKey>> = { rested: "unrested" };
const APPETITE_TAGS: TagKey[] = ["goodAppetite", "dipAppetite", "poorAppetite"];
const GENERIC = (Object.keys(TAGS) as TagKey[]).filter((k) => !APPETITE_TAGS.includes(k));
const GLOBAL = Object.fromEntries(GENERIC.map((k) => [k, new RegExp(TAGS[k].source, "gi")])) as Record<TagKey, RegExp>;

function isNegated(clause: string, start: number, end: number): boolean {
  const before = clause.slice(Math.max(0, start - 80), start).split(CONTRAST).pop()!;
  return EN_NEG_BEFORE.test(before) || ZH_NEG_BEFORE.test(before) || FREE_AFTER.test(clause.slice(end, end + 8));
}

/** Every tag finding in a day's notes, with its character offset. */
export function tagEvents(text: string): TagEvent[] {
  const ev: TagEvent[] = [];
  let base = 0;
  for (const sentence of text.split(/(?<=[.!?;\n。！？；])/)) {
    for (const k of GENERIC) {
      for (const m of sentence.matchAll(GLOBAL[k])) {
        const at = m.index!;
        if (!isNegated(sentence, at, at + m[0].length)) ev.push({ tag: k, at: base + at });
        else if (FLIP[k]) ev.push({ tag: FLIP[k]!, at: base + at });
      }
    }
    ev.push(...appetiteEvents(sentence, base));
    base += sentence.length;
  }
  return ev;
}

export function tagText(text: string): TagKey[] {
  return [...new Set(tagEvents(text).map((e) => e.tag))];
}

/** One appetite state per day, so a day is never counted twice. */
export type AppetiteState = "good" | "mixed" | "dipped" | "poor";
export function appetiteState(tags: readonly TagKey[]): AppetiteState | null {
  const good = tags.includes("goodAppetite"), dip = tags.includes("dipAppetite"), poor = tags.includes("poorAppetite");
  if (good && (dip || poor)) return "mixed";
  if (poor) return "poor";
  if (dip) return "dipped";
  return good ? "good" : null;
}

export const MOOD_UP: TagKey[] = ["goodMood"];
export const MOOD_DOWN: TagKey[] = ["lowMood", "anxious", "irritable"];
export const BODY: TagKey[] = ["headache", "nausea", "coldSweat", "gut"];
