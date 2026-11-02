import { describe, it, expect } from "vitest";
import { nextTime, START_TIME } from "@/lib/game";
describe("timer", () => {
  it("starts at 10", () => expect(START_TIME).toBe(10));
  it("wrong answer drops 10 to 8", () => expect(nextTime(10, false)).toBe(8));
  it("correct keeps time", () => expect(nextTime(8, true)).toBe(8));
  it("never below 2", () => expect(nextTime(2, false)).toBe(2));
});
import { CASES } from "@/lib/game";
describe("questions", () => {
  it("has at least 100 questions", () => expect(CASES.length).toBeGreaterThanOrEqual(100));
});
