import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const srcRoot = path.join(import.meta.dirname, "..", "src");

function aliasToFile(specifier) {
  if (!specifier.startsWith("@/")) return null;
  const rel = specifier.slice(2);
  const candidates = [
    path.join(srcRoot, `${rel}.ts`),
    path.join(srcRoot, `${rel}.tsx`),
    path.join(srcRoot, rel, "index.ts"),
    path.join(srcRoot, rel, "index.tsx"),
  ];
  return candidates.find((file) => fs.existsSync(file)) ?? null;
}

export async function resolve(specifier, context, nextResolve) {
  const aliased = aliasToFile(specifier);
  if (aliased) {
    return nextResolve(pathToFileURL(aliased).href, context);
  }
  if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // fall through to the default resolver
    }
  }
  return nextResolve(specifier, context);
}
