import { z } from 'zod';
export declare const Sha256Schema: z.ZodString;
export declare const MimeSchema: z.ZodString;
export declare const BlobRefSchema: z.ZodObject<{
    sha256: z.ZodString;
    size: z.ZodNumber;
    mime: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sha256: string;
    size: number;
    mime: string;
}, {
    sha256: string;
    size: number;
    mime: string;
}>;
export type BlobRef = z.infer<typeof BlobRefSchema>;
export declare const BlobStoreErrorCodeSchema: z.ZodEnum<["BLOB_FETCH_NETWORK", "BLOB_FETCH_HTTP_ERROR", "BLOB_WRITE_FAILED", "BLOB_READ_FAILED", "BLOB_INVALID_INPUT"]>;
export type BlobStoreErrorCode = z.infer<typeof BlobStoreErrorCodeSchema>;
export declare const BlobStoreErrorSchema: z.ZodObject<{
    code: z.ZodEnum<["BLOB_FETCH_NETWORK", "BLOB_FETCH_HTTP_ERROR", "BLOB_WRITE_FAILED", "BLOB_READ_FAILED", "BLOB_INVALID_INPUT"]>;
    message: z.ZodString;
    suggestion: z.ZodOptional<z.ZodString>;
    recoverable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
    message: string;
    recoverable: boolean;
    suggestion?: string | undefined;
}, {
    code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
    message: string;
    recoverable: boolean;
    suggestion?: string | undefined;
}>;
export type BlobStoreError = z.infer<typeof BlobStoreErrorSchema>;
export declare const PutSuccessSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: {
        sha256: string;
        size: number;
        mime: string;
    };
}, {
    success: true;
    data: {
        sha256: string;
        size: number;
        mime: string;
    };
}>;
export declare const PutResultSchema: z.ZodUnion<[z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: {
        sha256: string;
        size: number;
        mime: string;
    };
}, {
    success: true;
    data: {
        sha256: string;
        size: number;
        mime: string;
    };
}>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodEnum<["BLOB_FETCH_NETWORK", "BLOB_FETCH_HTTP_ERROR", "BLOB_WRITE_FAILED", "BLOB_READ_FAILED", "BLOB_INVALID_INPUT"]>;
        message: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        recoverable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    }, {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    };
}, {
    success: false;
    error: {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    };
}>]>;
export type PutResult = z.infer<typeof PutResultSchema>;
export declare const HasSuccessSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: boolean;
}, {
    success: true;
    data: boolean;
}>;
export declare const HasResultSchema: z.ZodUnion<[z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: boolean;
}, {
    success: true;
    data: boolean;
}>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodEnum<["BLOB_FETCH_NETWORK", "BLOB_FETCH_HTTP_ERROR", "BLOB_WRITE_FAILED", "BLOB_READ_FAILED", "BLOB_INVALID_INPUT"]>;
        message: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        recoverable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    }, {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    };
}, {
    success: false;
    error: {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    };
}>]>;
export type HasResult = z.infer<typeof HasResultSchema>;
export declare const GetSuccessSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodNullable<z.ZodType<Buffer<ArrayBufferLike>, z.ZodTypeDef, Buffer<ArrayBufferLike>>>;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: Buffer<ArrayBufferLike> | null;
}, {
    success: true;
    data: Buffer<ArrayBufferLike> | null;
}>;
export declare const GetResultSchema: z.ZodUnion<[z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodNullable<z.ZodType<Buffer<ArrayBufferLike>, z.ZodTypeDef, Buffer<ArrayBufferLike>>>;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: Buffer<ArrayBufferLike> | null;
}, {
    success: true;
    data: Buffer<ArrayBufferLike> | null;
}>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodEnum<["BLOB_FETCH_NETWORK", "BLOB_FETCH_HTTP_ERROR", "BLOB_WRITE_FAILED", "BLOB_READ_FAILED", "BLOB_INVALID_INPUT"]>;
        message: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        recoverable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    }, {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    };
}, {
    success: false;
    error: {
        code: "BLOB_FETCH_NETWORK" | "BLOB_FETCH_HTTP_ERROR" | "BLOB_WRITE_FAILED" | "BLOB_READ_FAILED" | "BLOB_INVALID_INPUT";
        message: string;
        recoverable: boolean;
        suggestion?: string | undefined;
    };
}>]>;
export type GetResult = z.infer<typeof GetResultSchema>;
export interface BlobStoreSpec {
    /** Hash, dedupe, and persist a buffer. Returns a content-addressed BlobRef. */
    put(buffer: Buffer, mime: string): Promise<PutResult>;
    /** Fetch a URL (following redirects) and persist the bytes. */
    fetch(url: string, mimeHint?: string): Promise<PutResult>;
    /** Cheap existence check by sha256. */
    has(sha256: string): Promise<HasResult>;
    /** Read bytes by sha256. data === null when absent. */
    get(sha256: string): Promise<GetResult>;
}
