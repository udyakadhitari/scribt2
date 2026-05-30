import type { CaptureSpec } from './capture/spec.js';
export declare const DEFAULT_LOG_ROOT = ".stitch-mcp/log";
export declare function isLogEnabled(): boolean;
export declare function createCaptureHandler(root?: string): CaptureSpec;
