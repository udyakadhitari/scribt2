import {
  createCaptureHandler,
  isLogEnabled
} from "./chunk-kztccppz.js";
import {
  CallToolRequestSchema,
  JSONRPCMessageSchema,
  StitchProxy
} from "./chunk-j40tjdyc.js";
import"./chunk-spbm03bj.js";
import"./chunk-c6ge431q.js";
import"./chunk-9wyra8hs.js";

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
import process2 from "node:process";

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js
class ReadBuffer {
  append(chunk) {
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }
  readMessage() {
    if (!this._buffer) {
      return null;
    }
    const index = this._buffer.indexOf(`
`);
    if (index === -1) {
      return null;
    }
    const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    this._buffer = this._buffer.subarray(index + 1);
    return deserializeMessage(line);
  }
  clear() {
    this._buffer = undefined;
  }
}
function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
  return JSON.stringify(message) + `
`;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
class StdioServerTransport {
  constructor(_stdin = process2.stdin, _stdout = process2.stdout) {
    this._stdin = _stdin;
    this._stdout = _stdout;
    this._readBuffer = new ReadBuffer;
    this._started = false;
    this._ondata = (chunk) => {
      this._readBuffer.append(chunk);
      this.processReadBuffer();
    };
    this._onerror = (error) => {
      this.onerror?.(error);
    };
  }
  async start() {
    if (this._started) {
      throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
    }
    this._started = true;
    this._stdin.on("data", this._ondata);
    this._stdin.on("error", this._onerror);
  }
  processReadBuffer() {
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }
        this.onmessage?.(message);
      } catch (error) {
        this.onerror?.(error);
      }
    }
  }
  async close() {
    this._stdin.off("data", this._ondata);
    this._stdin.off("error", this._onerror);
    const remainingDataListeners = this._stdin.listenerCount("data");
    if (remainingDataListeners === 0) {
      this._stdin.pause();
    }
    this._readBuffer.clear();
    this.onclose?.();
  }
  send(message) {
    return new Promise((resolve) => {
      const json = serializeMessage(message);
      if (this._stdout.write(json)) {
        resolve();
      } else {
        this._stdout.once("drain", resolve);
      }
    });
  }
}

// src/commands/proxy/LoggingCallToolHandler.ts
var DEFAULT_STITCH_MCP_URL = "https://stitch.googleapis.com/mcp";
function installLoggingCallToolHandler(proxy, capture, opts) {
  const apiKey = opts?.apiKey ?? process.env.STITCH_API_KEY;
  const url = opts?.url ?? process.env.STITCH_MCP_URL ?? DEFAULT_STITCH_MCP_URL;
  if (!apiKey)
    throw new Error("logging proxy requires STITCH_API_KEY");
  const server = proxy?.server?.server;
  if (!server || typeof server.setRequestHandler !== "function") {
    throw new Error("cannot install logging handler: proxy.server.server.setRequestHandler missing");
  }
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    let result;
    try {
      result = await forwardToStitch({ apiKey, url }, name, args ?? {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result = { content: [{ type: "text", text: `Error calling ${name}: ${message}` }], isError: true };
    }
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - t0;
    try {
      await capture.capture({
        tool: name,
        args: args ?? {},
        result,
        duration_ms: durationMs,
        started_at: startedAt,
        finished_at: finishedAt
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[stitch-mcp log] capture failed: ${msg}`);
    }
    return result;
  });
}
async function forwardToStitch(opts, name, args) {
  const body = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: { name, arguments: args },
    id: Date.now()
  };
  const res = await globalThis.fetch(opts.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Goog-Api-Key": opts.apiKey
    },
    body: JSON.stringify(body)
  });
  if (!res.ok)
    throw new Error(`Stitch API error (${res.status}): ${await res.text()}`);
  const json = await res.json();
  if (json.error)
    throw new Error(`Stitch RPC error: ${json.error.message}`);
  return json.result;
}

// src/commands/proxy/handler.ts
class ProxyCommandHandler {
  createProxy;
  createTransport;
  constructor(deps) {
    this.createProxy = deps?.createProxy ?? ((opts) => new StitchProxy(opts));
    this.createTransport = deps?.createTransport ?? (() => new StdioServerTransport);
  }
  async execute(input) {
    try {
      const proxy = this.createProxy({
        apiKey: process.env.STITCH_API_KEY
      });
      const transport = this.createTransport();
      await proxy.start(transport);
      if (isLogEnabled()) {
        try {
          installLoggingCallToolHandler(proxy, createCaptureHandler());
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[stitch-mcp log] failed to install capture handler: ${msg}`);
        }
      }
      await transport.onclose;
      return { success: true, data: { status: "running" } };
    } catch (e) {
      return { success: false, error: { code: "PROXY_START_ERROR", message: e.message, recoverable: false } };
    }
  }
}
export {
  ProxyCommandHandler
};

//# debugId=4ED8EE1E3BFE8FB964756E2164756E21
