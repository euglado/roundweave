import {
  ChannelType,
  type Client,
  type Interaction,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { Flow, type Port } from "./flow.js";
import { buttons, modal, notice } from "./ui.js";

export async function access(
  client: Client,
  guildId: string,
  channelId: string,
  userId: string,
): Promise<boolean> {
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.roles.fetch();
    const channel = await guild.channels.fetch(channelId, { force: true });
    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      (channel.rateLimitPerUser ?? 0) > 60 ||
      !client.user
    )
      return false;
    const [member, bot] = await Promise.all([
      guild.members.fetch({ user: userId, force: true, cache: false }),
      guild.members.fetch({ user: client.user.id, force: true, cache: false }),
    ]);
    const required = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
    ];
    return (
      !member.isCommunicationDisabled() &&
      !bot.isCommunicationDisabled() &&
      Boolean(channel.permissionsFor(member)?.has(required)) &&
      Boolean(channel.permissionsFor(bot)?.has(required))
    );
  } catch {
    return false;
  }
}

export function handler(
  client: Client,
  flow = new Flow(),
): (interaction: Interaction) => Promise<void> {
  return async (interaction) => {
    if (
      !(
        interaction.isChatInputCommand() ||
        interaction.isModalSubmit() ||
        interaction.isButton()
      )
    )
      return;
    if (
      interaction.isChatInputCommand()
        ? interaction.commandName !== "roundweave"
        : !/^rw:(form|share|discard):[a-f0-9]{32}$/.test(interaction.customId)
    )
      return;
    const language = interaction.isChatInputCommand()
      ? interaction.options.getString("language") === "tr" ||
        (!interaction.options.getString("language") &&
          interaction.locale === "tr")
        ? "tr"
        : "en"
      : interaction.locale === "tr"
        ? "tr"
        : "en";
    const safe = { allowedMentions: { parse: [] as [], repliedUser: false } };
    const reply = async (content: string): Promise<void> => {
      if (interaction.deferred || interaction.replied)
        await interaction.editReply({ content, components: [], ...safe });
      else
        await interaction.reply({
          content,
          flags: MessageFlags.Ephemeral,
          ...safe,
        });
    };
    try {
      if (!interaction.guildId || !interaction.channelId) {
        await reply(notice("denied", language));
        return;
      }
      const guildId = interaction.guildId;
      const channelId = interaction.channelId;
      const port: Port = {
        scope: {
          guild: guildId,
          channel: channelId,
          user: interaction.user.id,
        },
        language,
        message:
          interaction.isButton() &&
          interaction.message.flags.has(MessageFlags.Ephemeral)
            ? interaction.message.id
            : null,
        // Modal responses cannot be deferred; use payload permissions here.
        // Submission and publication perform fresh REST permission checks.
        access: () =>
          interaction.isChatInputCommand()
            ? Promise.resolve(
                interaction.channel?.type === ChannelType.GuildText &&
                  Boolean(
                    interaction.memberPermissions?.has([
                      PermissionFlagsBits.ViewChannel,
                      PermissionFlagsBits.SendMessages,
                    ]),
                  ) &&
                  Boolean(
                    interaction.appPermissions?.has([
                      PermissionFlagsBits.ViewChannel,
                      PermissionFlagsBits.SendMessages,
                    ]),
                  ),
              )
            : access(client, guildId, channelId, interaction.user.id),
        modal: async (id) => {
          if (!interaction.isChatInputCommand())
            throw new Error("Wrong interaction");
          await interaction.showModal(modal(id, language));
        },
        defer: async () => {
          if (interaction.isButton()) await interaction.deferUpdate();
          else await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        },
        preview: async (content, id) => {
          const result = await interaction.editReply({
            content: `${port.language === "tr" ? "Özel önizleme · 5 dakika geçerli. Paylaşım bu kanalda herkese görünür." : "Private preview · expires in 5 minutes. Sharing makes this visible in this channel."}\n\n${content}`,
            components: buttons(id, port.language),
            ...safe,
          });
          return result.id;
        },
        notice: async (code) => {
          await reply(notice(code, port.language));
        },
        clear: async (code) => {
          // deferUpdate + editReply edits the original ephemeral preview.
          await reply(notice(code, port.language));
        },
        publish: async (content, nonce) => {
          const channel = await client.channels.fetch(channelId, {
            force: true,
          });
          if (
            !channel ||
            channel.type !== ChannelType.GuildText ||
            channel.guildId !== guildId
          )
            throw new Error("Channel unavailable");
          await channel.send({
            content,
            nonce,
            enforceNonce: true,
            flags: MessageFlags.SuppressEmbeds,
            ...safe,
          });
        },
      };
      if (interaction.isChatInputCommand()) await flow.open(port);
      else {
        const [, action, id] = interaction.customId.split(":");
        if (!id) return;
        if (interaction.isModalSubmit() && action === "form")
          await flow.submit(
            id,
            interaction.fields.getTextInputValue("title"),
            interaction.fields.getTextInputValue("teams"),
            port,
          );
        else if (
          interaction.isButton() &&
          (action === "share" || action === "discard")
        )
          await flow.click(id, action, port);
      }
    } catch {
      console.error(
        "RoundWeave interaction failed; input and credentials omitted.",
      );
      try {
        await reply(notice("failed", language));
      } catch {
        /* No sensitive error objects. */
      }
    }
  };
}
