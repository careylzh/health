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
  // Appetite: only the fixed phrases live here; appetiteTags() below also reads "appetite" + a
  // describing word anywhere in the same sentence, in either order, and handles negation.
  goodAppetite: /great appetit|good appetit|ate well|eating well|胃口(?:很|还|挺|比较)?(?:好|不错|正常|恢复)|食欲(?:很|还|挺)?(?:好|不错|正常|恢复)|(?:胃口|食欲)(?:没有?|并不|并没有?)(?:变)?(?:差|不好|下降)/i,
  poorAppetite: /\bno (?:real |much )?appetit|没(?:有)?胃口|胃口(?:很|有点|比较)?(?:差|不好|不太好|下降)|食欲(?:很|有点)?(?:差|不振|不好|下降)|不想吃|吃不下/i,
} as const;

export type TagKey = keyof typeof TAGS;

// ── Appetite ────────────────────────────────────────────────────────────────────────────
// Negators: didn't / did not / won't / will not / wasn't / can't / cannot / never / no longer /
// without / hardly / barely … (straight or curly apostrophe). A negator up to three words before
// a describing word flips it: "did not drop" → good, "won't improve" → poor.
/** "didnt", "couldnt", "wont" … — notes are often typed without the apostrophe. */
const NT_BARE = String.raw`\b(?:did|do|does|was|were|is|are|have|has|had|could|would|should|ca|wo|ai|must|need)nt\b`;
const NEG = String.raw`(?:\bnot|n['’]t|${NT_BARE}|\bnever|\bno longer|\bcannot|\bwithout|\bhardly|\bbarely|\bscarcely)`;
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

// ── Negation for every non-appetite tag ─────────────────────────────────────────────────
// A match is negated when, inside its clause, a negator sits at most three words before it and
// no contrast word ("but", "though", "and" …) sits between them; "no headache or nausea" negates
// both. 中文: 不/没/没有/并不… directly before (optionally 太/很/怎么/觉得…). "stress-free" too.
const EN_NEG_BEFORE = re(String.raw`(?:\b(?:not|never|no|cannot|without|hardly|barely|nor|neither)|n['’]t|${NT_BARE})(?![\w'’])(?:\s+[\w'’-]+){0,3}\s*$`);
const ZH_NEG_BEFORE = /(?:不|没|没有|并不|并没有?|毫不|从不|从没有?|别)(?:太|很|怎么|再|有|觉得|感到|感觉)?$/;
const CONTRAST = /\b(?:but|and|though|although|yet|however|so|because|while|except|then|whereas)\b|[,，]/i;
const FREE_AFTER = /^[\s-]*free\b/i;
const CLAUSES = /[.!?;\n。！？；]+/;
/** Negated `rested` means poor sleep ("didn't sleep well", "not rested"). Others just drop. */
const FLIP: Partial<Record<TagKey, TagKey>> = { rested: "unrested" };
const GENERIC = (Object.keys(TAGS) as TagKey[]).filter((k) => k !== "goodAppetite" && k !== "poorAppetite");
const GLOBAL = Object.fromEntries(GENERIC.map((k) => [k, new RegExp(TAGS[k].source, "gi")])) as Record<TagKey, RegExp>;

function isNegated(clause: string, start: number, end: number): boolean {
  const before = clause.slice(Math.max(0, start - 80), start).split(CONTRAST).pop()!;
  return EN_NEG_BEFORE.test(before) || ZH_NEG_BEFORE.test(before) || FREE_AFTER.test(clause.slice(end, end + 8));
}

export function tagText(text: string): TagKey[] {
  const tags = new Set<TagKey>();
  for (const clause of text.split(CLAUSES)) {
    if (!clause.trim()) continue;
    for (const k of GENERIC) {
      for (const m of clause.matchAll(GLOBAL[k])) {
        if (!isNegated(clause, m.index!, m.index! + m[0].length)) tags.add(k);
        else if (FLIP[k]) tags.add(FLIP[k]!);
      }
    }
  }
  for (const t of appetiteTags(text)) tags.add(t);
  return [...tags];
}

export const MOOD_UP: TagKey[] = ["goodMood"];
export const MOOD_DOWN: TagKey[] = ["lowMood", "anxious", "irritable"];
export const BODY: TagKey[] = ["headache", "nausea", "coldSweat", "gut"];
