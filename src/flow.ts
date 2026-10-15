import { randomBytes } from "node:crypto";
import { InputError, type Language, plan, render } from "./plan.js";

export const TTL = 5 * 60_000;
export const FORM_DELAY = 5_000;
export const SHARE_DELAY = 60_000;
export interface Scope {
  user: string;
  guild: string;
  channel: string;
}
export interface Port {
  scope: Scope;
  language: Language;
  message: string | null;
  access(): Promise<boolean>;
  modal(id: string): Promise<void>;
  defer(): Promise<void>;
  preview(content: string, id: string): Promise<string>;
  notice(code: Notice): Promise<void>;
  clear(code: Notice): Promise<void>;
  publish(content: string, nonce: string): Promise<void>;
}
export type Notice =
  | "denied"
  | "expired"
  | "busy"
  | "invalid"
  | "discarded"
  | "shared"
  | "failed";
interface Draft {
  scope: Scope;
  language: Language;
  expires: number;
  stage: "form" | "preview";
  content: string | null;
  message: string | null;
}
function same(a: Scope, b: Scope): boolean {
  return a.user === b.user && a.guild === b.guild && a.channel === b.channel;
}
export class Flow {
  private readonly drafts = new Map<string, Draft>();
  private readonly members = new Map<string, number>();
  private readonly channels = new Map<string, number>();
  constructor(
    private readonly now = Date.now,
    private readonly token = () => randomBytes(16).toString("hex"),
  ) {}
  private prune(): void {
    const now = this.now();
    for (const [id, draft] of this.drafts)
      if (draft.expires <= now) this.drafts.delete(id);
    for (const map of [this.members, this.channels])
      for (const [key, until] of map) if (until <= now) map.delete(key);
  }
  async open(port: Port): Promise<void> {
    this.prune();
    if (!(await port.access())) {
      await port.notice("denied");
      return;
    }
    const key = `${port.scope.guild}:${port.scope.user}`;
    if (
      this.members.has(key) ||
      this.drafts.size >= 100 ||
      this.members.size >= 1000
    ) {
      await port.notice("busy");
      return;
    }
    this.members.set(key, this.now() + FORM_DELAY);
    const id = this.token();
    this.drafts.set(id, {
      scope: { ...port.scope },
      language: port.language,
      expires: this.now() + TTL,
      stage: "form",
      content: null,
      message: null,
    });
    try {
      await port.modal(id);
    } catch {
      this.drafts.delete(id);
      throw new Error("Modal delivery failed");
    }
  }
  private take(id: string, port: Port, stage: Draft["stage"]): Draft | null {
    this.prune();
    const draft = this.drafts.get(id);
    if (
      !draft ||
      draft.stage !== stage ||
      !same(draft.scope, port.scope) ||
      (stage === "preview" &&
        (draft.message === null || draft.message !== port.message))
    )
      return null;
    this.drafts.delete(id);
    return draft;
  }
  async submit(
    id: string,
    title: string,
    teams: string,
    port: Port,
  ): Promise<void> {
    const draft = this.take(id, port, "form");
    if (!draft) {
      await port.notice("expired");
      return;
    }
    port.language = draft.language;
    await port.defer();
    if (!(await port.access())) {
      await port.notice("denied");
      return;
    }
    let content: string;
    try {
      content = render(plan(title, teams), draft.language);
    } catch (error) {
      if (!(error instanceof InputError)) throw error;
      await port.notice("invalid");
      return;
    }
    if (this.drafts.size >= 100) {
      await port.notice("busy");
      return;
    }
    const next = this.token();
    const pending: Draft = {
      ...draft,
      stage: "preview",
      expires: this.now() + TTL,
      content,
      message: null,
    };
    this.drafts.set(next, pending);
    try {
      const message = await port.preview(content, next);
      if (this.drafts.get(next) === pending) {
        pending.message = message;
        pending.expires = this.now() + TTL;
      }
    } catch {
      this.drafts.delete(next);
      throw new Error("Preview delivery failed");
    }
  }
  async click(
    id: string,
    action: "share" | "discard",
    port: Port,
  ): Promise<void> {
    const draft = this.take(id, port, "preview");
    if (!draft) {
      await port.notice("expired");
      return;
    }
    port.language = draft.language;
    await port.defer();
    if (action === "discard") {
      await port.clear("discarded");
      return;
    }
    if (!(await port.access())) {
      await port.clear("denied");
      return;
    }
    const key = `${port.scope.guild}:${port.scope.channel}`;
    this.prune();
    if (this.channels.has(key) || this.channels.size >= 1000) {
      await port.clear("busy");
      return;
    }
    this.channels.set(key, this.now() + SHARE_DELAY);
    // Consumed before any network operation; ambiguous failures are never retried.
    try {
      if (draft.content === null) throw new Error("Missing content");
      await port.publish(draft.content, id.slice(0, 24));
    } catch {
      await port.clear("failed");
      return;
    }
    await port.clear("shared");
  }
  sweep(): void {
    this.prune();
  }
  get size(): number {
    this.prune();
    return this.drafts.size;
  }
}
