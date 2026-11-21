import {beforeEach,describe,expect,it,vi} from "vitest";
import {ConnectionManager} from "../src/transport/ConnectionManager";
import type {ITransport} from "../src/transport/ITransport";

vi.mock("wxt/browser",()=>({browser:{runtime:{getPlatformInfo:vi.fn(async()=>({os:"linux"}))},storage:{local:{get:vi.fn(async()=>({}))}}}}));

class MockTransport implements ITransport {
  connected=false;
  readonly sent: unknown[]=[];
  responseMode:"ok"|"mismatch"|"error"="ok";
  async connect():Promise<void>{this.connected=true;}
  async send(message:unknown):Promise<unknown>{
    this.sent.push(message);
    const request=message as {request_id:string;type:string};
    return {
      protocol_version:1,
      type:this.responseMode==="error"?"error":"ack",
      request_id:this.responseMode==="mismatch"?"wrong-id":request.request_id,
      timestamp:1,
      payload:this.responseMode==="error"?{code:"mock_error",message:"rejected"}:{accepted:true}
    };
  }
  disconnect():void{this.connected=false;}
}

describe("ConnectionManager mock-host contract",()=>{
  let manager:ConnectionManager;
  let transport:MockTransport;
  beforeEach(()=>{manager=new ConnectionManager();transport=new MockTransport();manager.useTransport(transport);});
  it("sends a v1 envelope and accepts the correlated ACK",async()=>{
    const response=await manager.request("handshake",{ext_version:"0.2.0",browser:"firefox",capabilities:[]});
    expect(response.type).toBe("ack");
    expect(transport.sent).toHaveLength(1);
    const request=transport.sent[0] as Record<string,unknown>;
    expect(request.protocol_version).toBe(1);
    expect(request.type).toBe("handshake");
    expect(typeof request.request_id).toBe("string");
  });
  it("rejects a response with the wrong request id",async()=>{
    transport.responseMode="mismatch";
    await expect(manager.request("task_control",{action:"pause"})).rejects.toThrow(/request_id mismatch/);
  });
  it("surfaces a host error envelope",async()=>{
    transport.responseMode="error";
    await expect(manager.request("task_control",{action:"cancel"})).rejects.toThrow("rejected");
  });
  it("splits a large batch and waits for every chunk ACK",async()=>{
    const filename="x".repeat(600*1024);
    const response=await manager.addBatch({items:[{url:"https://example.com/archive.bin",filename}],source_page:"https://example.com"});
    expect(response.payload.accepted).toBe(true);
    expect(transport.sent.length).toBeGreaterThan(1);
    for(const message of transport.sent){
      const envelope=message as {type:string;payload:Record<string,unknown>};
      expect(envelope.type).toBe("add_batch_chunk");
      expect(envelope.payload.chunk_total).toBe(transport.sent.length);
    }
  });
  it("does not silently accept a missing transport ACK",async()=>{
    const broken: ITransport={connected:true,connect:async()=>{},disconnect:()=>{},send:async()=>undefined};
    manager.useTransport(broken);
    await expect(manager.request("task_control",{action:"pause"})).rejects.toThrow();
  });
});
