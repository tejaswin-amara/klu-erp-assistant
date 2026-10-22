import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

test("manifest is valid Manifest V3 with a matching package version", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const packageMetadata = JSON.parse(read("package.json"));
  assert.equal(manifest.manifest_version, 3);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(packageMetadata.version, manifest.version);
});

test("all manifest-referenced scripts, icons, and web-accessible resources exist", () => {
  const manifest = JSON.parse(read("manifest.json"));
  for (const script of manifest.content_scripts ?? []) {
    for (const file of script.js ?? []) assert.ok(exists(file), "Missing content script asset: " + file);
  }
  for (const file of Object.values(manifest.icons ?? {})) {
    assert.ok(exists(file), "Missing icon asset: " + file);
  }
  for (const group of manifest.web_accessible_resources ?? []) {
    for (const file of group.resources ?? []) {
      assert.ok(exists(file), "Missing web-accessible resource: " + file);
    }
  }
  assert.ok(exists("model/crnn.onnx"), "Bundled model file is missing");
});

test("host match patterns remain scoped to the configured HTTPS ERP host", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const expectedPattern = "https://newerp.kluniversity.in/*";
  const patterns = [
    ...(manifest.content_scripts ?? []).flatMap((item) => item.matches ?? []),
    ...(manifest.web_accessible_resources ?? []).flatMap((item) => item.matches ?? [])
  ];
  assert.ok(patterns.length > 0, "At least one explicit match pattern is required");
  for (const pattern of patterns) assert.equal(pattern, expectedPattern);
  assert.deepEqual(manifest.permissions ?? [], []);
  assert.deepEqual(manifest.host_permissions ?? [], []);
});

test("model metadata has basic, internally valid structural fields", () => {
  const metadata = JSON.parse(read("model/crnn.json"));
  assert.equal(typeof metadata.alphabet, "string");
  assert.ok(metadata.alphabet.length > 0);
  assert.equal(Number.isInteger(metadata.img_w), true);
  assert.equal(Number.isInteger(metadata.img_h), true);
  assert.ok(metadata.img_w > 0 && metadata.img_h > 0);
  assert.equal(Number.isInteger(metadata.blank_idx), true);
  assert.ok(metadata.blank_idx >= 0 && metadata.blank_idx <= metadata.alphabet.length);
  assert.equal(metadata.model_kind, "crnn_ctc");
});

test("release and privacy notices are present and explain model provenance limitations", () => {
  for (const file of [
    "README.md", "LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md",
    "SECURITY.md", "SUPPORT.md", "CHANGELOG.md", "docs/PRIVACY.md"
  ]) {
    assert.ok(exists(file), "Required documentation missing: " + file);
    assert.ok(read(file).trim().length > 0, "Required documentation is empty: " + file);
  }
  assert.match(read("THIRD_PARTY_NOTICES.md"), /MIT License/);
  assert.match(read("THIRD_PARTY_NOTICES.md"), /provenance/i);
});

test("the content script does not directly submit the live login form", () => {
  const source = read("content.js");
  assert.doesNotMatch(source, /\b(?:form|HTMLFormElement)\s*\.\s*(?:submit|requestSubmit)\s*\(/i);
  assert.doesNotMatch(source, /\brequestSubmit\s*\(/i);
});

test("field updates retain bubbling input and change events", () => {
  const source = read("content.js");
  assert.match(source, /new Event\(["']input["'],\s*\{\s*bubbles:\s*true\s*\}\)/);
  assert.match(source, /new Event\(["']change["'],\s*\{\s*bubbles:\s*true\s*\}\)/);
});

test("explicit log calls do not pass recognized-code variables", () => {
  const source = read("content.js");
  const calls = source.match(/console\.(?:log|info|debug|warn|error)\s*\([^;]*?\);/gs) ?? [];
  for (const call of calls) {
    assert.doesNotMatch(call, /\b(?:recognizedText|captchaText|solvedCode|captchaCode)\b/i);
  }
});



test("relative Markdown links in maintained docs resolve to repository files", () => {
  const markdownFiles = [
    "README.md",
    "CHANGELOG.md",
    "CODE_OF_CONDUCT.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "SUPPORT.md",
    "THIRD_PARTY_NOTICES.md",
    "docs/PRIVACY.md",
    ".github/ISSUE_TEMPLATE/bug_report.md",
    ".github/ISSUE_TEMPLATE/feature_request.md"
  ].filter(exists);

  const linkPattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

  for (const documentPath of markdownFiles) {
    const source = read(documentPath);
    for (const match of source.matchAll(linkPattern)) {
      const target = match[1].replace(/^<|>$/g, "");
      if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;

      const pathname = decodeURIComponent(target.split("#", 1)[0].split("?", 1)[0]);
      if (!pathname) continue;

      const resolved = path.resolve(ROOT, path.dirname(documentPath), pathname);
      const relative = path.relative(ROOT, resolved);
      assert.ok(
        relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative),
        "Relative link escapes repository in " + documentPath + ": " + target
      );
      assert.ok(
        fs.existsSync(resolved),
        "Broken relative Markdown link in " + documentPath + ": " + target
      );
    }
  }
});

test("CI executes quality gates without masking failures", () => {
  const workflow = read(".github/workflows/ci.yml");
  assert.match(workflow, /run:\s*npm test/);
  assert.match(workflow, /run:\s*npm run test:package/);
  assert.match(workflow, /scripts\/package_extension\.py/);
  assert.doesNotMatch(workflow, /\|\|\s*(?:echo|true)\b/);
  assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
});
