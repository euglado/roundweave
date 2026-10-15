import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";

async function hidden() {
  const input = process.stdin;
  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  process.stdout.write("Bot token (hidden / gizli): ");
  try {
    return await new Promise((resolve, reject) => {
      let value = "";
      const keypress = (chunk, key) => {
        if (key?.ctrl && key.name === "c") {
          input.off("keypress", keypress);
          reject(new Error("Cancelled"));
        } else if (key?.name === "return" || key?.name === "enter") {
          input.off("keypress", keypress);
          resolve(value);
        } else if (key?.name === "backspace") value = value.slice(0, -1);
        else if (
          chunk &&
          /^[A-Za-z0-9_.-]+$/.test(chunk) &&
          value.length + chunk.length <= 200
        )
          value += chunk;
      };
      input.on("keypress", keypress);
    });
  } finally {
    input.setRawMode(false);
    input.pause();
    process.stdout.write("\n");
  }
}
async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Open an interactive terminal / Etkileşimli terminal açın.",
    );
  if (existsSync(".env"))
    throw new Error(
      ".env already exists; it was not changed. See README to reconfigure. / .env zaten var; değiştirilmedi.",
    );
  console.log(
    "RoundWeave setup / kurulum. Never share your token or .env. / Tokenı veya .env dosyasını paylaşmayın.",
  );
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let application;
  let guild;
  try {
    application = (
      await rl.question("Application ID / Uygulama kimliği: ")
    ).trim();
    guild = (await rl.question("Server ID / Sunucu kimliği: ")).trim();
  } finally {
    rl.close();
  }
  if (!/^[1-9]\d{16,19}$/.test(application) || !/^[1-9]\d{16,19}$/.test(guild))
    throw new Error(
      "Use numeric IDs copied from Discord. / Discord'dan kopyalanan sayısal kimlikleri kullanın.",
    );
  const token = await hidden();
  if (!/^[A-Za-z0-9_.-]{20,200}$/.test(token))
    throw new Error(
      "Invalid token format; nothing saved. / Token biçimi geçersiz; kaydedilmedi.",
    );
  await writeFile(
    ".env",
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Saved locally. Install the bot using this URL / Yerel olarak kaydedildi. Botu bu bağlantıyla ekleyin:",
  );
  console.log(
    `https://discord.com/oauth2/authorize?client_id=${application}&scope=bot%20applications.commands&permissions=3072&integration_type=0&guild_id=${guild}&disable_guild_select=true`,
  );
  console.log(
    "Then run register, then start. / Ardından register ve start dosyalarını çalıştırın.",
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Setup failed / Kurulum başarısız.",
  );
  process.exitCode = 1;
});
