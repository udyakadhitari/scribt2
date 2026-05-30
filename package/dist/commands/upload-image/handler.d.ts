import type { UploadImageInput, UploadImageResult, UploadImageSpec, UploadedScreen } from './spec.js';
/**
 * The uploadImage function injected into the handler.
 * In production this calls project.uploadImage() via the SDK.
 * In tests this is a mock.
 */
export type UploadImageFn = (projectId: string, filePath: string, title: string | undefined) => Promise<UploadedScreen[]>;
export interface UploadImageHandlerDeps {
    uploadImage: UploadImageFn;
}
/**
 * Implements UploadImageSpec.
 * Never throws — all failures are returned as typed Result values.
 * Receives the uploadImage function as a dependency so it can be tested in isolation.
 */
export declare class UploadImageHandler implements UploadImageSpec {
    private readonly uploadImage;
    constructor(deps: UploadImageHandlerDeps);
    execute(input: UploadImageInput): Promise<UploadImageResult>;
}
