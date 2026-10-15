export interface Config {
  token: string;
  application: string;
  guild: string;
}
export function config(env: NodeJS.ProcessEnv = process.env): Config {
  const token = env.DISCORD_TOKEN ?? "";
  const application = env.DISCORD_APPLICATION_ID ?? "";
  const guild = env.DISCORD_GUILD_ID ?? "";
  if (
    !/^[A-Za-z0-9_.-]{20,200}$/.test(token) ||
    !/^[1-9]\d{16,19}$/.test(application) ||
    !/^[1-9]\d{16,19}$/.test(guild)
  )
    throw new Error(
      "Run npm run setup first. Check the token, Application ID and Server ID in your local .env. Never share that file. / Önce npm run setup çalıştırın; yerel .env bilgilerini kontrol edin ve paylaşmayın.",
    );
  return { token, application, guild };
}
