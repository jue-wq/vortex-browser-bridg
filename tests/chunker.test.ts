import {describe,expect,it} from "vitest";
import {chunkBatch} from "../src/protocol/chunker";
describe("batch chunker",()=>{
  it("emits at least one chunk and stable indices",()=>{
    const chunks=chunkBatch([{url:"https://example.com/a"}],"https://example.com","batch-1");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.chunk_index).toBe(0);
    expect(chunks[0]?.chunk_total).toBe(1);
  });
  it("rejects chunk sizes beyond the protocol cap",()=>expect(()=>chunkBatch([],"https://example.com","x",300*1024)).toThrow());
});
