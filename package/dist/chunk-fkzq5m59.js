// src/ui/copy-behaviors/clipboard.ts
import { writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
function getTextWriters() {
  switch (process.platform) {
    case "darwin":
      return [{ command: "pbcopy", args: [] }];
    case "win32":
      return [
        { command: "clip.exe", args: [] },
        { command: "clip", args: [] }
      ];
    default:
      return [
        { command: "wl-copy", args: [] },
        { command: "xclip", args: ["-selection", "clipboard"] },
        { command: "xsel", args: ["--clipboard", "--input"] }
      ];
  }
}
function pipeToCommand(writer, text) {
  return new Promise((resolve, reject) => {
    const proc = spawn(writer.command, writer.args, {
      stdio: ["pipe", "ignore", "ignore"]
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0)
        resolve();
      else
        reject(new Error(`${writer.command} exited with code ${code}`));
    });
    proc.stdin.end(text, "utf8");
  });
}
async function writeTextToClipboard(text) {
  const writers = getTextWriters();
  let lastError;
  for (const writer of writers) {
    try {
      await pipeToCommand(writer, text);
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("No clipboard utility available");
}
async function copyText(text) {
  await writeTextToClipboard(text);
}
async function copyJson(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  await writeTextToClipboard(text);
}
function spawnAndWait(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: "ignore" });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    proc.on("error", reject);
  });
}
async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  return response.arrayBuffer();
}
async function downloadAndCopyImage(url) {
  const buffer = await downloadImage(url);
  const tempPath = join(tmpdir(), `stitch-clipboard-${Date.now()}.png`);
  await writeFile(tempPath, Buffer.from(buffer));
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      await spawnAndWait("osascript", ["-e", `set the clipboard to (read (POSIX file "${tempPath}") as TIFF picture)`]);
    } else if (platform === "linux") {
      await spawnAndWait("xclip", ["-selection", "clipboard", "-t", "image/png", "-i", tempPath]);
    } else if (platform === "win32") {
      await spawnAndWait("powershell", ["-command", `Set-Clipboard -Path "${tempPath}"`]);
    }
  } finally {
    try {
      await unlink(tempPath);
    } catch {}
  }
}
async function downloadText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  return response.text();
}
async function downloadAndCopyText(url) {
  const text = await downloadText(url);
  await writeTextToClipboard(text);
}

export { copyText, copyJson, downloadImage, downloadAndCopyImage, downloadText, downloadAndCopyText };

//# debugId=01799660167C636764756E2164756E21
