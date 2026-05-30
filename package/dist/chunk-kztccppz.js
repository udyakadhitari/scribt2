import {
  exports_external
} from "./chunk-c6ge431q.js";

// src/lib/log/factory.ts
import { join as join2 } from "node:path";

// src/lib/log/append.ts
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
var EnvelopeSchema = exports_external.object({
  id: exports_external.string().min(1),
  time: exports_external.string().min(1),
  trace_id: exports_external.string().min(1),
  schema_version: exports_external.literal(1),
  type: exports_external.string().min(1),
  payload: exports_external.unknown()
});
async function appendEvent(eventsPath, event) {
  const parsed = EnvelopeSchema.safeParse(event);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "EVENT_VALIDATION_FAILED",
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        recoverable: false
      }
    };
  }
  try {
    await mkdir(dirname(eventsPath), { recursive: true });
    await appendFile(eventsPath, JSON.stringify(parsed.data) + `
`, "utf8");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: {
        code: "EVENT_WRITE_FAILED",
        message: e instanceof Error ? e.message : String(e),
        recoverable: false
      }
    };
  }
}

// src/lib/log/blob-store/handler.ts
import { createHash } from "node:crypto";
import { mkdir as mkdir2, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname as dirname2, join } from "node:path";
var EXT_BY_MIME = {
  "application/json": "json",
  "text/html": "html",
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg"
};
function extForMime(mime) {
  return EXT_BY_MIME[mime] ?? "bin";
}

class BlobStoreHandler {
  root;
  constructor(root) {
    this.root = root;
  }
  async put(buffer, mime) {
    try {
      const sha256 = createHash("sha256").update(buffer).digest("hex");
      const existing = await this.findBySha(sha256);
      if (existing) {
        const s = await stat(existing);
        return { success: true, data: { sha256, size: s.size, mime } };
      }
      const path = join(this.root, sha256.slice(0, 2), `${sha256}.${extForMime(mime)}`);
      await mkdir2(dirname2(path), { recursive: true });
      await writeFile(path, buffer);
      return { success: true, data: { sha256, size: buffer.length, mime } };
    } catch (e) {
      return {
        success: false,
        error: {
          code: "BLOB_WRITE_FAILED",
          message: e instanceof Error ? e.message : String(e),
          recoverable: false
        }
      };
    }
  }
  async findBySha(sha256) {
    const dir = join(this.root, sha256.slice(0, 2));
    let entries;
    try {
      entries = await readdir(dir);
    } catch {
      return null;
    }
    const match = entries.find((e) => e.startsWith(`${sha256}.`));
    return match ? join(dir, match) : null;
  }
  async fetch(url, mimeHint) {
    let response;
    try {
      response = await globalThis.fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "stitch-mcp-log/0.1 (Mozilla/5.0)" }
      });
    } catch (e) {
      return {
        success: false,
        error: {
          code: "BLOB_FETCH_NETWORK",
          message: e instanceof Error ? e.message : String(e),
          recoverable: true
        }
      };
    }
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: "BLOB_FETCH_HTTP_ERROR",
          message: `HTTP ${response.status} for ${url}`,
          recoverable: false
        }
      };
    }
    const mime = (response.headers.get("content-type") ?? mimeHint ?? "application/octet-stream").split(";")[0].trim();
    const buffer = Buffer.from(await response.arrayBuffer());
    return this.put(buffer, mime);
  }
  async has(sha256) {
    const path = await this.findBySha(sha256);
    return { success: true, data: path != null };
  }
  async get(sha256) {
    const path = await this.findBySha(sha256);
    if (!path)
      return { success: true, data: null };
    const buf = await readFile(path);
    return { success: true, data: buf };
  }
}

// src/lib/log/capture/handler.ts
import { randomUUID } from "node:crypto";

