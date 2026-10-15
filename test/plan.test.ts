import assert from "node:assert/strict";
import test from "node:test";
import { InputError, plan, render, text } from "../src/plan.js";

for (let count = 2; count <= 8; count++) {
  test(`${count} teams: every unordered pair once, no team twice in a round, one bye per odd team`, () => {
    const names = Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
    const result = plan("Community games", names.join("\n"));
    assert.equal(result.rounds.length, count % 2 ? count : count - 1);
    const actual = new Set<string>();
    const appearances = new Map<string, number>();
    const byes = new Map<string, number>();
    for (const round of result.rounds) {
      const present = new Set<string>();
      assert.equal(round.matches.length, Math.floor(count / 2));
      for (const [a, b] of round.matches) {
        assert.notEqual(a, b);
        assert(!present.has(a) && !present.has(b));
        present.add(a);
        present.add(b);
        const pair = [a, b].sort().join("|");
        assert(!actual.has(pair));
        actual.add(pair);
        for (const name of [a, b])
          appearances.set(name, (appearances.get(name) ?? 0) + 1);
      }
      if (round.bye) {
        assert(!present.has(round.bye));
        present.add(round.bye);
        byes.set(round.bye, (byes.get(round.bye) ?? 0) + 1);
      }
      assert.deepEqual([...present].sort(), [...names].sort());
    }
    const expected = new Set<string>();
    for (const a of names)
      for (const b of names) if (a !== b) expected.add([a, b].sort().join("|"));
    assert.deepEqual(actual, expected);
    assert.equal(actual.size, (count * (count - 1)) / 2);
    for (const name of names) {
      assert.equal(appearances.get(name), count - 1);
      assert.equal(byes.get(name) ?? 0, count % 2);
    }
    assert.deepEqual(plan("Community games", names.join("\n")), result);
  });
  for (const language of ["en", "tr"] as const)
    test(`${count} teams: ${language} maximum-length output fits one Discord message`, () => {
      const result = plan(
        "A".repeat(40),
        Array.from(
          { length: count },
          (_, i) => `${i + 1}${"Z".repeat(17)}`,
        ).join("\n"),
      );
      const output = render(result, language);
      assert(output.length + 140 <= 2000);
      assert(output.includes(language === "tr" ? "Tur 1" : "Round 1"));
      assert(!output.includes("@") && !output.includes("https:"));
    });
}
test("Known three-team fixture matches circle rotation", () => {
  assert.deepEqual(plan("Games", "Amber\nBlue\nCedar").rounds, [
    { matches: [["Blue", "Cedar"]], bye: "Amber" },
    { matches: [["Amber", "Cedar"]], bye: "Blue" },
    { matches: [["Amber", "Blue"]], bye: "Cedar" },
  ]);
});
test("NFC and CRLF are normalized without changing order", () => {
  assert.deepEqual(
    plan(" Cafe\u0301 ", " Amber \r\n Blue "),
    plan("Café", "Amber\nBlue"),
  );
});
for (const invalid of [
  "",
  "One",
  "A\nB\nC\nD\nE\nF\nG\nH\nI",
  "A\n\nB",
  "Amber\namber",
  "I\nı",
  "I\ni",
  `A\n${"B".repeat(19)}`,
  "A\n@everyone",
  "A\nhttps://x.test",
  "A\n**Blue**",
  "A\nBlue\tTeam",
  "A\nBlue\u202eTeam",
  "A\n<@123>",
  "A\n🐈",
  "A\nBlue\rTeam",
]) {
  test(`Reject unsafe or invalid team input ${JSON.stringify(invalid)}`, () =>
    assert.throws(() => plan("Games", invalid), InputError));
}
for (const invalid of [
  "",
  "A".repeat(41),
  "@everyone",
  "Title\nOther",
  "Title\u0000",
  "[Link](https://x)",
  "Title\u200b",
])
  test(`Reject title ${JSON.stringify(invalid)}`, () =>
    assert.throws(() => plan(invalid, "A\nB"), InputError));
test("Supported Turkish labels and punctuation", () =>
  assert.equal(text("Çınar (2) İzmir's", 18), "Çınar (2) İzmir's"));
