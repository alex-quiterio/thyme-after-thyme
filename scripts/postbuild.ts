// Runs after `bun build`: copies static PWA files into dist and generates the service worker.
import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const web = join(import.meta.dir, "..", "apps", "web");
const dist = join(web, "dist");

await cp(join(web, "public", "icons"), join(dist, "icons"), { recursive: true });

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}

const files = (await walk(dist)).map((f) => relative(dist, f)).filter((f) => f !== "sw.js").sort();
const precache = ["./", ...files.map((f) => `./${f}`)];
const version = createHash("sha256").update(precache.join("\n")).digest("hex").slice(0, 10);

// Hashed filenames change when content changes, so the file list is a faithful version key
// (icons are unhashed but rarely change; bump a file's name or the template to force a refresh).
const template = await readFile(join(web, "public", "sw.js"), "utf8");
const sw = template.replace('"__PRECACHE__"', JSON.stringify(precache)).replace("__VERSION__", version);
await writeFile(join(dist, "sw.js"), sw);

console.log(`PWA: precaching ${precache.length} files, version ${version}`);
