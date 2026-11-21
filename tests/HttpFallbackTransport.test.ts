import {afterEach,describe,expect,it,vi} from "vitest";
import {HttpFallbackTransport} from "../src/transport/HttpFallbackTransport";

afterEach(()=>vi.unstubAllGlobals());

describe("Android loopback transport",()=>{
  it("validates port and one-time key",()=>{
    expect(()=>new HttpFallbackTransport(0,"x".repeat(32))).toThrow(/port/i);
    expect(()=>new HttpFallbackTransport(17321,"short")).toThrow(/key/i);
  });
  it("authenticates health check and sends IPC over loopback only",async()=>{
    const fetchMock=vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ok:true}),{status:200}))
      .mockResolvedValueOnce(new Response(JSON.stringify({protocol_version:1,request_id:"r",timestamp:1,type:"ack",payload:{accepted:true}}),{status:200}));
    vi.stubGlobal("fetch",fetchMock);
    const transport=new HttpFallbackTransport(18432,"k".repeat(64));
    await transport.connect();
    const response=await transport.send({request_id:"r",type:"handshake"});
    expect((response as {type:string}).type).toBe("ack");
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:18432/health");
    expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:18432/ipc");
    expect(fetchMock.mock.calls[1][1].headers["X-Vortex-Api-Key"]).toBe("k".repeat(64));
  });
  it("clears connected state after server failure so next request reconnects",async()=>{
    const fetchMock=vi.fn()
      .mockResolvedValueOnce(new Response("{}",{status:200}))
      .mockRejectedValueOnce(new Error("connection reset"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ok:true}),{status:200}))
      .mockResolvedValueOnce(new Response(JSON.stringify({protocol_version:1,request_id:"r2",timestamp:1,type:"ack",payload:{accepted:true}}),{status:200}));
    vi.stubGlobal("fetch",fetchMock);
    const transport=new HttpFallbackTransport(18432,"k".repeat(64));
    await transport.connect();
    await expect(transport.send({request_id:"r1"})).rejects.toThrow("connection reset");
    expect(transport.connected).toBe(false);
    await transport.send({request_id:"r2"});
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it("rejects failed health checks",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response("{}",{status:401})));
    const transport=new HttpFallbackTransport(18432,"k".repeat(64));
    await expect(transport.connect()).rejects.toThrow(/health/i);
    expect(transport.connected).toBe(false);
  });
});
