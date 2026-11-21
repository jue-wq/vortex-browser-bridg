import { makeEnvelope, validateEnvelope, type OutgoingMessageType } from "../protocol/schema";
import type { ITransport } from "./ITransport";
import { NativeMessagingTransport } from "./NativeMessagingTransport";

export class ConnectionManager {
  private transport: ITransport = new NativeMessagingTransport();
  async connect(): Promise<void> { await this.transport.connect(); }
  async request(type: OutgoingMessageType, payload: Record<string, unknown>, timeoutMs = 1500): Promise<ReturnType<typeof validateEnvelope>> {
    const requestId = crypto.randomUUID();
    const outgoing = makeEnvelope(type, requestId, payload);
    const incoming = validateEnvelope(await this.transport.send(outgoing, timeoutMs));
    if (incoming.request_id !== requestId) throw new Error("IPC request_id mismatch");
    if (incoming.type === "error") throw new Error(String(incoming.payload.message ?? "VortexDM rejected request"));
    return incoming;
  }
  useTransport(transport: ITransport): void {
    this.transport.disconnect();
    this.transport = transport;
  }
  disconnect(): void { this.transport.disconnect(); }
}
