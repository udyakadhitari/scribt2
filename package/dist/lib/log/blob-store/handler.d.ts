import type { BlobStoreSpec, PutResult, HasResult, GetResult } from './spec.js';
export declare class BlobStoreHandler implements BlobStoreSpec {
    private readonly root;
    constructor(root: string);
    put(buffer: Buffer, mime: string): Promise<PutResult>;
    private findBySha;
    fetch(url: string, mimeHint?: string): Promise<PutResult>;
    has(sha256: string): Promise<HasResult>;
    get(sha256: string): Promise<GetResult>;
}
