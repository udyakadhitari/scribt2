import {
  icons,
  theme
} from "../../chunk-kbtqrkwh.js";
import"../../chunk-3sfn889r.js";
import {
  exports_external
} from "../../chunk-2k7n0w2x.js";
import {
  __require
} from "../../chunk-9wyra8hs.js";

// src/commands/upload-image/spec.ts
var SafeFilePathSchema = exports_external.string().min(1, "File path is required").refine((p) => !p.includes(".."), "Path traversal is not allowed");
var UploadImageInputSchema = exports_external.object({
  projectId: exports_external.string().min(1, "Project ID is required"),
  filePath: SafeFilePathSchema,
  title: exports_external.string().optional()
});
var UploadImageErrorCode = exports_external.enum([
  "FILE_NOT_FOUND",
  "UNSUPPORTED_FORMAT",
  "AUTH_FAILED",
  "UPLOAD_FAILED",
  "UNKNOWN_ERROR"
]);

// src/commands/upload-image/command.ts
var command = {
  name: "upload-image",
  description: "Upload an image file to a Stitch project as a new screen",
  requiredOptions: [
    { flags: "-p, --project <id>", description: "Project ID to upload the image into" },
    { flags: "-f, --file <path>", description: "Path to the image file (PNG, JPG, JPEG, WEBP)" }
  ],
  options: [
    { flags: "--title <title>", description: "Optional display title for the created screen" }
  ],
  action: async (_args, options) => {
    try {
      const input = UploadImageInputSchema.parse({
        projectId: options.project,
        filePath: options.file,
        title: options.title
      });
      const { UploadImageHandler } = await import("../../chunk-19zxsnx3.js");
      const uploadFn = async (projectId, filePath, title) => {
        const { stitch } = await import("../../chunk-et8k9131.js");
        const project = stitch.project(projectId);
        const screens = await project.uploadImage(filePath, { title });
        return screens.map((s) => ({ screenId: s.screenId, projectId: s.projectId }));
      };
      const handler = new UploadImageHandler({ uploadImage: uploadFn });
      const result = await handler.execute(input);
      if (!result.success) {
        console.error(theme.red(`
${icons.error} Upload failed: ${result.error.message}`));
        process.exit(1);
      }
      console.log(theme.green(`
${icons.success} Successfully uploaded image to project ${input.projectId}:`));
      for (const s of result.screens) {
        console.log(`  ${icons.success} screenId: ${theme.cyan(s.screenId)}`);
      }
      process.exit(0);
    } catch (error) {
      console.error(theme.red(`
${icons.error} Unexpected error:`), error?.message ?? String(error));
      process.exit(1);
    }
  }
};
export {
  command
};

//# debugId=64EB08DCE09DD56464756E2164756E21
