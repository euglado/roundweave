import assert from "node:assert/strict";
import test from "node:test";
import {
  ChannelType,
  type Client,
  type Interaction,
  MessageFlags,
  MessageFlagsBitField,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { access, handler } from "../src/discord.js";
import { buttons, command, modal, notice } from "../src/ui.js";

function clientFixture() {
  let memberAllowed = true;
  let botAllowed = true;
  let timedOut = false;
  let type: number = ChannelType.GuildText;
  let slowmode = 0;
  let roleFetches = 0;
  const sent: Record<string, unknown>[] = [];
  const member = { id: "u", isCommunicationDisabled: () => timedOut };
  const bot = { id: "bot", isCommunicationDisabled: () => false };
  const channel = {
    get type() {
      return type;
    },
    guildId: "g",
    get rateLimitPerUser() {
      return slowmode;
    },
    permissionsFor: (who: { id: string }) =>
      new PermissionsBitField(
        (who.id === "u" ? memberAllowed : botAllowed)
          ? PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages
          : 0n,
      ),
    send: async (payload: Record<string, unknown>) => {
      sent.push(payload);
      return { id: "public" };
    },
  };
  const guild = {
    roles: {
      fetch: async () => {
        roleFetches++;
      },
    },
    channels: { fetch: async () => channel },
    members: {
      fetch: async (options: {
        user: string;
        force: boolean;
        cache: boolean;
      }) => {
        assert.equal(options.force, true);
        assert.equal(options.cache, false);
        return options.user === "u" ? member : bot;
      },
    },
  };
  const client = {
    user: { id: "bot" },
    guilds: { fetch: async () => guild },
    channels: { fetch: async () => channel },
  } as unknown as Client;
  return {
    client,
    sent,
    setMember: (x: boolean) => {
      memberAllowed = x;
    },
    setBot: (x: boolean) => {
      botAllowed = x;
    },
    setTimeout: (x: boolean) => {
      timedOut = x;
    },
    setType: (x: number) => {
      type = x;
    },
    setSlowmode: (x: number) => {
      slowmode = x;
    },
    roleFetches: () => roleFetches,
  };
}
for (const [name, mutate, expected] of [
  ["ordinary text channel", (_f: ReturnType<typeof clientFixture>) => {}, true],
  [
    "removed member permission",
    (f: ReturnType<typeof clientFixture>) => f.setMember(false),
    false,
  ],
  [
    "removed bot permission",
    (f: ReturnType<typeof clientFixture>) => f.setBot(false),
    false,
  ],
  [
    "member timed out",
    (f: ReturnType<typeof clientFixture>) => f.setTimeout(true),
    false,
  ],
  [
    "thread",
    (f: ReturnType<typeof clientFixture>) =>
      f.setType(ChannelType.PublicThread),
    false,
  ],
  [
    "announcement channel",
    (f: ReturnType<typeof clientFixture>) =>
      f.setType(ChannelType.GuildAnnouncement),
    false,
  ],
  [
    "slowmode 60 seconds",
    (f: ReturnType<typeof clientFixture>) => f.setSlowmode(60),
    true,
  ],
  [
    "slowmode 61 seconds",
    (f: ReturnType<typeof clientFixture>) => f.setSlowmode(61),
    false,
  ],
] as const)
  test(`Fresh Discord access: ${name}`, async () => {
    const f = clientFixture();
    mutate(f);
    assert.equal(await access(f.client, "g", "c", "u"), expected);
    assert.equal(f.roleFetches(), 1);
  });
test("Discord permission lookup fails closed on REST errors", async () => {
  const client = {
    guilds: {
      fetch: async () => {
        throw new Error("not logged");
      },
    },
  } as unknown as Client;
  assert.equal(await access(client, "g", "c", "u"), false);
});

function interactionFixture(
  kind: "command" | "modal" | "button",
  customId = "",
  language = "tr",
) {
  const outputs: Record<string, unknown>[] = [];
  let modalId = "";
  const i = {
    commandName: "roundweave",
    customId,
    guildId: "g",
    channelId: "c",
    locale: "en",
    user: { id: "u" },
    channel: { type: ChannelType.GuildText },
    memberPermissions: new PermissionsBitField([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
    ]),
    appPermissions: new PermissionsBitField([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
    ]),
    deferred: false,
    replied: false,
    deferUpdate: async () => {
      i.deferred = true;
    },
    options: { getString: () => language },
    fields: {
      getTextInputValue: (name: string) =>
        name === "title" ? "Games" : "Amber\nBlue\nCedar",
    },
    message: {
      id: "m",
      flags: new MessageFlagsBitField(MessageFlags.Ephemeral),
      edit: async (payload: Record<string, unknown>) => {
        outputs.push(payload);
      },
    },
    isChatInputCommand: () => kind === "command",
    isModalSubmit: () => kind === "modal",
    isButton: () => kind === "button",
    showModal: async (value: ReturnType<typeof modal>) => {
      modalId = value.toJSON().custom_id;
    },
    deferReply: async (payload: Record<string, unknown>) => {
      assert.equal(payload.flags, MessageFlags.Ephemeral);
      i.deferred = true;
    },
    reply: async (payload: Record<string, unknown>) => {
      i.replied = true;
      outputs.push(payload);
    },
    editReply: async (payload: Record<string, unknown>) => {
      outputs.push(payload);
      return { id: "m" };
    },
  };
  return {
    i,
    interaction: i as unknown as Interaction,
    outputs,
    modalId: () => modalId,
  };
}
test("Actual Discord adapter handles command, Label modal, private preview and single-use share", async () => {
  const f = clientFixture();
  const run = handler(f.client);
  const open = interactionFixture("command");
  await run(open.interaction);
  assert.match(open.modalId(), /^rw:form:[a-f0-9]{32}$/);
  assert.equal(f.roleFetches(), 0);
  const submit = interactionFixture("modal", open.modalId());
  await run(submit.interaction);
  const payload = submit.outputs[0];
  assert(payload);
  assert(String(payload.content).includes("Özel önizleme"));
  assert(String(payload.content).includes("Tur 1"));
  const rows = payload.components as ReturnType<typeof buttons>;
  const shareId = componentId(rows[0]?.toJSON().components[0]);
  assert(shareId);
  const share = interactionFixture("button", shareId);
  await run(share.interaction);
  await run(interactionFixture("button", shareId).interaction);
  assert.equal(f.sent.length, 1);
  const posted = f.sent[0];
  assert(posted);
  assert.equal(posted.flags, MessageFlags.SuppressEmbeds);
  assert.deepEqual(posted.allowedMentions, { parse: [], repliedUser: false });
  assert.equal(posted.enforceNonce, true);
  assert.match(String(posted.nonce), /^[a-f0-9]{24}$/);
  assert.equal(f.roleFetches(), 2);
  assert.equal(share.i.deferred, true);
  assert.deepEqual(share.outputs[0]?.components, []);
});
test("Public source message cannot masquerade as an ephemeral preview", async () => {
  const f = clientFixture();
  const run = handler(f.client);
  const open = interactionFixture("command");
  await run(open.interaction);
  const submit = interactionFixture("modal", open.modalId());
  await run(submit.interaction);
  const rows = submit.outputs[0]?.components as ReturnType<typeof buttons>;
  const id = componentId(rows[0]?.toJSON().components[0]);
  assert(id);
  const click = interactionFixture("button", id);
  click.i.message.flags = new MessageFlagsBitField();
  await run(click.interaction);
  assert.equal(f.sent.length, 0);
  assert(String(click.outputs[0]?.content).includes("expired"));
});
test("Command is guild-install only; current modal labels and bounded input", () => {
  const json = command.toJSON();
  assert.deepEqual(json.contexts, [0]);
  assert.deepEqual(json.integration_types, [0]);
  for (const language of ["tr", "en"] as const) {
    const m = modal("a".repeat(32), language).toJSON();
    assert.equal(m.components.length, 2);
    for (const component of m.components) assert.equal(component.type, 18);
    const row = buttons("a".repeat(32), language)[0]?.toJSON();
    assert(row);
    assert.equal(row.components.length, 2);
    for (const component of row.components)
      assert(componentId(component).length <= 100);
  }
});
test("Every user notice has nonempty Turkish and English text", () => {
  for (const code of [
    "denied",
    "expired",
    "busy",
    "invalid",
    "discarded",
    "shared",
    "failed",
  ] as const)
    for (const language of ["tr", "en"] as const)
      assert(notice(code, language).length > 10);
});
function componentId(component: unknown): string {
  assert(
    component && typeof component === "object" && "custom_id" in component,
  );
  assert.equal(typeof component.custom_id, "string");
  return String(component.custom_id);
}
