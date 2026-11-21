export interface RequestHeaders {referer?: string; userAgent?: string; authorization?: string; contentDisposition?: string; contentType?: string;}
type Entry = {headers: RequestHeaders; expiresAt: number};
export class HeaderCache {
  private entries = new Map<string, Entry>();
  constructor(private readonly ttlMs = 30_000, private readonly now = () => Date.now()) {}
  set(requestId: string, headers: RequestHeaders): void {
    this.prune();
    this.entries.set(requestId, {headers: {...headers}, expiresAt: this.now() + this.ttlMs});
  }
  get(requestId: string): RequestHeaders | undefined {
    const value = this.entries.get(requestId);
    if (!value || value.expiresAt <= this.now()) { this.entries.delete(requestId); return undefined; }
    return {...value.headers};
  }
  delete(requestId: string): void { this.entries.delete(requestId); }
  private prune(): void {
    const now = this.now();
    for (const [key, entry] of this.entries) if (entry.expiresAt <= now) this.entries.delete(key);
  }
}
