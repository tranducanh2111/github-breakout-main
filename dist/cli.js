"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const svg_1 = require("./svg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Prefer environment variables (GitHub Actions), fallback to CLI args for local dev
const username = process.env.INPUT_GITHUB_USERNAME ||
    process.argv[2] ||
    process.env.GITHUB_USERNAME;
const token = process.env.INPUT_GITHUB_TOKEN || process.argv[3] || process.env.GITHUB_TOKEN;
// If no token or username is provided, print usage and exit
if (!username || !token) {
    console.error("Usage: node cli.js <github-username> <github-token>\n" +
        "Or set GITHUB_USERNAME and GITHUB_TOKEN as environment variables.\n" +
        "Or use in GitHub Actions with 'github_username' and 'github_token' inputs.");
    process.exit(1);
}
// Ensure output directory exists
const outDir = path.join(process.cwd(), "output");
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}
// Generate both light and dark SVGs
Promise.all([
    (0, svg_1.generateSVG)(username, token, false).then((svg) => fs.writeFileSync(path.join(outDir, "light.svg"), svg)),
    (0, svg_1.generateSVG)(username, token, true).then((svg) => fs.writeFileSync(path.join(outDir, "dark.svg"), svg)),
])
    .then(() => {
    console.log("SVGs generated: output/light.svg, output/dark.svg");
})
    .catch((err) => {
    console.error("Failed to generate SVGs:", err);
    process.exit(1);
});
