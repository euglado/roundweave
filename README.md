# RoundWeave

[Türkçe](#türkçe) · [English](#english) · [License](LICENSE) · [Privacy](PRIVACY.md) · [Security](SECURITY.md)

A small, self-hosted Discord bot for community game nights. Preview a single round-robin fixture for 2–8 team labels, then choose whether to share it. This repository contains a real Discord Gateway bot; GitHub Actions only runs its offline checks.

## Türkçe

### Amaç ve özellikler

RoundWeave, küçük Discord oyun topluluklarının lig usulü eşleşme hazırlamasını kolaylaştırır. Her takım diğer takımlarla tam bir kez karşılaşır. Tek sayıda takım varsa her takım bir tur bay geçer. Fikstür, girilen takım sırasıyla çember algoritması kullanılarak hesaplanır; rastgele kura veya güç dengesi iddiası yoktur. Sol/sağ konumu ev/deplasman anlamına gelmez.

- `/roundweave` komutu tıklanabilir Türkçe veya İngilizce form açar.
- Etkinlik başlığı ve satır başına bir takım adı girilir; Discord üye seçimi gerekmez.
- Sonuç önce yalnızca size görünür. **Bu kanala paylaş** bir metin mesajı gönderir; **Vazgeç** hiçbir şey paylaşmaz.
- Her form ve önizleme aşaması ayrı ayrı beş dakika geçerlidir. Paylaşım tek kullanımlıktır; çift tıklama ikinci mesaj üretmez.
- Mesaj okuma, DM, kullanıcı listesi, ses bağlantısı, sonuç tablosu, puan, bahis, kayıt, saat planlama ve hatırlatma yoktur. Bot takımlara mesaj göndermez.

### Gereksinimler

İnternete erişebilen Windows, macOS veya Linux bilgisayar; [Node.js](https://nodejs.org/) **24.x** (npm dahildir); kendi Discord hesabınız, uygulamanız ve bot tokenınız; bot ekleme yetkiniz olan bir sunucu gerekir. Bu depo size çalışan bir genel bot daveti veya ücretsiz hosting sağlamaz. Bir süreç bir sunucu için çalışır; birden fazla kopyayı aynı tokenla açmayın. Kaynak kod düzenlemeniz gerekmez.

### Developer Portal ve kurulum

1. [Discord Developer Portal](https://discord.com/developers/applications) sayfasında **New Application** ile kendi uygulamanızı oluşturun. **General Information → Application ID** değerini kopyalayın; **Public Key** ile karıştırmayın.
2. **Bot** bölümünde bot kullanıcısını oluşturun/görüntüleyin. **Reset Token** ile tokenı alın. Token şifredir: ekran görüntüsüne, sohbete, GitHub'a veya destek mesajına koymayın. Sızarsa hemen aynı bölümden sıfırlayın.
3. **Privileged Gateway Intents** anahtarlarını kapalı tutun: Message Content, Server Members ve Presence gerekmez. Bot yalnızca ayrıcalıksız **Guilds** intent'i kullanır. **Interactions Endpoint URL** alanını boş bırakın; etkileşimler Gateway üzerinden gelir. Installation bölümünde **Guild Install** kullanın; kullanıcıya özel kurulum gerekmez.
4. Discord istemcisinde **User Settings → Advanced → Developer Mode** açın. Sunucu simgesine sağ tıklayıp **Copy Server ID** seçin. Kanal kimliği veya davet kodu kullanmayın.
5. Bu deponun **Code → Download ZIP** seçeneğiyle arşivini indirin, tamamen çıkarın. `package.json` bulunan klasörde çalışın. Git bilenler `git clone https://github.com/euglado/roundweave.git` kullanabilir.
6. Windows'ta `setup.cmd` dosyasını açın. macOS/Linux'ta bu klasörde Terminal açıp `bash setup.sh` çalıştırın. Kurulum bağımlılıkları kilitli sürümleriyle indirir, derler, uygulama/sunucu kimliğinizi ve **ekranda görünmeyen tokenınızı** sorar. Yapıştırırken hiçbir karakter görünmemesi normaldir; Enter'a basın. Kurulum etkileşimli terminal gerektirir. Yanlış token biçimi kaydedilmez.
7. Kurulumun gösterdiği Discord bağlantısını tarayıcıda açın. Kendi uygulamanızın adını ve doğru sunucuyu doğrulayın. Yalnızca **View Channels / Kanalı Görüntüle** ve **Send Messages / Mesaj Gönder** izinlerini kabul edin. Administrator vermeyin. Scopes `bot` ve `applications.commands`, izin değeri `3072` olmalıdır.
8. Windows'ta `register.cmd`, diğer sistemlerde `bash register.sh` çalıştırın. Bu işlem yalnızca `/roundweave` adlı sunucu komutunu ekler/günceller; diğer komutları topluca silmez.
9. Windows'ta `start.cmd`, diğer sistemlerde `bash start.sh` açın. **RoundWeave bağlandı** mesajını bekleyin. Normal bir sunucu metin kanalında `/roundweave` yazın.

Terminal kullanmak isteyenler aynı sırayla şunları çalıştırabilir:

```sh
npm ci --ignore-scripts
npm run check
npm run setup
npm run register
npm start
```

`npm run check` derlemeyi de yapar. Yalnızca `npm ci` kullandıysanız register/start öncesinde `npm run build` gerekir. Yardımcı dosyalar bu derlemeyi otomatik yapar. GitHub CI'ye Discord tokenı eklemeyin; testler token kullanmaz.

### Yapılandırma ve botu açık tutma

Kurulum yerel `.env` dosyasına `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` ve `DISCORD_GUILD_ID` yazar. Token dahil içerik Git tarafından yok sayılır. Unix sistemlerinde dosya oluşturma izni `0600` istenir; Windows'ta hesabınıza ait özel klasör kullanın ve klasör paylaşımını sınırlandırın. Bulut senkronizasyonu `.gitignore` kurallarını uygulamayabilir: gerçek tokenı senkronize edilen veya ortak klasöre koymayın. Yedekleme ve erişim kontrolü operatörün sorumluluğudur.

Kurulum mevcut `.env` dosyasını değiştirmez. Yeniden yapılandırmak için botu Ctrl+C ile durdurun, **yalnızca bu bot klasöründeki** `.env` dosyasını Dosya Gezgini/Finder ile silin ve kurulum dosyasını yeniden çalıştırın. Token sızdıysa önce Portal'da sıfırlayın. Kaynak dosyaları düzenlemeniz gerekmez. İleri düzey hosting sistemleri aynı üç değeri gizli ortam değişkenleri olarak sağlayabilir; mevcut ortam değişkenleri `.env` değerlerine göre önceliklidir.

Terminal kapanırsa, bilgisayar uyursa veya ağ kesilirse bot çalışmaz. Sürekli kullanım için güvenilir, Node.js 24 destekleyen bir hostta tek bir `npm start` sürecini çalışır tutun; hizmetin çalışma klasörü bu bot klasörü olmalıdır. Yeniden başlatma tüm taslakları ve bekleme sürelerini sıfırlar. Genel mesajlar Discord'da kalır. Hosting, gerçek tokenla kurulum ve canlı mobil/ekran okuyucu davranışı otomatik testlerle doğrulanmış değildir.

### Kullanım ve sınırlar

`/roundweave language:Türkçe` seçin. Başlığa `Topluluk oyunları`, takım alanına ayrı satırlarda `Amber`, `Blue`, `Cedar` girin. Önizlemede ilk turda Blue–Cedar ve Amber için bay, ikinci turda Amber–Cedar, üçüncü turda Amber–Blue görürsünüz. **Bu kanala paylaş** seçeneği mevcut kanala aynı fikstürü gönderir. Üyelerin kişisel adları yerine genel takım etiketleri kullanın.

Başlık 1–40, her takım adı 1–18 karakterdir; 2–8 benzersiz takım gerekir. Baştaki/sondaki boşluklar temizlenir, Unicode NFC uygulanır; Türkçe ve genel küçük harf karşılaştırmasında yinelenen adlar reddedilir. Harf, rakam, boşluk, nokta, parantez, kesme ve tire desteklenir; başlangıç harf/rakam olmalıdır. Boş ara satır, mention, URL sözdizimi, Markdown ve kontrol karakterleri reddedilir. Bu doğrulama bir kişisel veri veya sır algılayıcısı değildir; hassas bilgi girmeyin.

Tur sayısı çift takımda n−1, tek takımda n; maç sayısı n(n−1)/2'dir. Tur içindeki eşleşmeler aynı anda oynanabilecek gruplardır; salon, cihaz, hakem veya süre tahsis edilmez. Takım sırasını değiştirmeniz fikstürü değiştirebilir. Maksimum sekiz takımda 28 maç vardır; tek metin mesajına sığar. Adalet, resmi spor kuralları veya sıralama uygunluğu garantisi yoktur.

### İzinler ve güvenlik/gizlilik

Bot ve komutu kullanan üye hedef kanalda View Channel + Send Messages iznine sahip olmalıdır. Form açılışında Discord etkileşimindeki izinler kullanılır; önizleme ve paylaşımda roller, kanal ve iki üyenin izinleri REST üzerinden yeniden kontrol edilir. Zaman aşımındaki üyeler/bot, thread/forum/duyuru/DM kanalları ve 60 saniyeden uzun yavaş mod reddedilir. Yetki doğrulanamazsa paylaşım yapılmaz. İzin kontrolüyle mesaj gönderimi arasındaki küçük ağ aralığı tamamen ortadan kaldırılamaz; Discord son kararı uygular.

Read Message History, Manage Messages, Manage Channels, Manage Roles, Embed Links veya Administrator gerekmez. Mention işleme ve bağlantı önizlemeleri kapalıdır. Komuta erişimi Discord **Server Settings → Integrations → RoundWeave** bölümünden rol/kanal düzeyinde sınırlandırabilirsiniz. Varsayılan olarak gerekli kanal izinlerine sahip üyeler kullanabilir.

En fazla 100 form/önizleme RAM'de tutulur; üye/sunucu başına formlar arasında 5 saniye, kanal başına paylaşımlar arasında 60 saniye beklenir. Bekleme haritaları 1000 kayıtla sınırlıdır. Süresi dolan kayıtlar en geç sonraki 30 saniyelik temizlikte veya sonraki işlemde silinir; beşinci dakika itibarıyla kullanılamaz. Yarım kalan ağ işlemleri kısa süreyle yerel değişkenlerde kalabilir. Taslak, kullanıcı/sunucu/kanal ve özel önizleme mesajına bağlanır; paylaşım başlamadan tüketilir. Belirsiz gönderim hatası otomatik tekrar edilmez: yeniden denemeden kanalı kontrol edin. HTTP sunucu hatası tekrarları kapalıdır; Discord hız sınırlarını SDK yönetir.

Bot; başlık, takım etiketleri, dil, kullanıcı/sunucu/kanal kimlikleri ve önizleme mesajı kimliğini geçici RAM'de tutar. Veritabanı, dosyaya taslak yazma, telemetri, kişi listesi veya harici API yoktur. Hata logları içerik/token içermez. Formu ve özel yanıtı Discord yine işler; RAM'den silinme Discord'un veri saklama politikasını değiştirmez. Paylaşılan mesajlar otomatik silinmez; yetkili bir üye Discord üzerinden silebilir. Ayrıntılar: [PRIVACY.md](PRIVACY.md).

### Sorun giderme

- `node`/`npm` bulunamadı: Node.js 24 kurun, terminali yeniden açın. PowerShell npm betik engelinde `npm.cmd` kullanın veya `.cmd` yardımcılarını açın; sistem güvenlik politikasını kapatmanız gerekmez.
- Komut yok: doğru Application ID/Server ID, Guild Install ve `applications.commands` scope'unu doğrulayın, register çalıştırın, Discord istemcisini yenileyin. Bot o sunucuda bulunmalıdır.
- Bot çevrimdışı: start terminalini açık tutun; token sıfırlandıysa kurulumu yenileyin. Ağ/hosting çıkışının Discord HTTPS ve Gateway bağlantılarına izin verdiğini kontrol edin.
- Form/önizleme süresi doldu: `/roundweave` ile yeni taslak açın. Yeniden başlatma eski butonları geçersiz yapar. Süresi dolan özel yanıt Discord istemcisinde görünmeye devam edebilir.
- İzin reddi: üyenin ve botun rol/kanal izinleri, zaman aşımı, kanal türü ve yavaş modu kontrol edin. Administrator vermek çözüm olarak gerekmez.
- Paylaşım sonucu belirsiz: kanalı kontrol edin; ulaşmış mesajı tekrar göndermeyin. Beş saniyelik form veya 60 saniyelik kanal beklemesinde daha sonra yeni taslak açın.
- Kurulum tokenı göstermiyor: normaldir; yapıştırın ve Enter'a basın. CI, IDE çıktı paneli veya etkileşimsiz terminal yerine gerçek terminal kullanın.

### Testler, katkı ve lisans

Node.js 24 ile `npm ci --ignore-scripts`, `npm run check`, `npm audit --audit-level=low` çalıştırın. `check`; Biome önerilen kuralları, katı TypeScript (bağımlılık tipleri dahil), Node testleri ve kaynak/bağımlılık taramasını kapsar. Tarama bilinen kimlik bilgisi biçimleri, izin verilen lisanslar, npm registry adresleri, SHA-512 kilit kayıtları ve kurulum betiği yokluğunu denetler; kapsamlı bir güvenlik denetimi değildir. Gerçek bot tokenını testlere vermeyin. CI Ubuntu, Windows ve macOS üzerinde ayrıca Node/Bash sözdizimi ve temiz Git diff kontrolü yapar; izinleri yalnızca `contents: read` düzeyindedir.

Testler tüm 2–8 takım eşleşme değişmezlerini, bay dağılımını, boyut sınırlarını, dil seçimini, Discord adaptörünü, güncel izin kontrolünü, eşzamanlı tıklamayı, süre/kapasiteyi ve yapılandırılmamış giriş noktalarını kapsar. Discord çağrıları taklittir; gerçek sunucuda deneme operatöre aittir. [CONTRIBUTING.md](CONTRIBUTING.md) katkı adımlarını açıklar. Kod [MIT](LICENSE) lisanslıdır; bağımlılıkların kendi lisansları geçerlidir.

## English

### Purpose and features

RoundWeave helps small Discord game communities prepare a single round-robin fixture. Every team meets every other team exactly once. For odd team counts, each team has one bye. A deterministic circle rotation uses your input order; it is not a random draw or a skill-balancing system. Left/right sides do not mean home/away.

- `/roundweave` opens a clickable Turkish or English form for an event title and 2–8 team labels.
- Only you see the initial preview. **Share to this channel** sends one plain-text plan; **Discard** sends nothing publicly.
- Forms and delivered previews each last five minutes. Drafts are single-use and bound to their owner and context.
- No member roster, messages read, DMs, voice, scores, betting, signups, dates, reminders or external services. Teams are labels, not selected Discord accounts.

### Requirements

Use Windows, macOS or Linux with internet access and [Node.js 24.x](https://nodejs.org/) (includes npm). You need your own Discord application/token and a server where you can install bots. This is self-hosted source, not a hosted public bot or a hosting subscription. Run one process for one configured server and one token. You do not need to edit source code.

### Developer Portal and installation

1. In the [Discord Developer Portal](https://discord.com/developers/applications), choose **New Application**. Copy **General Information → Application ID**, not the Public Key.
2. Open **Bot**, create/view the bot user and use **Reset Token** to obtain its token. Treat the token like a password: never post it, screenshot it or commit it. Reset it immediately if exposed.
3. Leave **Message Content**, **Server Members** and **Presence** privileged intents off. Only the nonprivileged Guilds intent is used. Leave **Interactions Endpoint URL** empty because this bot receives interactions over the Gateway. Choose **Guild Install** in Installation settings; user installation is unnecessary.
4. Enable **Discord User Settings → Advanced → Developer Mode**. Right-click your server icon and **Copy Server ID**. Do not use a channel ID or invite code.
5. Download **Code → Download ZIP** from this repository and fully extract it. Work in the folder containing `package.json`. Git users may run `git clone https://github.com/euglado/roundweave.git`.
6. On Windows, open `setup.cmd`. On macOS/Linux, open Terminal in that folder and run `bash setup.sh`. It installs locked dependencies, compiles, and asks for the two IDs and a **hidden token**. Pasted token characters are intentionally invisible; press Enter. An interactive terminal is required. Invalid token formats are not saved.
7. Open the Discord authorization URL printed by setup. Check your application's name and the intended server. Grant **View Channels** and **Send Messages** only. Do not grant Administrator. Scopes are `bot` and `applications.commands`; permission integer is `3072`.
8. Run `register.cmd` or `bash register.sh`. Registration upserts only `/roundweave` for your server; it does not bulk-replace other commands.
9. Run `start.cmd` or `bash start.sh`. Wait for **RoundWeave connected**, then use `/roundweave` in an ordinary server text channel.

Equivalent terminal commands:

```sh
npm ci --ignore-scripts
npm run check
npm run setup
npm run register
npm start
```

`check` compiles too. If you only installed dependencies, run `npm run build` before register/start. Helpers build automatically. Never give CI a Discord token; tests are offline.

### Configuration and keeping the bot online

Setup saves `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` and `DISCORD_GUILD_ID` in local `.env`, excluded from Git. It requests file mode `0600` on Unix; on Windows, use an account-private directory with restricted folder access. Cloud synchronization may ignore `.gitignore`: keep live credentials outside shared/synchronized folders and secure backups yourself.

Setup refuses to overwrite `.env`. To reconfigure, stop with Ctrl+C, delete **only this bot folder's** `.env` using your file manager, then rerun setup. If a token leaked, reset it in the Portal first. No source editing is needed. Advanced hosts can provide the same three values through secret environment variables; existing process variables take precedence over `.env`.

Closing the terminal, sleeping the computer or losing connectivity stops the bot. Continuous operation needs a trusted Node.js 24 host running one `npm start` process, with this folder as its working directory. Restarting clears drafts and cooldowns; published Discord messages remain. Live installation, hidden-token terminal input, mobile/screen-reader behavior and continuous hosting need operator verification.

### Usage and limits

Choose `/roundweave language:English`. Enter `Community games` and separate lines `Amber`, `Blue`, `Cedar`. Round 1 pairs Blue–Cedar with Amber on a bye, round 2 pairs Amber–Cedar, and round 3 pairs Amber–Blue. Review before clicking **Share to this channel**. Prefer generic team labels rather than personal names.

Titles are 1–40 characters; each of 2–8 unique labels is 1–18. Outer whitespace is trimmed and Unicode NFC applied. Duplicates under either Turkish or general lowercase comparison are rejected. Letters, numbers, spaces, periods, parentheses, apostrophes and hyphens are supported; start with a letter/number. Blank internal rows, mentions, URL syntax, Markdown and control characters are rejected. These rules are not a personal-data or secret detector; do not enter sensitive information.

For n teams, even counts have n−1 rounds and odd counts have n, with n(n−1)/2 matches. A round groups games that could run concurrently; it assigns no rooms, equipment, referees or time slots. Input order affects the fixture. Eight teams produce 28 matches in one text message. There is no guarantee of competitive fairness or compliance with a sport's official rules.

### Permissions, security and privacy

Both member and bot need View Channel + Send Messages in the target channel. Opening uses interaction permission snapshots so the modal can respond promptly. Preview and Share fetch current roles, channel and both members through REST. Timed-out members/bots, threads, forums, announcements, DMs and slowmode over 60 seconds are rejected. Failed permission checks deny publication. There is necessarily a small network gap between permission checks and sending; Discord enforces final access.

Read Message History, Manage Messages/Channels/Roles, Embed Links and Administrator are unnecessary. Mentions and embeds are suppressed. Use **Server Settings → Integrations → RoundWeave** to restrict command availability by role/channel; otherwise members with the required channel permissions can use it.

At most 100 drafts are retained in RAM, with a five-second member/server form cooldown and 60-second channel share cooldown. Cooldown maps are capped at 1000 entries. Expired records become unusable exactly at expiry and are removed on activity or a 30-second sweep. In-flight operations can temporarily retain local variables. Drafts bind user/server/channel and ephemeral preview message; they are consumed before sending. Ambiguous send errors never retry automatically: check the channel before making a new draft. REST server-error retries are disabled; the SDK still handles Discord rate limits.

Temporary state includes title, team labels, language, user/server/channel IDs and preview message ID. No database, persisted drafts, analytics or external API exists. Sanitized error logs omit content and credentials. Discord still receives form inputs and ephemeral responses; RAM deletion does not change Discord retention. Shared messages remain until a permitted member deletes them in Discord. See [PRIVACY.md](PRIVACY.md).

### Troubleshooting

- Missing node/npm: install Node.js 24 and reopen your terminal. For PowerShell npm script restrictions, use `npm.cmd` or the `.cmd` helpers without disabling system security policy.
- Missing command: verify Application ID/Server ID, Guild Install, bot membership and `applications.commands`, rerun register and refresh Discord.
- Offline bot: keep start open; reconfigure after resetting a token. Check that your host allows Discord HTTPS and Gateway connections.
- Expired draft: start `/roundweave` again. Restarts invalidate old buttons. An expired ephemeral message may still be visible in the Discord client.
- Permission denied: check both members' role/channel permissions, timeouts, channel type and slowmode. Administrator is not needed as a workaround.
- Unconfirmed delivery: inspect the channel before sending again. Wait out form/channel cooldowns and create a new draft if needed.
- Invisible token entry: expected; paste and press Enter in a real interactive terminal, not an IDE output pane or CI job.

### Tests, contribution and license

Run `npm ci --ignore-scripts`, `npm run check`, and `npm audit --audit-level=low` with Node.js 24. Checks include recommended Biome rules, strict TypeScript including dependency types, Node tests, source credential-pattern checks, allowed dependency licenses, npm registry URLs, SHA-512 lock records and absence of installation scripts. Pattern scanning is not a complete security audit. Do not supply real Discord tokens to tests. CI also validates Node/Bash syntax and clean Git diffs on Ubuntu, Windows and macOS, with only `contents: read` permission.

Tests exercise all 2–8 team pair/bye invariants, size boundaries, language, the actual Discord adapter with mocks, fresh permission checks, concurrent clicks, expiry/capacity and unconfigured executable entry points. Discord interactions are mocked; live operation needs your own validation. See [CONTRIBUTING.md](CONTRIBUTING.md). Source is [MIT-licensed](LICENSE); dependencies retain their respective licenses.

Official references: [Interactions](https://docs.discord.com/developers/interactions/receiving-and-responding), [Components](https://docs.discord.com/developers/components/reference), [Permissions](https://docs.discord.com/developers/topics/permissions), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy).
