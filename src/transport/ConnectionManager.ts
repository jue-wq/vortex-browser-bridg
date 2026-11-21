import { browser } from "wxt/browser";
import { makeEnvelope, validateEnvelope, type OutgoingMessageType } from "../protocol/schema";
import type { ITransport } from "./ITransport";
import { NativeMessagingTransport } from "./NativeMessagingTransport";
import { HttpFallbackTransport } from "./HttpFallbackTransport";

export class ConnectionManager {
  private transport: ITransport | null = null;

  private async ensureTransport(): Promise<ITransport> {
    if (this.transport) return this.transport;
    const platform = await browser.runtime.getPlatformInfo();
    if (platform.os === "android") {
      const saved = await browser.storage.local.get(["mobileBridgePort","mobileBridgeApiKey"]);
      const port = typeof saved.mobileBridgePort === "number" ? saved.mobileBridgePort : 17321;
      const apiKey = typeof saved.mobileBridgeApiKey === "string" ? saved.mobileBridgeApiKey : "";
      if (apiKey.length < 32) throw new Error("Android bridge is not configured. Enable the VortexDM local bridge and enter its one-time API key in Settings.");
      this.transport = new HttpFallbackTransport(port,apiKey);
    } else {
      this.transport = new NativeMessagingTransport();
    }
    return this.transport;
  }

  async connect(): Promise<void> {
    const transport = await this.ensureTransport();
    await transport.connect();
  }

  async request(type:OutgoingMessageType,payload:Record<string,unknown>,timeoutMs=1500):Promise<ReturnType<typeof validateEnvelope>> {
    const transport = await this.ensureTransport();
    const requestId = crypto.randomUUID();
    const outgoing = makeEnvelope(type,requestId,payload);
    const incoming = validateEnvelope(await transport.send(outgoing,timeoutMs));
    if(incoming.request_id!==requestId) throw new Error("IPC request_id mismatch");
    if(incoming.type==="error") throw new Error(String(incoming.payload.message ?? "VortexDM rejected request"));
    return incoming;
  }

  useTransport(transport:ITransport):void {
    this.transport?.disconnect();
    this.transport=transport;
  }
  disconnect():void {this.transport?.disconnect();}
}
