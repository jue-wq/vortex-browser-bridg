import type { ITransport } from "./ITransport";

export class HttpFallbackTransport implements ITransport {
  private active = false;
  constructor(private readonly port: number, private readonly apiKey: string) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError("Invalid loopback port");
    if (apiKey.length < 32) throw new Error("Fallback API key must contain at least 32 characters");
  }
  get connected(): boolean { return this.active; }
  async connect(): Promise<void> {
    const response = await fetch(`http://127.0.0.1:${this.port}/health`, {
      headers: {"X-Vortex-Api-Key": this.apiKey}, signal: AbortSignal.timeout(1000)
    });
    if (!response.ok) throw new Error("Local fallback health check failed");
    this.active = true;
  }
  async send(message: unknown, timeoutMs = 1500): Promise<unknown> {
    if (!this.active) await this.connect();
    try {
      const response = await fetch(`http://127.0.0.1:${this.port}/ipc`, {
        method: "POST", headers: {"Content-Type": "application/json", "X-Vortex-Api-Key": this.apiKey},
        body: JSON.stringify(message), signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response.ok) throw new Error(`Local fallback returned HTTP ${response.status}`);
      return await response.json() as unknown;
    } catch (error) {
      this.active = false;
      throw error;
    }
  }
  disconnect(): void { this.active = false; }
}
