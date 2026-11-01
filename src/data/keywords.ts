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
  // Appetite: these are only the fixed phrases; tagText() also reads "appetite" + an
  // adjective anywhere in the same sentence, in either order (see appetiteTags below).
  goodAppetite: /great appetit|good appetit|ate well|eating well|胃口(?:很|还|挺|比较)?(?:好|不错|正常|恢复)|食欲(?:很|还|挺)?(?:好|不错|正常|恢复)/i,
  poorAppetite: /\bno (?:real |much )?appetit|(?:\bnot|n't|\bnever) (?:very |really |feeling |that )?hungry|(?:don'?t|didn'?t|do not|did not) have (?:much |an? |any )?appetit|没(?:有)?胃口|胃口(?:很|有点|比较)?(?:差|不好|不太好|下降)|食欲(?:很|有点)?(?:差|不振|不好|下降)|不想吃|吃不下/i,
} as const;

export type TagKey = keyof typeof TAGS;

// Phrases that contain a "bad" word but mean the opposite; stripped before matching.
const NEGATED = [/did not wake up feeling unrested/gi, /not (?:choking|anxious|depressed)/gi, /don'?t have/gi];

// Sentence-level appetite words: a sentence mentioning "appetite" plus one of these words.
// A sentence can carry both ("Appetite generally good, except a dip lately") — both tags apply.
const APP_NOT_GOOD = /\bnot (?:very |that |so )?(?:good|great|fine|normal|ok|okay|healthy)\b/i;
const APP_NOT_GOOD_ALL = new RegExp(APP_NOT_GOOD.source, "gi");
const APP_GOOD = /\b(?:good|great|fine|normal|ok|okay|better|returned|came back|back to normal|healthy|improv\w*|strong|hearty)\b/i;
const APP_POOR = /\b(?:dip\w*|drop\w*|low\w*|poor|bad|reduced|decreas\w*|lost|loss|lack\w*|less|weak|worse|suppress\w*)\b/i;
const APPETITE = /appetit/i;

function appetiteTags(text: string): TagKey[] {
  let good = TAGS.goodAppetite.test(text), poor = TAGS.poorAppetite.test(text);
  // Plain "hungry" counts as good only when the poor phrase ("not hungry") did not claim it.
  if (!poor && /\bhungry\b/i.test(text)) good = true;
  for (const sentence of text.split(/[.!?;\n。！？；]+/)) {
    if (!APPETITE.test(sentence)) continue;
    if (APP_NOT_GOOD.test(sentence)) poor = true;
    const rest = sentence.replace(APP_NOT_GOOD_ALL, " ");
    if (APP_GOOD.test(rest)) good = true;
    if (APP_POOR.test(rest)) poor = true;
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
