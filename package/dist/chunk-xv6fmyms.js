import {
  require_lib
} from "./chunk-7vdj1qwb.js";
import {
  load
} from "./chunk-spbm03bj.js";
import {
  __require,
  __toESM
} from "./chunk-9wyra8hs.js";

// src/lib/server/AssetGateway.ts
var import_fs_extra = __toESM(require_lib(), 1);
import path from "path";
import crypto from "crypto";
import { parse } from "@astrojs/compiler";
import { is, serialize } from "@astrojs/compiler/utils";

class AssetGateway {
  cacheDir;
  static ALLOWED_HOST_PATTERNS = [
    /\.googleapis\.com$/,
    /\.googleusercontent\.com$/,
    /\.gstatic\.com$/,
    /^cdnjs\.cloudflare\.com$/,
    /^cdn\.tailwindcss\.com$/,
    /^images\.unsplash\.com$/,
    /^cdn\.jsdelivr\.net$/,
    /^unpkg\.com$/
  ];
  static validateAssetUrl(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    if (parsed.protocol !== "https:") {
      return false;
    }
    return AssetGateway.ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname));
  }
  constructor(projectRoot = process.cwd()) {
    this.cacheDir = path.join(projectRoot, ".stitch-mcp", "cache");
  }
  async init() {
    await import_fs_extra.default.ensureDir(this.cacheDir);
  }
  getHash(url) {
    return crypto.createHash("md5").update(url).digest("hex");
  }
  async fetchAsset(url) {
    await this.init();
    if (!AssetGateway.validateAssetUrl(url)) {
      console.warn(`Blocked asset fetch for disallowed URL: ${url}`);
      return null;
    }
    const hash = this.getHash(url);
    const cachePath = path.join(this.cacheDir, hash);
    const metadataPath = cachePath + ".meta.json";
    if (await import_fs_extra.default.pathExists(cachePath)) {
      let contentType;
      if (await import_fs_extra.default.pathExists(metadataPath)) {
        try {
          const meta = await import_fs_extra.default.readJson(metadataPath);
          contentType = meta.contentType;
        } catch (e) {}
      }
      try {
        const stream = import_fs_extra.default.createReadStream(cachePath);
        stream.on("error", () => {});
        return { stream, contentType };
      } catch (e) {
        console.warn(`Failed to open cached asset: ${url}`, e);
      }
    }
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (!response.ok) {
        console.warn(`Failed to fetch asset: ${url} (${response.status})`);
        return null;
      }
      const contentType = response.headers.get("content-type") || undefined;
      const buffer = await response.arrayBuffer();
      await import_fs_extra.default.writeFile(cachePath, Buffer.from(buffer));
      if (contentType) {
        await import_fs_extra.default.writeJson(metadataPath, { contentType });
      }
      const stream = import_fs_extra.default.createReadStream(cachePath);
      stream.on("error", () => {});
      return { stream, contentType };
    } catch (e) {
      console.warn(`Failed to fetch asset: ${url}`, e);
      return null;
    }
  }
  rewriteCssUrls(css, baseUrl) {
    const discovered = [];
    const importRewritten = css.replace(/@import\s+(['"])([^'"]+)\1\s*;/g, (match, quote, rawUrl) => {
      const trimmed = rawUrl.trim();
      if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("/_stitch/")) {
        return match;
      }
      let resolved;
      try {
        if (trimmed.startsWith("//")) {
          resolved = new URL(trimmed, baseUrl).href;
        } else if (/^https?:\/\//.test(trimmed)) {
          resolved = trimmed;
        } else {
          resolved = new URL(trimmed, baseUrl).href;
        }
      } catch {
        return match;
      }
      discovered.push(resolved);
      return `@import ${quote}/_stitch/asset?url=${encodeURIComponent(resolved)}${quote};`;
    });
    const rewritten = importRewritten.replace(/url\(\s*(['"]?)([^)]*?)\1\s*\)/g, (match, quote, rawUrl) => {
      const trimmed = rawUrl.trim();
      if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("#") && !trimmed.startsWith("#/") || trimmed.startsWith("/_stitch/")) {
        return match;
      }
      let resolved;
      try {
        if (trimmed.startsWith("//")) {
          resolved = new URL(trimmed, baseUrl).href;
        } else if (/^https?:\/\//.test(trimmed)) {
          resolved = trimmed;
        } else {
          resolved = new URL(trimmed, baseUrl).href;
        }
      } catch {
        return match;
      }
      discovered.push(resolved);
      return `url(${quote}/_stitch/asset?url=${encodeURIComponent(resolved)}${quote})`;
    });
    Promise.all(discovered.map((url) => this.fetchAsset(url).catch(() => {})));
    return rewritten;
  }
  async rewriteHtmlForPreview(html) {
    const $ = load(html);
    const assets = new Set;
    const process2 = (el, attr) => {
      const url = $(el).attr(attr);
      if (url && url.startsWith("http")) {
        assets.add(url);
        $(el).attr(attr, `/_stitch/asset?url=${encodeURIComponent(url)}`);
      }
    };
    $("img").each((_, el) => process2(el, "src"));
    $('link[rel="stylesheet"]').each((_, el) => process2(el, "href"));
    $("script").each((_, el) => process2(el, "src"));
    await Promise.all(Array.from(assets).map((url) => this.fetchAsset(url).catch(console.error)));
    return $.html();
  }
  getExtensionFromContentType(contentType) {
    if (!contentType)
      return "";
    const mimeType = contentType.split(";")[0]?.trim().toLowerCase();
    const mimeToExt = {
      "text/css": ".css",
      "text/javascript": ".js",
      "application/javascript": ".js",
      "application/x-javascript": ".js",
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/x-icon": ".ico",
      "image/vnd.microsoft.icon": ".ico",
      "font/woff": ".woff",
      "font/woff2": ".woff2",
      "font/ttf": ".ttf",
      "font/otf": ".otf",
      "application/font-woff": ".woff",
      "application/font-woff2": ".woff2",
      "application/json": ".json",
      "text/html": ".html",
      "text/plain": ".txt"
    };
    return mimeToExt[mimeType || ""] || "";
  }
  async rewriteHtmlForBuild(html) {
    const $ = load(html);
    const assetUrls = [];
    const collectUrl = (el, attr) => {
      const url = $(el).attr(attr);
      if (url && url.startsWith("http")) {
        assetUrls.push(url);
      }
    };
    $("img").each((_, el) => collectUrl(el, "src"));
    $('link[rel="stylesheet"]').each((_, el) => collectUrl(el, "href"));
    $("script").each((_, el) => collectUrl(el, "src"));
    const urlToFilename = new Map;
    await Promise.all(assetUrls.map(async (url) => {
      try {
        const result = await this.fetchAsset(url);
        if (!result)
          return;
        const { stream, contentType } = result;
        stream.destroy();
        const hash = this.getHash(url);
        const urlObj = new URL(url);
        let ext = path.extname(urlObj.pathname);
        if (!ext) {
          ext = this.getExtensionFromContentType(contentType);
        }
        const filename = `${hash}${ext}`;
        urlToFilename.set(url, filename);
      } catch (e) {}
    }));
    const assets = [];
    const rewriteUrl = (el, attr, defaultExt) => {
      const url = $(el).attr(attr);
      if (url && url.startsWith("http")) {
        let filename = urlToFilename.get(url);
        if (!filename) {
          const hash = this.getHash(url);
          filename = `${hash}${defaultExt}`;
        }
        $(el).attr(attr, `/assets/${filename}`);
        assets.push({ url, filename });
      }
    };
    $("img").each((_, el) => rewriteUrl(el, "src", ".png"));
    $('link[rel="stylesheet"]').each((_, el) => rewriteUrl(el, "href", ".css"));
    $("script").each((_, el) => {
      rewriteUrl(el, "src", ".js");
      if ($(el).attr("src")?.startsWith("/assets/")) {
        $(el).attr("is:inline", "");
      }
    });
    $.root().contents().filter((_, el) => el.type === "directive" && el.name === "!doctype").remove();
    let outputHtml = $.html();
    const astroContent = `---
---
${outputHtml}`;
    const parseResult = await parse(astroContent, { position: false });
    const skipElements = new Set(["script", "style"]);
    const escapeExpressions = (node, insideSkipElement) => {
      const isSkipElement = is.element(node) && skipElements.has(node.name.toLowerCase());
      const shouldSkip = insideSkipElement || isSkipElement;
      if (is.parent(node) && !shouldSkip) {
        const newChildren = [];
        for (const child of node.children) {
          if (child.type === "expression") {
            const exprContent = child.children?.filter((c) => is.text(c)).map((c) => c.value).join("") || "";
            newChildren.push({
              type: "text",
              value: `{'{'}${exprContent}{'}'}`
            });
          } else {
            newChildren.push(child);
            escapeExpressions(child, shouldSkip);
          }
        }
        node.children = newChildren;
      } else if (is.parent(node)) {
        for (const child of node.children) {
          escapeExpressions(child, shouldSkip);
        }
      }
    };
    escapeExpressions(parseResult.ast, false);
    const astroOutput = serialize(parseResult.ast);
    return { html: astroOutput, assets };
  }
  async copyAssetTo(url, destPath) {
    await this.init();
    const hash = this.getHash(url);
    const cachePath = path.join(this.cacheDir, hash);
    if (await import_fs_extra.default.pathExists(cachePath)) {
      await import_fs_extra.default.copy(cachePath, destPath);
      return true;
    } else {
      const result = await this.fetchAsset(url);
      if (!result) {
        console.warn(`Skipping asset copy, fetch failed: ${url}`);
        return false;
      }
      await import_fs_extra.default.copy(cachePath, destPath);
      return true;
    }
  }
}

