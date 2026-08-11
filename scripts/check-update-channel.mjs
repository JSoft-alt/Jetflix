import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "jetflix-update-check-"));
const bundlePath = path.join(tempDir, "updates.mjs");

try {
  await build({
    entryPoints: [path.resolve("src/utils/updates.js")],
    outfile: bundlePath,
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "silent",
  });

  globalThis.window = {
    electron: { getAppVersion: async () => "1.0.0" },
  };
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [
      {
        tag_name: "v1.0.1",
        html_url: "https://github.com/JSoft-alt/Jetflix/releases/tag/v1.0.1",
        prerelease: false,
        draft: false,
        assets: [
          {
            name: "Jetflix-1.0.1-universal.dmg",
            browser_download_url:
              "https://github.com/JSoft-alt/Jetflix/releases/download/v1.0.1/Jetflix-1.0.1-universal.dmg",
          },
        ],
      },
    ],
  });

  const updates = await import(`${pathToFileURL(bundlePath).href}?t=${Date.now()}`);
  const result = await updates.checkForUpdates();
  if (updates.GITHUB_REPO !== "JSoft-alt/Jetflix") {
    throw new Error(`wrong update repository: ${updates.GITHUB_REPO || "empty"}`);
  }
  if (!result.hasUpdate || result.latest !== "1.0.1" || !result.assets.dmg) {
    throw new Error("the public macOS update was not detected");
  }
  console.log(`PASS update channel ${updates.GITHUB_REPO} -> v${result.latest}`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
