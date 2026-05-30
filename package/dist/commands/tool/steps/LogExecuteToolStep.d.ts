import type { CommandStep, StepResult } from '../../../framework/CommandStep.js';
import type { CaptureSpec } from '../../../lib/log/capture/spec.js';
import type { ToolContext } from '../context.js';
/**
 * Execute step variant that captures the raw MCP envelope before parsing.
 * Used in place of {@link ExecuteToolStep} when STITCH_MCP_LOG=1.
 *
 * Reaches through the {@link StitchToolClient} into its underlying MCP `Client`
 * so the raw {@link CallToolResult} is observable (the public callTool() throws
 * on isError, losing the envelope).
 */
export declare class LogExecuteToolStep implements CommandStep<ToolContext> {
    private readonly capture;
    id: string;
    name: string;
    constructor(capture: CaptureSpec);
    shouldRun(context: ToolContext): Promise<boolean>;
    run(context: ToolContext): Promise<StepResult>;
}
