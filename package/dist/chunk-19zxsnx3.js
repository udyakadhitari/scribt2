import"./chunk-9wyra8hs.js";

// src/commands/upload-image/handler.ts
function classifyError(err) {
  if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
    return {
      success: false,
      error: { code: "FILE_NOT_FOUND", message: err.message || "File not found", recoverable: false }
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("unsupported file extension") || lower.includes("unsupported format")) {
    return {
      success: false,
      error: { code: "UNSUPPORTED_FORMAT", message, recoverable: false }
    };
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("auth")) {
    return {
      success: false,
      error: { code: "AUTH_FAILED", message, recoverable: false }
    };
  }
  if (lower.includes("network") || lower.includes("timeout") || lower.includes("fetch")) {
    return {
      success: false,
      error: { code: "UPLOAD_FAILED", message, recoverable: true }
    };
  }
  const isUploadError = lower.includes("upload") || lower.includes("request failed");
  if (isUploadError) {
    return {
      success: false,
      error: { code: "UPLOAD_FAILED", message, recoverable: true }
    };
  }
  return {
    success: false,
    error: { code: "UNKNOWN_ERROR", message: message || "An unknown error occurred", recoverable: false }
  };
}

class UploadImageHandler {
  uploadImage;
  constructor(deps) {
    this.uploadImage = deps.uploadImage;
  }
  async execute(input) {
    try {
      const screens = await this.uploadImage(input.projectId, input.filePath, input.title);
      return { success: true, screens };
    } catch (err) {
      return classifyError(err);
    }
  }
}
export {
  UploadImageHandler
};

//# debugId=66C8A554682C23C264756E2164756E21
