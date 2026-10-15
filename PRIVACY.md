# Privacy / Gizlilik

RoundWeave is self-hosted. The operator controls the process, hosting access and local token. Commands are restricted to the configured server. The bot uses Guilds intent only, never reads channel messages or joins voice, and does not fetch full member rosters. It fetches the interacting member and its own member record for permission checks; SDK user/member/message caches are disabled.

Drafts temporarily retain team labels, title, language and user/server/channel/preview IDs in bounded process RAM. Each form/preview stage has a five-minute lifetime; a sweep every 30 seconds or the next interaction removes expired entries. In-flight requests may briefly retain local variables. Five-second form and 60-second channel cooldown maps also hold IDs with expiry. Restarting clears all state. No draft database, analytics, persistent content log or external issue submission exists.

The local `.env` token is an operator credential, not draft data. It remains until the operator removes or replaces it. Git ignore rules do not protect cloud backups or directory sharing. Do not put live credentials in shared or synchronized folders.

Discord processes submitted forms, ephemeral replies and public shares under its own policies. Private means an ephemeral Discord response visible to the initiating user; it does not mean Discord cannot access the data. Public shares remain in their channel until deleted in Discord. Draft expiry never deletes a public message. Do not submit personal names, contact information, credentials or confidential material. Narrow input validation cannot identify all sensitive data.

Stop the process to clear state immediately. Delete shared messages with the normal Discord UI and appropriate permissions. Report issues without real tokens, IDs or sensitive labels.

Türkçe: Operatör kendi hosting ve tokenından sorumludur. Bot kanal mesajlarını okumaz; yalnızca etkileşen üye ve kendi izinlerini kontrol eder. Taslaklar, başlık/takım etiketleri, dil ve bağlam kimlikleriyle sınırlı RAM'dedir; her aşama beş dakika geçerlidir, temizlik en fazla sonraki 30 saniyede/işlemde yapılır. Devam eden ağ çağrıları veriyi kısa süre daha tutabilir. Yeniden başlatma taslakları ve bekleme kayıtlarını siler. `.env` yerel kimlik bilgisidir; kaldırılana kadar kalır. Gitignore senkronizasyonu korumaz. Discord formları/özel yanıtları kendi politikalarıyla işler. Paylaşılan mesajlar otomatik silinmez; yetkili üyeler Discord'dan siler. Hassas bilgi girmeyin; süreç durdurularak RAM temizlenebilir.
