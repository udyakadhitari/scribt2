import {
  icons,
  theme
} from "../../chunk-kbtqrkwh.js";
import"../../chunk-3sfn889r.js";
import {
  exports_external
} from "../../chunk-c6ge431q.js";
import {
  __require
} from "../../chunk-9wyra8hs.js";

// src/commands/upload/spec.ts
var SafeFilePathSchema = exports_external.string().min(1, "File path is required").refine((p) => !p.includes(".."), "Path traversal is not allowed");
var UploadInputSchema = exports_external.object({
  projectId: exports_external.string().min(1, "Project ID is required"),
  filePath: SafeFilePathSchema,
  title: exports_external.string().optional()
});
var UploadErrorCode = exports_external.enum([
  "FILE_NOT_FOUND",
  "UNSUPPORTED_FORMAT",
  "AUTH_FAILED",
  "UPLOAD_FAILED",
  "UNKNOWN_ERROR"
]);

// src/commands/upload/command.ts
var command = {
  name: "upload",
  description: "Upload a design or HTML file asset to a Stitch project as a new screen",
  requiredOptions: [
    { flags: "-p, --project <id>", description: "Project ID to upload the asset into" },
    { flags: "-f, --file <path>", description: "Path to the asset file (PNG, JPG, JPEG, WEBP, HTML)" }
  ],
  options: [
    { flags: "--title <title>", description: "Optional display title for the created screen" }
  ],
  action: async (_args, options) => {
    try {
      const input = UploadInputSchema.parse({
        projectId: options.project,
        filePath: options.file,
        title: options.title
      });
      const { UploadHandler } = await import("../../chunk-jvhzgyhy.js");
      const uploadFn = async (projectId, filePath, title) => {
        const { stitch } = await import("../../chunk-xxtpyg9z.js");
        const project = stitch.project(projectId);
        const screens = await project.upload(filePath, { title });
        return screens.map((s) => ({ screenId: s.screenId, projectId: s.projectId }));
      };
      const handler = new UploadHandler({ upload: uploadFn });
      const result = await handler.execute(input);
      if (!result.success) {
        console.error(theme.red(`
${icons.error} Upload failed: ${result.error.message}`));
        process.exit(1);
      }
      console.log(theme.green(`
${icons.success} Successfully uploaded asset to project ${input.projectId}:`));
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

//# debugId=1F89AA21182915A864756E2164756E21
