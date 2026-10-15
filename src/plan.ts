export type Language = "en" | "tr";
export class InputError extends Error {}
export interface Round {
  matches: [string, string][];
  bye: string | null;
}
export interface Plan {
  title: string;
  teams: string[];
  rounds: Round[];
}

export function text(value: string, max: number): string {
  const clean = value.normalize("NFC").trim();
  // Deliberately narrow plain text. Reject links, mentions and formatting.
  if (
    clean.length < 1 ||
    clean.length > max ||
    !/^[\p{L}\p{N}][\p{L}\p{N} .()'-]*$/u.test(clean)
  )
    throw new InputError("text");
  return clean;
}

export function plan(titleInput: string, teamInput: string): Plan {
  const title = text(titleInput, 40);
  const rows = teamInput.replace(/\r\n/g, "\n").trim().split("\n");
  if (rows.length < 2 || rows.length > 8) throw new InputError("count");
  const teams = rows.map((row) => text(row, 18));
  const keys = teams.map((team) => team.toLocaleLowerCase("tr"));
  if (
    new Set(keys).size !== keys.length ||
    new Set(teams.map((team) => team.toLowerCase())).size !== teams.length
  )
    throw new InputError("duplicate");
  const ring: (string | null)[] = [...teams];
  if (ring.length % 2) ring.push(null);
  const rounds: Round[] = [];
  for (let r = 0; r < ring.length - 1; r++) {
    const matches: [string, string][] = [];
    let bye: string | null = null;
    for (let i = 0; i < ring.length / 2; i++) {
      const a = ring[i];
      const b = ring[ring.length - 1 - i];
      if (a === undefined || b === undefined)
        throw new Error("Internal fixture error");
      if (a === null) bye = b;
      else if (b === null) bye = a;
      else matches.push([a, b]);
    }
    rounds.push({ matches, bye });
    const last = ring.pop();
    if (last === undefined) throw new Error("Internal rotation error");
    ring.splice(1, 0, last);
  }
  return { title, teams, rounds };
}

export function render(value: Plan, language: Language): string {
  const tr = language === "tr";
  const lines = [
    `RoundWeave · ${value.title}`,
    tr
      ? `${value.teams.length} takım · ${value.rounds.length} tur · ${(value.teams.length * (value.teams.length - 1)) / 2} maç`
      : `${value.teams.length} teams · ${value.rounds.length} rounds · ${(value.teams.length * (value.teams.length - 1)) / 2} matches`,
    tr
      ? "Her eşleşme bir kez. Sıra rastgele değildir; ev/deplasman anlamı yoktur."
      : "Each pair once. Input order is deterministic; sides do not mean home/away.",
  ];
  for (const [index, round] of value.rounds.entries()) {
    lines.push("", `${tr ? "Tur" : "Round"} ${index + 1}`);
    for (const [a, b] of round.matches) lines.push(`${a} — ${b}`);
    if (round.bye) lines.push(`${tr ? "Bay geçen" : "Bye"}: ${round.bye}`);
  }
  lines.push(
    "",
    tr
      ? "Saat, sonuç ve kayıt takibi yoktur. Paylaşmadan önce planı kontrol edin."
      : "No times, scores or signups tracked. Review the plan before sharing.",
  );
  const result = lines.join("\n");
  if (result.length > 1900) throw new InputError("length");
  return result;
}