// src/lib/log/blob-store/spec.ts
var Sha256Schema = exports_external.string().regex(/^[0-9a-f]{64}$/, "must be 64-char lowercase hex");
var MimeSchema = exports_external.string().min(1);
var BlobRefSchema = exports_external.object({
  sha256: Sha256Schema,
  size: exports_external.number().int().nonnegative(),
  mime: MimeSchema
});
var BlobStoreErrorCodeSchema = exports_external.enum([
  "BLOB_FETCH_NETWORK",
  "BLOB_FETCH_HTTP_ERROR",
  "BLOB_WRITE_FAILED",
  "BLOB_READ_FAILED",
  "BLOB_INVALID_INPUT"
]);
var BlobStoreErrorSchema = exports_external.object({
  code: BlobStoreErrorCodeSchema,
  message: exports_external.string(),
  suggestion: exports_external.string().optional(),
  recoverable: exports_external.boolean()
});
var FailureSchema = exports_external.object({
  success: exports_external.literal(false),
  error: BlobStoreErrorSchema
});
var PutSuccessSchema = exports_external.object({
  success: exports_external.literal(true),
  data: BlobRefSchema
});
var PutResultSchema = exports_external.union([PutSuccessSchema, FailureSchema]);
var HasSuccessSchema = exports_external.object({
  success: exports_external.literal(true),
  data: exports_external.boolean()
});
var HasResultSchema = exports_external.union([HasSuccessSchema, FailureSchema]);
var GetSuccessSchema = exports_external.object({
  success: exports_external.literal(true),
  data: exports_external.instanceof(Buffer).nullable()
});
var GetResultSchema = exports_external.union([GetSuccessSchema, FailureSchema]);

// src/lib/log/capture/spec.ts
var GENERATIVE_TOOLS = new Set([
  "generate_screen_from_text",
  "edit_screens",
  "generate_variants"
]);
var READ_TOOLS = new Set([
  "get_screen",
  "list_screens",
  "list_projects",
  "get_project",
  "create_project"
]);
function kindOf(tool) {
  if (GENERATIVE_TOOLS.has(tool))
    return "generative";
  if (READ_TOOLS.has(tool))
    return "read";
  return "unknown";
}
var ProducedScreenSchema = exports_external.object({
  project_id: exports_external.string(),
  screen_id: exports_external.string(),
  name: exports_external.string(),
  parent_screen_id: exports_external.string().nullable(),
  sibling_screen_ids: exports_external.array(exports_external.string()),
  effective_prompt: exports_external.string(),
  html_blob: BlobRefSchema.nullable(),
  screenshot_blob: BlobRefSchema.nullable(),
  theme_blob: BlobRefSchema.nullable(),
  design_system_blob: BlobRefSchema.nullable()
});
var RequestedPayloadSchema = exports_external.object({
  tool: exports_external.string(),
  project_id: exports_external.string().optional(),
  selected_screen_ids: exports_external.array(exports_external.string()).optional(),
  user_prompt: exports_external.string().optional(),
  variant_options: exports_external.record(exports_external.string(), exports_external.unknown()).optional(),
  device_type: exports_external.string().optional(),
  model_id: exports_external.string().optional(),
  args_blob: BlobRefSchema
});
var CompletedGenerativePayloadSchema = exports_external.object({
  tool: exports_external.string(),
  duration_ms: exports_external.number().int().nonnegative(),
  kind: exports_external.literal("generative"),
  stitch_session_id: exports_external.string().optional(),
  structured_content_blob: BlobRefSchema,
  produced_screens: exports_external.array(ProducedScreenSchema)
});
var CompletedReadPayloadSchema = exports_external.object({
  tool: exports_external.string(),
  duration_ms: exports_external.number().int().nonnegative(),
  kind: exports_external.literal("read"),
  project_id: exports_external.string().optional(),
  screen_ids: exports_external.array(exports_external.string()).optional(),
  returned_project_ids: exports_external.array(exports_external.string()).optional(),
  returned_screen_ids: exports_external.array(exports_external.string()).optional(),
  result_blob: BlobRefSchema
});
var CompletedUnknownPayloadSchema = exports_external.object({
  tool: exports_external.string(),
  duration_ms: exports_external.number().int().nonnegative(),
  kind: exports_external.literal("unknown"),
  project_id: exports_external.string().optional(),
  result_blob: BlobRefSchema
});
var CompletedPayloadSchema = exports_external.discriminatedUnion("kind", [
  CompletedGenerativePayloadSchema,
  CompletedReadPayloadSchema,
  CompletedUnknownPayloadSchema
]);
var FailedPayloadSchema = exports_external.object({
  tool: exports_external.string(),
  duration_ms: exports_external.number().int().nonnegative(),
  is_error: exports_external.union([exports_external.literal(true), exports_external.literal("empty")]),
  error_text: exports_external.string().optional(),
  raw_blob: BlobRefSchema.optional()
});
var baseEnvelope = {
  id: exports_external.string().min(1),
  time: exports_external.string().min(1),
  trace_id: exports_external.string().min(1),
  schema_version: exports_external.literal(1)
};
var EventSchema = exports_external.discriminatedUnion("type", [
  exports_external.object({ ...baseEnvelope, type: exports_external.literal("call.requested"), payload: RequestedPayloadSchema }),
  exports_external.object({ ...baseEnvelope, type: exports_external.literal("call.completed"), payload: CompletedPayloadSchema }),
  exports_external.object({ ...baseEnvelope, type: exports_external.literal("call.failed"), payload: FailedPayloadSchema })
]);
var CaptureInputSchema = exports_external.object({
  tool: exports_external.string().min(1),
  args: exports_external.record(exports_external.string(), exports_external.unknown()),
  result: exports_external.unknown(),
  duration_ms: exports_external.number().int().nonnegative(),
  started_at: exports_external.string().min(1),
  finished_at: exports_external.string().min(1)
});
var CaptureErrorCodeSchema = exports_external.enum([
  "CAPTURE_UNKNOWN_TOOL",
  "CAPTURE_APPEND_FAILED",
  "CAPTURE_BLOB_FATAL",
  "CAPTURE_INVALID_INPUT"
]);
var CaptureFailure = exports_external.object({
  success: exports_external.literal(false),
  error: exports_external.object({
    code: CaptureErrorCodeSchema,
    message: exports_external.string(),
    recoverable: exports_external.boolean()
  })
});
var CaptureSuccess = exports_external.object({
  success: exports_external.literal(true),
  data: exports_external.object({
    trace_id: exports_external.string(),
    produced_screen_ids: exports_external.array(exports_external.string()),
    warnings: exports_external.array(exports_external.string())
  })
});
var CaptureResultSchema = exports_external.union([CaptureSuccess, CaptureFailure]);

