# Contributing / Katkı

Use Node.js 24. Fork/clone, run `npm ci --ignore-scripts`, `npm run check` and `npm audit --audit-level=low`. Run `npx biome check --write .` for formatting. Keep commits concrete and small. Explain behavior changes, relevant tests and remaining live-validation limits in pull requests.

Preserve Guilds-only intent, minimal permissions, owner/context binding, private preview and explicit sharing. Do not add full roster access, message-content scanning, betting, telemetry or automatic reposts. Add meaningful tests for changed fixture invariants or consent/permission boundaries. Tests must not contact Discord or require secrets. Review all dependency licenses/integrity before changing the allowlist; source-pattern scans are only one check.

Use synthetic team names and sanitized errors in bug reports. Do not include tokens or `.env`. See SECURITY.md for sensitive reports. Contributions are under the repository's MIT license.

Türkçe: Node.js 24 kullanın, yukarıdaki kurulum/test/audit komutlarını çalıştırın. Küçük ve somut değişiklikler yapın; PR'da davranışı ve doğrulamayı anlatın. Guilds intent'i, en az izin, özel önizleme ve açık paylaşım onayını koruyun. Testlerde gerçek Discord/token kullanmayın. Hassas hata bildirimleri için SECURITY.md dosyasını okuyun. Katkılar MIT lisansı kapsamındadır.
