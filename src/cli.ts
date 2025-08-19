import { generateSVG } from "./svg";
import * as fs from "fs";
import * as path from "path";

// Prefer environment variables (GitHub Actions), fallback to CLI args for local dev
const username =
  process.env.INPUT_GITHUB_USERNAME ||
  process.argv[2] ||
  process.env.GITHUB_USERNAME;
const token =
  process.env.INPUT_GITHUB_TOKEN || process.argv[3] || process.env.GITHUB_TOKEN;

// If no token or username is provided, print usage and exit
if (!username || !token) {
  console.error(
    "Usage: node cli.js <github-username> <github-token>\n" +
      "Or set GITHUB_USERNAME and GITHUB_TOKEN as environment variables.\n" +
      "Or use in GitHub Actions with 'github_username' and 'github_token' inputs.",
  );
  process.exit(1);
}

// Ensure output directory exists
const outDir = path.join(process.cwd(), "output");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate both light and dark SVGs
Promise.all([
  generateSVG(username, token, false).then((svg) =>
    fs.writeFileSync(path.join(outDir, "light.svg"), svg),
  ),
  generateSVG(username, token, true).then((svg) =>
    fs.writeFileSync(path.join(outDir, "dark.svg"), svg),
  ),
])
  .then(() => {
    console.log("SVGs generated: output/light.svg, output/dark.svg");
  })
  .catch((err) => {
    console.error("Failed to generate SVGs:", err);
    process.exit(1);
  });
