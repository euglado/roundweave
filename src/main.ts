import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { config } from "./config.js";
import { handler } from "./discord.js";
import { Flow } from "./flow.js";

async function main(): Promise<void> {
  const settings = config();
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: { parse: [], repliedUser: false },
    rest: { retries: 0, timeout: 10_000 },
    makeCache: Options.cacheWithLimits({
      MessageManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
      PresenceManager: 0,
    }),
  });
  const flow = new Flow();
  const sweep = setInterval(() => flow.sweep(), 30_000);
  sweep.unref();
  const handle = handler(client, flow);
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.guildId !== settings.guild) return;
    await handle(interaction);
  });
  client.once(Events.ClientReady, () => {
    console.log("RoundWeave connected. / RoundWeave bağlandı.");
  });
  client.on(Events.Error, () =>
    console.error("Discord connection error; details omitted."),
  );
  const stop = (): void => {
    clearInterval(sweep);
    client.destroy();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  await client.login(settings.token);
}
main().catch(() => {
  console.error(
    "RoundWeave could not start. Run npm run setup; check network, token and Guilds intent. / Bot başlatılamadı; kurulumu ve bağlantıyı kontrol edin.",
  );
  process.exitCode = 1;
});
