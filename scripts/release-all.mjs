import { spawnSync } from "node:child_process";

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

const ghCheck = run("gh", ["--version"]);
if (ghCheck.error || ghCheck.status !== 0) {
  console.error("GitHub CLI is required: https://cli.github.com/");
  process.exit(1);
}

const authCheck = run("gh", ["auth", "status"]);
if (authCheck.status !== 0) {
  console.error("Authenticate first with: gh auth login");
  process.exit(1);
}

const remote = run("git", ["remote", "get-url", "origin"]);
if (remote.status !== 0) {
  console.error(
    "No origin remote exists. Publish Jetflix to your GitHub account first, then run this command again.",
  );
  process.exit(1);
}

const match = remote.stdout
  .trim()
  .match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
if (!match) {
  console.error("The origin remote must point to a GitHub repository.");
  process.exit(1);
}

const repository = `${match[1]}/${match[2]}`;
if (match[2].toLowerCase() !== "jetflix") {
  console.error(
    "Refusing to dispatch from an origin that is not named Jetflix.",
  );
  process.exit(1);
}

const dispatch = spawnSync(
  "gh",
  ["workflow", "run", "installers.yml", "--repo", repository],
  { stdio: "inherit" },
);
process.exit(dispatch.status ?? 1);
