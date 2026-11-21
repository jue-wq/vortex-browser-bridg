export interface BatchChunk {
  chunk_id: string;
  chunk_index: number;
  chunk_total: number;
  chunk_data: string;
}

export class ChunkAssembler {
  private readonly assemblies = new Map<string, {
    total: number; parts: Array<Uint8Array | undefined>; received: number; bytes: number; updatedAt: number;
  }>();

  constructor(
    private readonly ttlMs = 30_000,
    private readonly maxPending = 8,
    private readonly maxBytes = 32 * 1024 * 1024,
    private readonly now = () => Date.now()
  ) {}

  add(chunk: BatchChunk): Uint8Array | null {
    this.expire();
    if (!chunk.chunk_id || chunk.chunk_id.length > 128 ||
        !Number.isInteger(chunk.chunk_total) || chunk.chunk_total < 1 || chunk.chunk_total > 128 ||
        !Number.isInteger(chunk.chunk_index) || chunk.chunk_index < 0 || chunk.chunk_index >= chunk.chunk_total) {
      throw new Error("Invalid batch chunk metadata");
    }
    let assembly = this.assemblies.get(chunk.chunk_id);
    if (!assembly) {
      if (this.assemblies.size >= this.maxPending) throw new Error("Too many pending batch assemblies");
      assembly = {total:chunk.chunk_total,parts:new Array<Uint8Array | undefined>(chunk.chunk_total),received:0,bytes:0,updatedAt:this.now()};
      this.assemblies.set(chunk.chunk_id,assembly);
    }
    if (assembly.total !== chunk.chunk_total || assembly.parts[chunk.chunk_index] !== undefined) {
      this.assemblies.delete(chunk.chunk_id);
      throw new Error("Duplicate chunk or inconsistent chunk_total");
    }
    let binary:string;
    try { binary=atob(chunk.chunk_data); }
    catch { this.assemblies.delete(chunk.chunk_id); throw new Error("Invalid base64 chunk payload"); }
    if (!binary.length || binary.length > 256*1024 || binary.length > this.maxBytes-assembly.bytes) {
      this.assemblies.delete(chunk.chunk_id);
      throw new Error("Decoded chunk exceeds configured size limit");
    }
    const bytes=new Uint8Array(binary.length);
    for(let index=0;index<binary.length;index+=1) bytes[index]=binary.charCodeAt(index);
    assembly.parts[chunk.chunk_index]=bytes;
    assembly.received+=1;
    assembly.bytes+=bytes.length;
    assembly.updatedAt=this.now();
    if(assembly.received!==assembly.total)return null;
    const complete=new Uint8Array(assembly.bytes);
    let offset=0;
    for(const part of assembly.parts){
      if(!part)throw new Error("Batch assembly has a missing chunk");
      complete.set(part,offset);offset+=part.length;
    }
    this.assemblies.delete(chunk.chunk_id);
    return complete;
  }

  expire():void {
    const current=this.now();
    for(const [key,value] of this.assemblies)if(current-value.updatedAt>this.ttlMs)this.assemblies.delete(key);
  }
  get pendingCount():number{return this.assemblies.size;}
}

function toBase64(bytes:Uint8Array):string {
  let binary="";
  for(let offset=0;offset<bytes.length;offset+=0x8000){
    binary+=String.fromCharCode(...bytes.subarray(offset,Math.min(offset+0x8000,bytes.length)));
  }
  return btoa(binary);
}

export function chunkBatch(items:unknown[],sourcePage:string,chunkId:string,maxBytes=256*1024,queueId?:string):BatchChunk[] {
  if(!Number.isInteger(maxBytes)||maxBytes<1024||maxBytes>256*1024)throw new RangeError("maxBytes must be between 1 KiB and 256 KiB");
  const payload={items,source_page:sourcePage,...(queueId?{queue_id:queueId}:{})};
  const serialized=new TextEncoder().encode(JSON.stringify(payload));
  const parts:Uint8Array[]=[];
  for(let offset=0;offset<serialized.length;offset+=maxBytes)parts.push(serialized.slice(offset,Math.min(offset+maxBytes,serialized.length)));
  const total=Math.max(parts.length,1);
  return parts.map((part,index)=>({chunk_id:chunkId,chunk_index:index,chunk_total:total,chunk_data:toBase64(part)}));
}