// src/lib/server/vite/plugins/virtualContent.ts
var VIRTUAL_NAV_ID = "virtual:stitch-nav";
var RESOLVED_VIRTUAL_NAV_ID = "\x00" + VIRTUAL_NAV_ID;
function virtualContent({ assetGateway, htmlMap }) {
  return {
    name: "stitch-virtual-content",
    resolveId(id) {
      if (id === VIRTUAL_NAV_ID) {
        return RESOLVED_VIRTUAL_NAV_ID;
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_NAV_ID) {
        return `
          if (import.meta.hot) {
            // Register navigation handler
            import.meta.hot.on('stitch:navigate', ({ url }) => {
              window.location.href = url;
            });
            
            // Log connection status for debugging
            import.meta.hot.on('vite:ws:connect', () => {
              console.log('[stitch] HMR connected');
            });
            
            console.log('[stitch] Navigation handler registered');
          } else {
            console.warn('[stitch] HMR not available');
          }
        `;
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url)
          return next();
        const url = new URL(req.url, "http://localhost");
        if (url.pathname === "/_stitch/asset") {
          const assetUrl = url.searchParams.get("url");
          if (!assetUrl) {
            res.statusCode = 400;
            res.end("Missing url parameter");
            return;
          }
          try {
            const result = await assetGateway.fetchAsset(assetUrl);
            if (!result) {
              res.statusCode = 404;
              res.end("Asset not found");
              return;
            }
            const { stream, contentType } = result;
            let effectiveContentType = contentType;
            if (!contentType || contentType.includes("application/octet-stream")) {
              const fontExtMap = {
                ".woff2": "font/woff2",
                ".woff": "font/woff",
                ".ttf": "font/ttf",
                ".otf": "font/otf",
                ".eot": "application/vnd.ms-fontobject"
              };
              try {
                const ext = new URL(assetUrl).pathname.match(/\.[^.]+$/)?.[0]?.toLowerCase();
                if (ext && fontExtMap[ext]) {
                  effectiveContentType = fontExtMap[ext];
                }
              } catch {}
            }
            if (effectiveContentType) {
              res.setHeader("Content-Type", effectiveContentType);
            }
            const isCss = effectiveContentType?.includes("text/css");
            res.setHeader("Cache-Control", isCss ? "no-cache" : "public, max-age=31536000");
            if (isCss) {
              const chunks = [];
              stream.on("data", (chunk) => chunks.push(chunk));
              stream.on("end", async () => {
                const css = Buffer.concat(chunks).toString("utf-8");
                const rewritten = await assetGateway.rewriteCssUrls(css, assetUrl);
                res.end(rewritten);
              });
              stream.on("error", (err) => {
                console.error("CSS stream error:", err);
                res.statusCode = 500;
                res.end("Internal Server Error");
              });
            } else {
              stream.pipe(res);
            }
          } catch (error) {
            console.error("Asset proxy error:", error);
            res.statusCode = 500;
            res.end("Internal Server Error");
          }
          return;
        }
        const content = htmlMap.get(url.pathname);
        if (content) {
          try {
            const transformed = await server.transformIndexHtml(req.url, content);
            res.setHeader("Content-Type", "text/html");
            res.end(transformed);
          } catch (e) {
            console.error("Transform error:", e);
            next();
          }
          return;
        }
        if (url.pathname.startsWith("/_preview/")) {
          const loadingHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="1">
  <title>Loading...</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #1a1a1a;
      color: #fff;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #333;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Loading preview...</p>
  </div>
</body>
</html>`;
          res.setHeader("Content-Type", "text/html");
          res.end(loadingHtml);
          return;
        }
        next();
      });
    },
    async transformIndexHtml(html) {
      const rewritten = await assetGateway.rewriteHtmlForPreview(html);
      const script = `<script type="module" src="/@id/${VIRTUAL_NAV_ID}"></script>`;
      if (rewritten.includes("</head>")) {
        return rewritten.replace("</head>", script + "</head>");
      }
      return rewritten + script;
    }
  };
}

// src/lib/server/vite/StitchViteServer.ts
class StitchViteServer {
  server = null;
  htmlMap = new Map;
  assetGateway;
  constructor(projectRoot = process.cwd(), assetGateway) {
    this.assetGateway = assetGateway || new AssetGateway(projectRoot);
  }
  async start(port = 3000) {
    const { createServer } = await import("vite");
    this.server = await createServer({
      configFile: false,
      root: process.cwd(),
      server: {
        port,
        middlewareMode: false
      },
      appType: "custom",
      plugins: [
        virtualContent({
          assetGateway: this.assetGateway,
          htmlMap: this.htmlMap
        })
      ],
      logLevel: "silent"
    });
    await this.server.listen();
    const address = this.server.httpServer?.address();
    if (address && typeof address === "object") {
      return `http://localhost:${address.port}`;
    }
    return `http://localhost:${port}`;
  }
  async stop() {
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
  }
  mount(route, html) {
    this.htmlMap.set(route, html);
    if (this.server) {
      this.server.ws.send({ type: "full-reload", path: route });
    }
  }
  navigate(url) {
    if (this.server) {
      this.server.ws.send("stitch:navigate", { url });
    }
  }
}

export { AssetGateway, StitchViteServer };

//# debugId=048331EBE5811A5964756E2164756E21
