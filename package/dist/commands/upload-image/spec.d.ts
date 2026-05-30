import { z } from 'zod';
export declare const UploadImageInputSchema: z.ZodObject<{
    /** The project to upload the image into. */
    projectId: z.ZodString;
    /** Absolute or relative path to the image file on disk. */
    filePath: z.ZodEffects<z.ZodString, string, string>;
    /** Optional display title for the created screen. */
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    filePath: string;
    title?: string | undefined;
}, {
    projectId: string;
    filePath: string;
    title?: string | undefined;
}>;
export type UploadImageInput = z.infer<typeof UploadImageInputSchema>;
export declare const UploadImageErrorCode: z.ZodEnum<["FILE_NOT_FOUND", "UNSUPPORTED_FORMAT", "AUTH_FAILED", "UPLOAD_FAILED", "UNKNOWN_ERROR"]>;
export type UploadImageErrorCode = z.infer<typeof UploadImageErrorCode>;
export type UploadedScreen = {
    screenId: string;
    projectId: string;
};
export type UploadImageResult = {
    success: true;
    screens: UploadedScreen[];
} | {
    success: false;
    error: {
        code: UploadImageErrorCode;
        message: string;
        recoverable: boolean;
    };
};
export interface UploadImageSpec {
    execute(input: UploadImageInput): Promise<UploadImageResult>;
}
