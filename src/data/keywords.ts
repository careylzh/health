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
  goodAppetite: /appetite returned|great appetit|good appetit|hungry|胃口好/i,
  poorAppetite: /no appetit|poor appetit|loss of appetit|lost appetit|没胃口/i,
} as const;

export type TagKey = keyof typeof TAGS;

// Phrases that contain a "bad" word but mean the opposite; stripped before matching.
const NEGATED = [/did not wake up feeling unrested/gi, /not (?:choking|anxious|depressed)/gi, /don'?t have/gi];

export function tagText(text: string): TagKey[] {
  const tags = new Set<TagKey>();
  if (TAGS.rested.test(text)) tags.add("rested");
  const cleaned = NEGATED.reduce((t, re) => t.replace(re, " "), text);
  for (const [k, re] of Object.entries(TAGS) as [TagKey, RegExp][]) {
    if (k === "rested") continue;
    if (re.test(cleaned)) tags.add(k);
  }
  return [...tags];
}

export const MOOD_UP: TagKey[] = ["goodMood"];
export const MOOD_DOWN: TagKey[] = ["lowMood", "anxious", "irritable"];
export const BODY: TagKey[] = ["headache", "nausea", "coldSweat", "gut"];
