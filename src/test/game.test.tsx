import { describe, it, expect } from "vitest";
import { CASES, isLost, nextTime, QUESTION_COUNT, START_TIME } from "@/lib/game";
describe("timer", () => {
  it("starts at 20", () => expect(START_TIME).toBe(20));
  it("wrong answer drops 20 to 18", () => expect(nextTime(20, false)).toBe(18));
  it("correct keeps time", () => expect(nextTime(18, true)).toBe(18));
  it("never below 8", () => expect(nextTime(8, false)).toBe(8));
  it("reaching 8 seconds loses", () => expect(isLost(nextTime(10, false))).toBe(true));
  it("10 seconds is still playing", () => expect(isLost(10)).toBe(false));
});
describe("questions", () => {
  it("round has 100 questions", () => expect(QUESTION_COUNT).toBe(100));
  it("pool has at least 100", () => expect(CASES.length).toBeGreaterThanOrEqual(100));
});
