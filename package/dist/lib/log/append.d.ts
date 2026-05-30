export type AppendResult = {
    success: true;
} | {
    success: false;
    error: {
        code: 'EVENT_VALIDATION_FAILED' | 'EVENT_WRITE_FAILED';
        message: string;
        recoverable: boolean;
    };
};
/** Validate envelope shape and append exactly one JSON line, ending in `\n`. */
export declare function appendEvent(eventsPath: string, event: unknown): Promise<AppendResult>;