// src/lib/log/capture/handler.ts
class CaptureHandler {
  blobs;
  append;
  now;
  newId;
  constructor(deps) {
    this.blobs = deps.blobs;
    this.append = deps.append;
    this.now = deps.now ?? (() => new Date);
    this.newId = deps.newId ?? (() => randomUUID());
  }
  async capture(input) {
    const parsed = CaptureInputSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail("CAPTURE_INVALID_INPUT", parsed.error.message, false);
    }
    const kind = kindOf(input.tool);
    const trace_id = this.newId();
    const warnings = [];
    const argsBuf = Buffer.from(JSON.stringify(input.args));
    const argsBlob = await this.blobs.put(argsBuf, "application/json");
    if (!argsBlob.success) {
      return this.fail("CAPTURE_BLOB_FATAL", `args_blob: ${argsBlob.error.message}`, false);
    }
    const requested = {
      id: this.newId(),
      time: input.started_at,
      trace_id,
      schema_version: 1,
      type: "call.requested",
      payload: {
        tool: input.tool,
        project_id: typeof input.args.projectId === "string" ? input.args.projectId : undefined,
        selected_screen_ids: Array.isArray(input.args.selectedScreenIds) ? input.args.selectedScreenIds : undefined,
        user_prompt: typeof input.args.prompt === "string" ? input.args.prompt : undefined,
        variant_options: input.args.variantOptions && typeof input.args.variantOptions === "object" ? input.args.variantOptions : undefined,
        device_type: typeof input.args.deviceType === "string" ? input.args.deviceType : undefined,
        model_id: typeof input.args.modelId === "string" ? input.args.modelId : undefined,
        args_blob: argsBlob.data
      }
    };
    const ar = await this.append(requested);
    if (!ar.success)
      return this.fail("CAPTURE_APPEND_FAILED", ar.error.message, true);
    const r = input.result;
    if (r && r.isError === true) {
      const errorText = r.content?.find((c) => c.type === "text")?.text ?? "";
      const rawBlob = await this.blobs.put(Buffer.from(JSON.stringify(r)), "application/json");
      const failed = {
        id: this.newId(),
        time: input.finished_at,
        trace_id,
        schema_version: 1,
        type: "call.failed",
        payload: {
          tool: input.tool,
          duration_ms: input.duration_ms,
          is_error: true,
          error_text: errorText,
          raw_blob: rawBlob.success ? rawBlob.data : undefined
        }
      };
      const fr = await this.append(failed);
      if (!fr.success)
        return this.fail("CAPTURE_APPEND_FAILED", fr.error.message, true);
      return { success: true, data: { trace_id, produced_screen_ids: [], warnings } };
    }
    if (kind === "read") {
      const resultBlob = await this.blobs.put(Buffer.from(JSON.stringify(r ?? {})), "application/json");
      if (!resultBlob.success) {
        return this.fail("CAPTURE_BLOB_FATAL", `result_blob: ${resultBlob.error.message}`, false);
      }
      const returned = extractReturnedIds(r);
      const completed2 = {
        id: this.newId(),
        time: input.finished_at,
        trace_id,
        schema_version: 1,
        type: "call.completed",
        payload: {
          tool: input.tool,
          duration_ms: input.duration_ms,
          kind: "read",
          project_id: typeof input.args.projectId === "string" ? input.args.projectId : undefined,
          screen_ids: typeof input.args.screenId === "string" ? [input.args.screenId] : Array.isArray(input.args.selectedScreenIds) ? input.args.selectedScreenIds : undefined,
          returned_project_ids: returned.projects.length > 0 ? returned.projects : undefined,
          returned_screen_ids: returned.screens.length > 0 ? returned.screens : undefined,
          result_blob: resultBlob.data
        }
      };
      const cr2 = await this.append(completed2);
      if (!cr2.success)
        return this.fail("CAPTURE_APPEND_FAILED", cr2.error.message, true);
      return { success: true, data: { trace_id, produced_screen_ids: [], warnings } };
    }
    if (kind === "unknown") {
      const resultBlob = await this.blobs.put(Buffer.from(JSON.stringify(r ?? {})), "application/json");
      if (!resultBlob.success) {
        return this.fail("CAPTURE_BLOB_FATAL", `result_blob: ${resultBlob.error.message}`, false);
      }
      const completed2 = {
        id: this.newId(),
        time: input.finished_at,
        trace_id,
        schema_version: 1,
        type: "call.completed",
        payload: {
          tool: input.tool,
          duration_ms: input.duration_ms,
          kind: "unknown",
          project_id: typeof input.args.projectId === "string" ? input.args.projectId : undefined,
          result_blob: resultBlob.data
        }
      };
      const cr2 = await this.append(completed2);
      if (!cr2.success)
        return this.fail("CAPTURE_APPEND_FAILED", cr2.error.message, true);
      return { success: true, data: { trace_id, produced_screen_ids: [], warnings } };
    }
    const sc = r?.structuredContent ?? null;
    const screens = pickScreens(sc);
    if (screens.length === 0) {
      const rawBlob = await this.blobs.put(Buffer.from(JSON.stringify(r ?? {})), "application/json");
      const failed = {
        id: this.newId(),
        time: input.finished_at,
        trace_id,
        schema_version: 1,
        type: "call.failed",
        payload: {
          tool: input.tool,
          duration_ms: input.duration_ms,
          is_error: "empty",
          raw_blob: rawBlob.success ? rawBlob.data : undefined
        }
      };
      const fr = await this.append(failed);
      if (!fr.success)
        return this.fail("CAPTURE_APPEND_FAILED", fr.error.message, true);
      return { success: true, data: { trace_id, produced_screen_ids: [], warnings } };
    }
    const structuredBlob = await this.blobs.put(Buffer.from(JSON.stringify(sc)), "application/json");
    if (!structuredBlob.success) {
      return this.fail("CAPTURE_BLOB_FATAL", `structured_content_blob: ${structuredBlob.error.message}`, false);
    }
    const dsAsset = pickDesignSystemComponent(sc);
    let dsAssetBlob = null;
    if (dsAsset) {
      const r2 = await this.blobs.put(Buffer.from(JSON.stringify(dsAsset)), "application/json");
      if (r2.success)
        dsAssetBlob = r2.data;
      else
        warnings.push(`design_system_asset put failed: ${r2.error.message}`);
    }
    const allScreenIds = screens.map((s) => s.id ?? "").filter(Boolean);
    const selectedParents = input.args.selectedScreenIds ?? [];
    const parent = selectedParents[0] ?? null;
    const produced = [];
    for (const s of screens) {
      const screenId = s.id ?? "";
      const siblings = allScreenIds.filter((id) => id !== screenId);
      let themeBlob = null;
      if (s.theme && Object.keys(s.theme).length > 0) {
        const tr = await this.blobs.put(Buffer.from(JSON.stringify(s.theme)), "application/json");
        if (tr.success)
          themeBlob = tr.data;
        else
          warnings.push(`screen ${screenId} theme: ${tr.error.message}`);
      }
      let dsBlob = null;
      if (s.designSystem) {
        const dr = await this.blobs.put(Buffer.from(JSON.stringify(s.designSystem)), "application/json");
        if (dr.success)
          dsBlob = dr.data;
        else
          warnings.push(`screen ${screenId} design_system: ${dr.error.message}`);
      } else if (dsAssetBlob) {
        dsBlob = dsAssetBlob;
      }
      let htmlBlob = null;
      if (s.htmlCode?.downloadUrl) {
        const fr = await this.blobs.fetch(s.htmlCode.downloadUrl, s.htmlCode.mimeType ?? "text/html");
        if (fr.success)
          htmlBlob = fr.data;
        else
          warnings.push(`screen ${screenId} html: ${fr.error.code} ${fr.error.message}`);
      }
      let shotBlob = null;
      if (s.screenshot?.downloadUrl) {
        const fr = await this.blobs.fetch(s.screenshot.downloadUrl);
        if (fr.success)
          shotBlob = fr.data;
        else
          warnings.push(`screen ${screenId} screenshot: ${fr.error.code} ${fr.error.message}`);
      }
      produced.push({
        project_id: input.args.projectId ?? sc?.projectId ?? "",
        screen_id: screenId,
        name: s.name ?? "",
        parent_screen_id: parent,
        sibling_screen_ids: siblings,
        effective_prompt: s.prompt ?? "",
        html_blob: htmlBlob,
        screenshot_blob: shotBlob,
        theme_blob: themeBlob,
        design_system_blob: dsBlob
      });
    }
    const completed = {
      id: this.newId(),
      time: input.finished_at,
      trace_id,
      schema_version: 1,
      type: "call.completed",
      payload: {
        tool: input.tool,
        duration_ms: input.duration_ms,
        kind: "generative",
        stitch_session_id: typeof sc?.sessionId !== "undefined" ? String(sc.sessionId) : undefined,
        structured_content_blob: structuredBlob.data,
        produced_screens: produced
      }
    };
    const cr = await this.append(completed);
    if (!cr.success)
      return this.fail("CAPTURE_APPEND_FAILED", cr.error.message, true);
    return {
      success: true,
      data: { trace_id, produced_screen_ids: produced.map((p) => p.screen_id), warnings }
    };
  }
  fail(code, message, recoverable) {
    return { success: false, error: { code, message, recoverable } };
  }
}
function pickScreens(sc) {
  const out = [];
  for (const c of sc?.outputComponents ?? []) {
    if (c?.design?.screens)
      for (const s of c.design.screens)
        out.push(s);
  }
  return out;
}
function pickDesignSystemComponent(sc) {
  const c = (sc?.outputComponents ?? []).find((x) => x?.designSystem);
  return c?.designSystem ?? null;
}
function extractReturnedIds(result) {
  const projects = new Set;
  const screens = new Set;
  const seen = new WeakSet;
  const visit = (node) => {
    if (!node || typeof node !== "object")
      return;
    if (seen.has(node))
      return;
    seen.add(node);
    const name = node.name;
    if (typeof name === "string") {
      if (name.startsWith("projects/"))
        projects.add(name.slice("projects/".length));
      else if (name.startsWith("screens/"))
        screens.add(name.slice("screens/".length));
    }
    if (Array.isArray(node)) {
      for (const v of node)
        visit(v);
    } else {
      for (const v of Object.values(node))
        visit(v);
    }
  };
  visit(result);
  return { projects: Array.from(projects), screens: Array.from(screens) };
}

// src/lib/log/factory.ts
var DEFAULT_LOG_ROOT = ".stitch-mcp/log";
function isLogEnabled() {
  return process.env.STITCH_MCP_LOG === "1";
}
function createCaptureHandler(root = DEFAULT_LOG_ROOT) {
  const blobs = new BlobStoreHandler(join2(root, "blobs"));
  const eventsPath = join2(root, "events.jsonl");
  return new CaptureHandler({
    blobs,
    append: (event) => appendEvent(eventsPath, event)
  });
}

export { isLogEnabled, createCaptureHandler };

//# debugId=FE77B0940D64015064756E2164756E21
