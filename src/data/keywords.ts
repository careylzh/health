/**
 * Keyword tags for short, privacy-safe summaries (never verbatim notes).
 * Each tag: a regex over the day's observation text (English + 中文).
 */
export const TAGS = {
  rested: /\b(?:rested|refreshed|slept well|good sleep)\b|did not wake up feeling unrested|睡得好|精神好/i,
  unrested: /\bunrested\b|\bexhausted\b|\btired\b|没睡好/i,
  wokeOften: /waking up (?:very )?often|woke up (?:very )?often|waking up intermittently|interrupted|醒了很多次/i,
  coldSweat: /cold sweat/i,
  nausea: /nause/i,
  headache: /headache|头痛/i,
  gut: /diarrh|stomach|stomache|胃痛|拉肚子/i,
  lowMood: /depress|\bsad(?:ness)?\b|feel\w* (?:a ?bit |abit )?down|lonely|unmotivated|feeling heavy|抑郁|难过|低落/i,
  anxious: /anxi|ruminat|brood|worr|stress|焦虑|担心/i,
  irritable: /anger|angry|irritab|resent|生气|烦躁/i,
  goodMood: /hopeful|calm|happy|grateful|gratitude|relaxed|energetic|feel\w* great|fantastic|开心|平静|感恩|清晰/i,
  // Appetite: only the fixed phrases live here; appetiteTags() below also reads "appetite" + a
  // describing word anywhere in the same sentence, in either order, and handles negation.
  goodAppetite: /great appetit|good appetit|ate well|eating well|胃口(?:很|还|挺|比较)?(?:好|不错|正常|恢复)|食欲(?:很|还|挺)?(?:好|不错|正常|恢复)|(?:胃口|食欲)(?:没有?|并不|并没有?)(?:变)?(?:差|不好|下降)/i,
  poorAppetite: /\bno (?:real |much )?appetit|没(?:有)?胃口|胃口(?:很|有点|比较)?(?:差|不好|不太好|下降)|食欲(?:很|有点)?(?:差|不振|不好|下降)|不想吃|吃不下/i,
} as const;

export type TagKey = keyof typeof TAGS;

// Phrases that contain a "bad" word but mean the opposite; stripped before matching.
const NEGATED = [/did not wake up feeling unrested/gi, /not (?:choking|anxious|depressed)/gi, /don'?t have/gi];

// ── Appetite ────────────────────────────────────────────────────────────────────────────
// Negators: didn't / did not / won't / will not / wasn't / can't / cannot / never / no longer /
// without / hardly / barely … (straight or curly apostrophe). A negator up to three words before
// a describing word flips it: "did not drop" → good, "won't improve" → poor.
const NEG = String.raw`(?:\bnot|n['’]t|\bnever|\bno longer|\bcannot|\bwithout|\bhardly|\bbarely|\bscarcely)`;
const GAP = String.raw`(?:\s+[\w'’]+){0,3}?\s+`;
const GOOD_W = String.raw`(?:good|great|fine|normal|ok|okay|better|returned|return|came back|come back|back to normal|healthy|improv\w*|strong|hearty|hungry)`;
const POOR_W = String.raw`(?:dip\w*|drop\w*|low\w*|poor|bad|reduc\w*|decreas\w*|los[est]\w*|loss|lack\w*|less|weak\w*|worse\w*|suppress\w*|affect\w*)`;
const re = (src: string, flags = "i") => new RegExp(src, flags);

const NEG_GOOD = re(`${NEG}${GAP}${GOOD_W}\\b`);
const NEG_POOR = re(`${NEG}${GAP}${POOR_W}\\b`);
const NEG_ANY_ALL = re(`${NEG}${GAP}(?:${GOOD_W}|${POOR_W})\\b`, "gi");
const PLAIN_GOOD = re(`\\b${GOOD_W}\\b`);
const PLAIN_POOR = re(`\\b${POOR_W}\\b`);
/** Whole-text phrases that need no "appetite" word: "didn't eat much", "won't be hungry". */
const NOT_EATING = re(`${NEG}(?:\\s+[\\w'’]+){0,2}?\\s+(?:eat|eating|ate|hungry)\\b|${NEG}\\s+(?:have |had |has |feel |felt )?(?:much |an? |any |the )?appetit`);
const APPETITE = /appetit/i;

function appetiteTags(text: string): TagKey[] {
  let good = TAGS.goodAppetite.test(text), poor = TAGS.poorAppetite.test(text);
  if (NOT_EATING.test(text)) poor = true;
  else if (/\bhungry\b/i.test(text)) good = true;
  // A sentence can carry both ("Appetite generally good, except a dip lately") — both tags apply.
  for (const sentence of text.split(/[.!?;\n。！？；]+/)) {
    if (!APPETITE.test(sentence)) continue;
    if (NEG_GOOD.test(sentence)) poor = true;
    if (NEG_POOR.test(sentence)) good = true;
    const rest = sentence.replace(NEG_ANY_ALL, " ");
    if (PLAIN_GOOD.test(rest)) good = true;
    if (PLAIN_POOR.test(rest)) poor = true;
  }
  return [...(good ? ["goodAppetite" as const] : []), ...(poor ? ["poorAppetite" as const] : [])];
}

export function tagText(text: string): TagKey[] {
  const tags = new Set<TagKey>();
  if (TAGS.rested.test(text)) tags.add("rested");
  const cleaned = NEGATED.reduce((t, re) => t.replace(re, " "), text);
  for (const [k, re] of Object.entries(TAGS) as [TagKey, RegExp][]) {
    if (k === "rested" || k === "goodAppetite" || k === "poorAppetite") continue;
    if (re.test(cleaned)) tags.add(k);
  }
  for (const t of appetiteTags(text)) tags.add(t);
  return [...tags];
}

export const MOOD_UP: TagKey[] = ["goodMood"];
export const MOOD_DOWN: TagKey[] = ["lowMood", "anxious", "irritable"];
export const BODY: TagKey[] = ["headache", "nausea", "coldSweat", "gut"];
