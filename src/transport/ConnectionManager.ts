import { browser } from "wxt/browser";
import { makeEnvelope, validateEnvelope, type OutgoingMessageType, type AddBatchPayload } from "../protocol/schema";
import { chunkBatch } from "../protocol/chunker";
import type { ITransport } from "./ITransport";
import { NativeMessagingTransport } from "./NativeMessagingTransport";
import { HttpFallbackTransport } from "./HttpFallbackTransport";

export class ConnectionManager {
  private transport:ITransport|null=null;
  private mobileConfig:string|null=null;

  private async ensureTransport():Promise<ITransport>{
    const platform=await browser.runtime.getPlatformInfo();
    if(platform.os==="android"){
      const saved=await browser.storage.local.get(["mobileBridgePort","mobileBridgeApiKey"]);
      const port=typeof saved.mobileBridgePort==="number"?saved.mobileBridgePort:0;
      const apiKey=typeof saved.mobileBridgeApiKey==="string"?saved.mobileBridgeApiKey:"";
      if(!Number.isInteger(port)||port<1||port>65535||apiKey.length<32)
        throw new Error("Android bridge is not configured. Copy the current port and session API key shown by the running VortexDM app into Bridge Settings.");
      const config=`${port}:${apiKey}`;
      if(this.transport&&this.mobileConfig===config)return this.transport;
      this.transport?.disconnect();
      this.mobileConfig=config;
      this.transport=new HttpFallbackTransport(port,apiKey);
    }else{
      if(this.transport&&this.mobileConfig===null)return this.transport;
      this.transport?.disconnect();
      this.mobileConfig=null;
      this.transport=new NativeMessagingTransport();
    }
    return this.transport;
  }

  async connect():Promise<void>{await (await this.ensureTransport()).connect();}

  async request(type:OutgoingMessageType,payload:Record<string,unknown>,timeoutMs=1500):Promise<ReturnType<typeof validateEnvelope>>{
    const outgoing=makeEnvelope(type,crypto.randomUUID(),payload);
    const incoming=validateEnvelope(await (await this.ensureTransport()).send(outgoing,timeoutMs));
    if(incoming.request_id!==outgoing.request_id)throw new Error("IPC request_id mismatch");
    if(incoming.type!=="ack"&&incoming.type!=="error")
      throw new Error(`Unexpected IPC response type: ${incoming.type}`);
    if(incoming.type==="error")throw new Error(String(incoming.payload.message??incoming.payload.code??"VortexDM rejected request"));
    if(incoming.type==="ack" && incoming.payload.accepted===false)
      throw new Error(String(incoming.payload.message??incoming.payload.code??"VortexDM did not accept the request"));
    return incoming;
  }

  async addBatch(payload:AddBatchPayload):Promise<ReturnType<typeof validateEnvelope>>{
    const size=new TextEncoder().encode(JSON.stringify(payload)).byteLength;
    if(size<=512*1024)return this.request("add_batch",payload as unknown as Record<string,unknown>);
    const chunks=chunkBatch(payload.items,payload.source_page,crypto.randomUUID(),256*1024,payload.queue_id);
    let last:ReturnType<typeof validateEnvelope>|undefined;
    for(const chunk of chunks){
      last=await this.request("add_batch_chunk",chunk as unknown as Record<string,unknown>,5000);
      if(last.payload.accepted!==true)throw new Error("VortexDM did not accept a batch chunk");
    }
    if(!last)throw new Error("Batch chunker returned no messages");
    return last;
  }

  useTransport(transport:ITransport):void{this.transport?.disconnect();this.transport=transport;this.mobileConfig=null;}
  disconnect():void{this.transport?.disconnect();}
}
