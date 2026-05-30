import type { CaptureSpec } from '../../lib/log/capture/spec.js';
interface ForwardOptions {
    apiKey: string;
    url: string;
}
/**
 * Replace the SDK proxy's tools/call handler with a capture-wrapped variant.
 * Must be called AFTER {@link StitchProxy.start} (which registers the original).
 */
export declare function installLoggingCallToolHandler(proxy: any, capture: CaptureSpec, opts?: Partial<ForwardOptions>): void;
export {};
