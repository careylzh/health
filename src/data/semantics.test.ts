// SYNTHETIC phrases only — never paste real health notes here (AGENTS.md).
// Semantic coverage: if the natural language clearly states a condition, the tag must fire;
// if it clearly negates it, the tag must not.
import { describe, expect, it } from "vitest";
import { tagText, type TagKey } from "./keywords";

const has = (text: string, tag: TagKey) => tagText(text).includes(tag);

const POSITIVE: [TagKey, string[]][] = [
  ["rested", ["slept well", "Slept really well", "woke up refreshed", "felt well rested", "good night's sleep",
    "slept soundly", "slept through the night", "睡得很好", "睡得好"]],
  ["unrested", ["woke up tired", "felt exhausted", "unrested", "slept badly", "slept poorly", "bad night's sleep",
    "poor sleep", "groggy all morning", "couldn't fall asleep", "could not sleep", "insomnia", "restless night",
    "没睡好", "失眠", "很累"]],
  ["wokeOften", ["woke up often", "kept waking up", "woke up several times", "woke up 3 times",
    "woke up multiple times", "waking up intermittently", "interrupted sleep", "broken sleep", "醒了很多次", "老是醒"]],
  ["coldSweat", ["cold sweat", "cold sweats overnight", "night sweats", "woke up sweating", "盗汗", "冒冷汗"]],
  ["nausea", ["nauseous", "felt nauseated", "nausea after breakfast", "threw up", "vomited", "恶心", "想吐", "呕吐"]],
  ["headache", ["headache", "bad headaches", "migraine", "head hurts", "头痛", "头疼"]],
  ["gut", ["stomach ache", "stomachache", "stomacheache", "stomache", "upset stomach", "diarrhoea", "diarrhea", "constipated", "bloated", "胃痛", "肚子疼", "拉肚子"]],
  ["lowMood", ["felt depressed", "sad", "feeling down", "felt low", "lonely", "cried", "hopeless", "unmotivated",
    "unhappy", "低落", "难过", "抑郁"]],
  ["anxious", ["anxious", "anxiety", "worried", "stressed", "panicky", "panic attack", "nervous", "on edge",
    "ruminating", "焦虑", "担心", "紧张"]],
  ["irritable", ["irritable", "angry", "frustrated", "snapped at", "annoyed", "生气", "烦躁"]],
  ["goodMood", ["happy", "calm", "felt great", "hopeful", "grateful", "relaxed", "energetic", "good mood",
    "felt content", "开心", "平静", "心情好"]],
];

const NEGATED: [TagKey, string[]][] = [
  ["unrested", ["didn't feel tired", "not tired", "did not wake up feeling unrested", "wasn't exhausted",
    "no insomnia", "不累"]],
  ["wokeOften", ["didn't wake up at all", "did not wake up often", "no interruptions"]],
  ["coldSweat", ["no cold sweat", "didn't have cold sweats", "no night sweats"]],
  ["nausea", ["no nausea", "not nauseous", "didn't throw up", "不恶心"]],
  ["headache", ["didnt have a headache", "no headache", "didn't have a headache", "headache free", "没有头痛"]],
  ["gut", ["no stomach ache", "stomach was fine", "没有拉肚子"]],
  ["lowMood", ["didn't feel sad", "not depressed", "not lonely", "wasn't feeling down", "没有难过"]],
  ["anxious", ["didnt feel anxious", "little to no anxiety", "wasnt worried", "didn't feel anxious", "not anxious", "wasn't worried", "no worries", "stress-free",
    "not stressed", "won't worry about it", "never anxious", "不焦虑"]],
  ["irritable", ["gave a presentation", "white ranger figure", "not irritable", "didn't get angry", "wasn't annoyed", "不生气"]],
  ["goodMood", ["not happy", "unhappy", "didn't feel calm", "wasn't relaxed", "不开心", "心情不好"]],
  ["rested", ["didn't sleep well", "did not sleep well", "not rested", "wasn't refreshed", "never slept well",
    "没睡好", "睡得不好"]],
];

describe("tags fire when the text states the condition", () => {
  for (const [tag, phrases] of POSITIVE) {
    it.each(phrases)(`${tag}: %s`, (p) => expect(has(p, tag)).toBe(true));
  }
});

describe("tags do not fire when the text negates the condition", () => {
  for (const [tag, phrases] of NEGATED) {
    it.each(phrases)(`not ${tag}: %s`, (p) => expect(has(p, tag)).toBe(false));
  }
});

describe("negation scope", () => {
  const tags = (t: string) => tagText(t).filter((k) => !k.endsWith("Appetite")).sort();
  it.each([
    ["not tired but anxious", ["anxious"]],
    ["no headache, but nauseous", ["nausea"]],
    ["no headache or nausea", []],
    ["didn't feel sad or anxious", []],
    ["not anxious. Felt sad", ["lowMood"]],
    ["didn't sleep well", ["unrested"]],
    ["slept well and felt calm", ["goodMood", "rested"]],
    ["calm, not anxious", ["goodMood"]],
    ["not happy, quite stressed", ["anxious", "lowMood"]],
    ["did not wake up feeling unrested", ["rested"]],
    ["我今天不焦虑，但是有点难过", ["lowMood"]],
  ])("%s", (text, want) => expect(tags(text)).toEqual(want));
});
