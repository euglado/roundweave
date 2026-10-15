import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { command } from "./ui.js";

async function main(): Promise<void> {
  const settings = config();
  const rest = new REST({
    version: "10",
    retries: 0,
    timeout: 10_000,
  }).setToken(settings.token);
  // Upsert only this named guild command; never bulk-delete other commands.
  await rest.post(
    Routes.applicationGuildCommands(settings.application, settings.guild),
    { body: command.toJSON() },
  );
  console.log(
    "/roundweave registered in your server. / Komut sunucunuza kaydedildi.",
  );
}
main().catch(() => {
  console.error(
    "Registration failed. Run setup; check IDs, bot membership and network. / Komut kaydedilemedi; kurulumu, kimlikleri ve bot üyeliğini kontrol edin.",
  );
  process.exitCode = 1;
});
