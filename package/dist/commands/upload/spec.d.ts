import { z } from 'zod';
export declare const UploadInputSchema: z.ZodObject<{
    /** The project to upload the asset into. */
    projectId: z.ZodString;
    /** Absolute or relative path to the asset file on disk. */
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
export type UploadInput = z.infer<typeof UploadInputSchema>;
export declare const UploadErrorCode: z.ZodEnum<["FILE_NOT_FOUND", "UNSUPPORTED_FORMAT", "AUTH_FAILED", "UPLOAD_FAILED", "UNKNOWN_ERROR"]>;
export type UploadErrorCode = z.infer<typeof UploadErrorCode>;
export type UploadedScreen = {
    screenId: string;
    projectId: string;
};
export type UploadResult = {
    success: true;
    screens: UploadedScreen[];
} | {
    success: false;
    error: {
        code: UploadErrorCode;
        message: string;
        recoverable: boolean;
    };
};
export interface UploadSpec {
    execute(input: UploadInput): Promise<UploadResult>;
}
