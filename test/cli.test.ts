import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
for (const entry of [
  "dist/src/main.js",
  "dist/src/register.js",
  "scripts/setup.mjs",
])
  test(`${entry} without configuration exits safely without writing files`, async () => {
    const base = path.resolve(tmpdir());
    const dir = await mkdtemp(path.join(base, "roundweave-smoke-"));
    assert(path.resolve(dir).startsWith(base + path.sep));
    assert(path.basename(dir).startsWith("roundweave-smoke-"));
    try {
      assert(
        existsSync(path.join(root, entry)),
        "Actual entry point must exist",
      );
      const env = Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) => !key.startsWith("DISCORD_") && key !== "NODE_OPTIONS",
        ),
      );
      const result = spawnSync(process.execPath, [path.join(root, entry)], {
        cwd: dir,
        env,
        encoding: "utf8",
        timeout: 10000,
      });
      assert.ifError(result.error);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /setup|interactive terminal/i);
      assert(!result.stderr.includes("MODULE_NOT_FOUND"));
      assert.deepEqual(await readdir(dir), []);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
