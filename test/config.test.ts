import assert from "node:assert/strict";
import test from "node:test";
import { config } from "../src/config.js";

const valid = {
  DISCORD_TOKEN: "placeholder".repeat(3),
  DISCORD_APPLICATION_ID: "12345678901234567",
  DISCORD_GUILD_ID: "23456789012345678",
};
test("Valid placeholder configuration is parsed without network calls", () =>
  assert.deepEqual(config(valid), {
    token: valid.DISCORD_TOKEN,
    application: valid.DISCORD_APPLICATION_ID,
    guild: valid.DISCORD_GUILD_ID,
  }));
for (const field of Object.keys(valid))
  for (const value of ["", "bad value", "\n", '"injection"'])
    test(`Invalid ${field} fails safely`, () => {
      assert.throws(
        () => config({ ...valid, [field]: value }),
        (error) =>
          error instanceof Error &&
          !error.message.includes(valid.DISCORD_TOKEN),
      );
    });
