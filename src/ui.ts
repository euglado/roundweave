import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Notice } from "./flow.js";
import type { Language } from "./plan.js";

export const command = new SlashCommandBuilder()
  .setName("roundweave")
  .setDescription("Preview a round-robin fixture plan for 2–8 teams")
  .setDescriptionLocalizations({
    tr: "2–8 takım için lig usulü fikstür önizle",
  })
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addStringOption((option) =>
    option
      .setName("language")
      .setDescription("Form and plan language / Form ve plan dili")
      .addChoices(
        { name: "Türkçe", value: "tr" },
        { name: "English", value: "en" },
      ),
  );

export function modal(id: string, language: Language): ModalBuilder {
  const tr = language === "tr";
  return new ModalBuilder()
    .setCustomId(`rw:form:${id}`)
    .setTitle(tr ? "Fikstür taslağı" : "Fixture draft")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel(
          tr
            ? "Etkinlik başlığı (kişisel bilgi yok)"
            : "Event title (no personal information)",
        )
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("title")
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(40)
            .setRequired(true),
        ),
      new LabelBuilder()
        .setLabel(
          tr
            ? "Her satıra bir takım adı; 2–8 takım"
            : "One team label per line; 2–8 teams",
        )
        .setDescription(
          tr
            ? "En fazla 18 karakter/ad. Kişi adları, bağlantı veya mention girmeyin."
            : "Up to 18 characters/label. No personal names, links or mentions.",
        )
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("teams")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(3)
            .setMaxLength(160)
            .setPlaceholder("Amber\nBlue\nCedar")
            .setRequired(true),
        ),
    );
}
export function buttons(
  id: string,
  language: Language,
): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`rw:share:${id}`)
        .setLabel(
          language === "tr" ? "Bu kanala paylaş" : "Share to this channel",
        )
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`rw:discard:${id}`)
        .setLabel(language === "tr" ? "Vazgeç" : "Discard")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}
const messages: Record<Notice, [string, string]> = {
  denied: [
    "This needs an ordinary text channel, current View Channel + Send Messages access for you and the bot, no member timeout, and slowmode of at most 60 seconds.",
    "Normal bir metin kanalı, sizin ve botun Kanalı Görüntüle + Mesaj Gönder izni, zaman aşımı olmaması ve en fazla 60 saniyelik yavaş mod gerekir.",
  ],
  expired: [
    "This draft expired, was already used, or belongs to another context. Run /roundweave again.",
    "Taslak süresi doldu, kullanıldı veya farklı bir bağlama ait. /roundweave komutunu tekrar çalıştırın.",
  ],
  busy: [
    "Please wait: forms have a 5-second member cooldown; sharing has a 60-second channel cooldown. The bot may also be at capacity. Create a fresh draft later.",
    "Lütfen bekleyin: formlarda üye başına 5, paylaşımda kanal başına 60 saniye bekleme vardır. Bot kapasitesi de dolmuş olabilir. Daha sonra yeni taslak oluşturun.",
  ],
  invalid: [
    "Use 2–8 unique team labels, one per line (1–18 characters), and a title (1–40). Use letters, numbers, spaces, periods, parentheses, apostrophes or hyphens; no blank lines, links, mentions or formatting. Run /roundweave to try again.",
    "Satır başına bir tane, 2–8 benzersiz takım adı (1–18 karakter) ve başlık (1–40) kullanın. Harf, rakam, boşluk, nokta, parantez, kesme veya tire kullanın; boş satır, bağlantı, mention veya biçimlendirme eklemeyin. Yeniden /roundweave çalıştırın.",
  ],
  discarded: [
    "Draft discarded. Nothing was shared.",
    "Taslak iptal edildi. Paylaşım yapılmadı.",
  ],
  shared: [
    "Fixture shared. This draft is now closed.",
    "Fikstür paylaşıldı. Taslak kapatıldı.",
  ],
  failed: [
    "Delivery could not be confirmed. Check the channel before creating another draft; the message might have arrived. This draft will not retry.",
    "Teslimat doğrulanamadı. Yeni taslak oluşturmadan önce kanalı kontrol edin; mesaj ulaşmış olabilir. Bu taslak yeniden gönderilmez.",
  ],
};
export function notice(code: Notice, language: Language): string {
  return messages[code][language === "tr" ? 1 : 0];
}
