import { type CaptureDeps, type CaptureInput, type CaptureResult, type CaptureSpec } from './spec.js';
export declare class CaptureHandler implements CaptureSpec {
    private readonly blobs;
    private readonly append;
    private readonly now;
    private readonly newId;
    constructor(deps: CaptureDeps);
    capture(input: CaptureInput): Promise<CaptureResult>;
    private fail;
}
