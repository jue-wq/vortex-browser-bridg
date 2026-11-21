import { browser } from "wxt/browser";
import type { ITransport } from "./ITransport";

type Pending = {resolve: (value: unknown) => void; reject: (reason: Error) => void; timer: ReturnType<typeof setTimeout>};

export class NativeMessagingTransport implements ITransport {
  private port: ReturnType<typeof browser.runtime.connectNative> | null = null;
  private pending = new Map<string, Pending>();
  get connected(): boolean { return this.port !== null; }

  async connect(): Promise<void> {
    if (this.port) return;
    this.port = browser.runtime.connectNative("com.vortexdm.native_host");
    this.port.onMessage.addListener((message: unknown) => {
      if (!message || typeof message !== "object" || !("request_id" in message)) return;
      const id = String((message as {request_id: unknown}).request_id);
      const pending = this.pending.get(id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(id);
      pending.resolve(message);
    });
    this.port.onDisconnect.addListener(() => {
      const error = new Error("Native Messaging host disconnected");
      for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
      this.pending.clear();
      this.port = null;
    });
  }

  async send(message: unknown, timeoutMs = 1500): Promise<unknown> {
    if (!this.port) await this.connect();
    if (!this.port) throw new Error("Native Messaging port unavailable");
    const requestId = (message as {request_id?: unknown}).request_id;
    if (typeof requestId !== "string" || requestId.length === 0) throw new Error("Message request_id is required");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("Native Messaging acknowledgement timed out"));
      }, timeoutMs);
      this.pending.set(requestId, {resolve, reject, timer});
      try { this.port?.postMessage(message); }
      catch (error) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(error instanceof Error ? error : new Error("Native Messaging send failed"));
      }
    });
  }

  disconnect(): void {
    this.port?.disconnect();
    this.port = null;
  }
}
