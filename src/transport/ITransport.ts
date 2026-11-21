export interface ITransport {
  connect(): Promise<void>;
  send(message: unknown, timeoutMs?: number): Promise<unknown>;
  disconnect(): void;
  readonly connected: boolean;
}
