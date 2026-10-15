import assert from "node:assert/strict";
import test from "node:test";
import {
  Flow,
  FORM_DELAY,
  type Notice,
  type Port,
  SHARE_DELAY,
  TTL,
} from "../src/flow.js";

function fixture() {
  let now = 0;
  let sequence = 0;
  const flow = new Flow(
    () => now,
    () => (++sequence).toString(16).padStart(32, "0"),
  );
  const notices: Notice[] = [];
  const sends: string[] = [];
  let form = "";
  let preview = "";
  let allowed = true;
  const port: Port = {
    scope: { user: "u", guild: "g", channel: "c" },
    language: "tr",
    message: null,
    access: async () => allowed,
    modal: async (id) => {
      form = id;
    },
    defer: async () => {},
    preview: async (content, id) => {
      preview = id;
      assert(content.includes("Tur 1"));
      return "m";
    },
    notice: async (code) => {
      notices.push(code);
    },
    clear: async (code) => {
      notices.push(code);
    },
    publish: async (content) => {
      sends.push(content);
    },
  };
  return {
    flow,
    port,
    notices,
    sends,
    form: () => form,
    preview: () => preview,
    setAllowed: (value: boolean) => {
      allowed = value;
    },
    advance: (value: number) => {
      now += value;
    },
    ready: async () => {
      await flow.open(port);
      await flow.submit(form, "Games", "Amber\nBlue\nCedar", port);
      port.message = "m";
      return preview;
    },
  };
}
test("Nothing publishes until explicit Share; language remains the original choice", async () => {
  const f = fixture();
  await f.flow.open(f.port);
  f.port.language = "en";
  await f.flow.submit(f.form(), "Games", "Amber\nBlue\nCedar", f.port);
  assert.equal(f.port.language, "tr");
  assert.equal(f.sends.length, 0);
  f.port.message = "m";
  await f.flow.click(f.preview(), "share", f.port);
  assert.equal(f.sends.length, 1);
  assert.deepEqual(f.notices, ["shared"]);
  assert.equal(f.flow.size, 0);
});
test("Concurrent share clicks send exactly once", async () => {
  const f = fixture();
  const id = await f.ready();
  await Promise.all([
    f.flow.click(id, "share", f.port),
    f.flow.click(id, "share", f.port),
  ]);
  assert.equal(f.sends.length, 1);
  assert(f.notices.includes("expired"));
});
test("Concurrent duplicate modal submissions yield one preview", async () => {
  const f = fixture();
  await f.flow.open(f.port);
  await Promise.all([
    f.flow.submit(f.form(), "Games", "A\nB", f.port),
    f.flow.submit(f.form(), "Games", "A\nB", f.port),
  ]);
  assert.equal(f.flow.size, 1);
  assert.deepEqual(f.notices, ["expired"]);
});
for (const field of ["user", "guild", "channel"] as const)
  test(`Wrong ${field} cannot consume a form or preview`, async () => {
    const f = fixture();
    await f.flow.open(f.port);
    const impostor = {
      ...f.port,
      scope: { ...f.port.scope, [field]: "wrong" },
    };
    await f.flow.submit(f.form(), "Games", "A\nB", impostor);
    assert.equal(f.flow.size, 1);
    await f.flow.submit(f.form(), "Games", "A\nB", f.port);
    f.port.message = "m";
    impostor.message = "m";
    await f.flow.click(f.preview(), "share", impostor);
    assert.equal(f.sends.length, 0);
    assert.equal(f.flow.size, 1);
    await f.flow.click(f.preview(), "share", f.port);
    assert.equal(f.sends.length, 1);
  });
for (const message of [null, "other"])
  test(`Wrong preview message ${message} cannot publish`, async () => {
    const f = fixture();
    await f.ready();
    f.port.message = message;
    await f.flow.click(f.preview(), "share", f.port);
    assert.equal(f.sends.length, 0);
    assert.equal(f.flow.size, 1);
  });
for (const offset of [TTL, TTL + 1])
  test(`Forms expire at ${offset} ms`, async () => {
    const f = fixture();
    await f.flow.open(f.port);
    f.advance(offset);
    await f.flow.submit(f.form(), "Games", "A\nB", f.port);
    assert.equal(f.flow.size, 0);
    assert.deepEqual(f.notices, ["expired"]);
  });
