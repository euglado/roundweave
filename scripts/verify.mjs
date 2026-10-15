import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const accepted = new Set(["MIT", "Apache-2.0", "0BSD", "MIT OR Apache-2.0"]);
let count = 0;
for (const [name, entry] of Object.entries(lock.packages)) {
  if (!name) continue;
  assert(
    accepted.has(entry.license),
    `Unreviewed license: ${name} ${entry.license}`,
  );
  assert(
    entry.resolved?.startsWith("https://registry.npmjs.org/"),
    `Unexpected registry: ${name}`,
  );
  assert(
    /^sha512-[A-Za-z0-9+/]+=*$/.test(entry.integrity ?? ""),
    `Missing SHA-512: ${name}`,
  );
  assert(!entry.hasInstallScript, `Install script requires review: ${name}`);
  count++;
}
const forbidden = [
  /mfa\.[A-Za-z0-9_-]{40,}/,
  /\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,}\b/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
let files = 0;
async function scan(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(item.name)) continue;
    const file = path.join(dir, item.name);
    // Local configuration is never opened by source scans.
    if (
      item.name === ".env" ||
      (item.name.startsWith(".env.") && item.name !== ".env.example")
    )
      continue;
    if (item.isDirectory()) await scan(file);
    else {
      const content = await readFile(file, "utf8");
      for (const pattern of forbidden)
        assert(!pattern.test(content), `Possible credential: ${file}`);
      files++;
    }
  }
}
await scan(".");
const tracked = spawnSync("git", ["ls-files", "-z"], { encoding: "utf8" });
if (tracked.status === 0)
  for (const file of tracked.stdout.split("\0")) {
    const name = path.basename(file);
    assert(
      !(
        name === ".env" ||
        (name.startsWith(".env.") && name !== ".env.example")
      ),
      "Credential configuration must never be tracked",
    );
  }
console.log(
  `Verified ${count} dependency licenses, registry sources, SHA-512 digests and absence of install scripts; ${files} source files passed credential-pattern scan.`,
);
