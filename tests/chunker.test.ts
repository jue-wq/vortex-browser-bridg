import {describe,expect,it} from "vitest";
import {chunkBatch,ChunkAssembler} from "../src/protocol/chunker";

describe("batch chunker",()=>{
  it("emits at least one chunk and stable indices",()=>{
    const chunks=chunkBatch([{url:"https://example.com/a"}],"https://example.com","batch-1");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.chunk_index).toBe(0);
    expect(chunks[0]?.chunk_total).toBe(1);
  });
  it("rejects chunk sizes beyond the protocol cap",()=>expect(()=>chunkBatch([],"https://example.com","x",300*1024)).toThrow());
  it("round trips a 2 MiB batch when chunks arrive out of order",()=>{
    const largeText="vortex-data-".repeat(180_000);
    const original={items:[{url:"https://example.com/archive.bin",filename:largeText}],source_page:"https://example.com",queue_id:"night"};
    const chunks=chunkBatch(original.items,original.source_page,"large-test",128*1024,original.queue_id);
    expect(chunks.length).toBeGreaterThan(2);
    const assembler=new ChunkAssembler();
    let result:Uint8Array|null=null;
    for(const chunk of [...chunks].reverse())result=assembler.add(chunk)??result;
    expect(result).not.toBeNull();
    expect(JSON.parse(new TextDecoder().decode(result!))).toEqual(original);
    expect(assembler.pendingCount).toBe(0);
  });
  it("rejects duplicate chunks",()=>{
    const [first]=chunkBatch([{url:"https://example.com/a"}],"https://example.com","dup");
    if(!first)throw new Error("expected a chunk");
    const assembler=new ChunkAssembler();
    assembler.add({...first,chunk_total:2});
    expect(()=>assembler.add({...first,chunk_total:2})).toThrow(/Duplicate/);
  });
});
