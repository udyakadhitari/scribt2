import type { UploadInput, UploadResult, UploadSpec, UploadedScreen } from './spec.js';
/**
 * The upload function injected into the handler.
 * In production this calls project.upload() via the SDK.
 * In tests this is a mock.
 */
export type UploadFn = (projectId: string, filePath: string, title: string | undefined) => Promise<UploadedScreen[]>;
export interface UploadHandlerDeps {
    upload: UploadFn;
}
/**
 * Implements UploadSpec.
 * Never throws — all failures are returned as typed Result values.
 * Receives the upload function as a dependency so it can be tested in isolation.
 */
export declare class UploadHandler implements UploadSpec {
    private readonly upload;
    constructor(deps: UploadHandlerDeps);
    execute(input: UploadInput): Promise<UploadResult>;
}