test("Preview has a fresh TTL and expires precisely at boundary", async () => {
  const f = fixture();
  await f.flow.open(f.port);
  f.advance(TTL - 1);
  await f.flow.submit(f.form(), "Games", "A\nB", f.port);
  f.port.message = "m";
  f.advance(TTL);
  await f.flow.click(f.preview(), "share", f.port);
  assert.deepEqual(f.notices, ["expired"]);
  assert.equal(f.sends.length, 0);
});
test("Discard consumes the draft even when access has since been removed", async () => {
  const f = fixture();
  await f.ready();
  f.setAllowed(false);
  await f.flow.click(f.preview(), "discard", f.port);
  f.setAllowed(true);
  await f.flow.click(f.preview(), "share", f.port);
  assert.deepEqual(f.notices, ["discarded", "expired"]);
  assert.equal(f.sends.length, 0);
});
test("Removed permissions prevent share and consume the draft", async () => {
  const f = fixture();
  await f.ready();
  f.setAllowed(false);
  await f.flow.click(f.preview(), "share", f.port);
  assert.deepEqual(f.notices, ["denied"]);
  assert.equal(f.sends.length, 0);
  assert.equal(f.flow.size, 0);
});
test("Removed permissions prevent preview", async () => {
  const f = fixture();
  await f.flow.open(f.port);
  f.setAllowed(false);
  await f.flow.submit(f.form(), "Games", "A\nB", f.port);
  assert.deepEqual(f.notices, ["denied"]);
  assert.equal(f.flow.size, 0);
});
test("Denied entry creates no stored draft", async () => {
  const f = fixture();
  f.setAllowed(false);
  await f.flow.open(f.port);
  assert.deepEqual(f.notices, ["denied"]);
  assert.equal(f.flow.size, 0);
});
test("Invalid input consumes form and produces private guidance", async () => {
  const f = fixture();
  await f.flow.open(f.port);
  await f.flow.submit(f.form(), "Games", "A\nA", f.port);
  assert.deepEqual(f.notices, ["invalid"]);
  assert.equal(f.flow.size, 0);
});
test("Member form cooldown allows use at exact boundary", async () => {
  const f = fixture();
  await f.flow.open(f.port);
  await f.flow.open(f.port);
  assert.equal(f.flow.size, 1);
  f.advance(FORM_DELAY);
  await f.flow.open(f.port);
  assert.equal(f.flow.size, 2);
  assert.deepEqual(f.notices, ["busy"]);
});
test("Channel sharing cooldown applies across different members and expires", async () => {
  const f = fixture();
  await f.ready();
  await f.flow.click(f.preview(), "share", f.port);
  f.port.scope.user = "other";
  await f.ready();
  await f.flow.click(f.preview(), "share", f.port);
  assert.equal(f.sends.length, 1);
  assert.equal(f.notices.at(-1), "busy");
  f.advance(SHARE_DELAY);
  await f.ready();
  await f.flow.click(f.preview(), "share", f.port);
  assert.equal(f.sends.length, 2);
});
test("Ambiguous network failure consumes draft and cooldown; never retries", async () => {
  const f = fixture();
  await f.ready();
  let calls = 0;
  f.port.publish = async () => {
    calls++;
    throw new Error("sensitive error omitted");
  };
  await f.flow.click(f.preview(), "share", f.port);
  await f.flow.click(f.preview(), "share", f.port);
  assert.equal(calls, 1);
  assert.deepEqual(f.notices, ["failed", "expired"]);
});
test("Maximum 100 drafts; pruning frees capacity", async () => {
  const f = fixture();
  for (let i = 0; i < 101; i++) {
    f.port.scope.user = `u${i}`;
    await f.flow.open(f.port);
  }
  assert.equal(f.flow.size, 100);
  assert.deepEqual(f.notices, ["busy"]);
  f.advance(TTL);
  f.flow.sweep();
  assert.equal(f.flow.size, 0);
  await f.flow.open(f.port);
  assert.equal(f.flow.size, 1);
});
test("Pending preview reserves capacity and cannot be clicked before delivery", async () => {
  const f = fixture();
  await f.flow.open(f.port);
  let release: () => void = () => {};
  let next = "";
  f.port.preview = async (_content, id) => {
    next = id;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return "m";
  };
  const pending = f.flow.submit(f.form(), "Games", "A\nB", f.port);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.flow.size, 1);
  await f.flow.click(next, "share", f.port);
  assert.equal(f.sends.length, 0);
  release();
  await pending;
  f.port.message = "m";
  await f.flow.click(next, "share", f.port);
  assert.equal(f.sends.length, 1);
});
test("Failed modal and preview delivery clean up drafts", async () => {
  const f = fixture();
  f.port.modal = async () => {
    throw new Error("network");
  };
  await assert.rejects(f.flow.open(f.port));
  assert.equal(f.flow.size, 0);
  const g = fixture();
  await g.flow.open(g.port);
  g.port.preview = async () => {
    throw new Error("network");
  };
  await assert.rejects(g.flow.submit(g.form(), "Games", "A\nB", g.port));
  assert.equal(g.flow.size, 0);
});
