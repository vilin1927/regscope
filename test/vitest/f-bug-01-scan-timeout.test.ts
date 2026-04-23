import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * F-BUG-01 regression: dynamic scan was hitting OpenAI's 90s abort timeout
 * during Raphael's investor demo (2026-04-22). Root cause was a 8000-token
 * budget + "10-20 Vorschriften" prompt asking GPT-5.2 to generate too much.
 *
 * Fix: cap at max_completion_tokens=4000 and prompt "max. 10 Vorschriften".
 * If someone bumps these back up thinking more is better, this test fails
 * before the change lands in production.
 */
describe("F-BUG-01: dynamic scan token budget + regulation cap", () => {
  const scanRoute = readFileSync(
    path.resolve(__dirname, "../../app/api/scan/route.ts"),
    "utf8"
  );

  it("runDynamicScan must call callOpenAI with max_completion_tokens <= 4000", () => {
    // Match the callOpenAI invocation inside runDynamicScan. The 4th positional
    // arg is the token budget — extract it and assert.
    const match = scanRoute.match(
      /callOpenAI\(\s*systemPrompt\s*,\s*userPrompt\s*,\s*[^,]+,\s*(\d+)\s*\)/
    );
    expect(match, "expected a callOpenAI(..., N) invocation in scan route").not.toBeNull();
    const tokenBudget = Number(match![1]);
    expect(tokenBudget).toBeLessThanOrEqual(4000);
  });

  it("dynamic scan prompt must cap regulations at 10 (not the old '10-20')", () => {
    // The prompt in runDynamicScan asks for a bounded number of regulations.
    // The old "10-20" wording drove OpenAI to generate ~15 which blew the timeout.
    expect(
      scanRoute.match(/10\s*-\s*20\s+wichtigsten\s+Vorschriften/i),
      "prompt must not ask for '10-20 Vorschriften' — that was the cause of F-BUG-01"
    ).toBeNull();
    expect(
      scanRoute.match(/max\.?\s*10\s+wichtigsten\s+Vorschriften/i),
      "prompt should ask for 'max. 10 wichtigsten Vorschriften'"
    ).not.toBeNull();
  });
});
