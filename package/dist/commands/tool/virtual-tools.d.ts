import { StitchMCPClient } from '../../services/mcp-client/client.js';
import type { ToolInfo } from './spec.js';
export interface VirtualTool extends ToolInfo {
    execute: (client: StitchMCPClient, args: any) => Promise<any>;
}
export declare const virtualTools: VirtualTool[];
