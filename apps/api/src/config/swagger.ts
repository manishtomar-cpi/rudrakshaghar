import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import type { Express, Request, Response } from "express";

/** very small deep merge for objects/arrays */
function deepMerge<T>(target: any, source: any): T {
  if (Array.isArray(target) && Array.isArray(source)) {
    return [...target, ...source] as any;
  }
  if (isObj(target) && isObj(source)) {
    const out: Record<string, any> = { ...target };
    for (const key of Object.keys(source)) {
      out[key] =
        key in out ? deepMerge(out[key], source[key]) : source[key];
    }
    return out as any;
  }
  return source as any;
}
function isObj(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function loadYamlFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  return yaml.load(raw) as Record<string, unknown>;
}

function tryLoadDir(dir: string) {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((f) => path.join(dir, f));
  return files.map(loadYamlFile);
}

/** Build the OpenAPI spec by merging base + components + paths */
function buildOpenApiSpec() {
  const docsDir = path.join(__dirname, "..", "docs");
  const baseFile = path.join(docsDir, "base.yaml");
  const pathsDir = path.join(docsDir, "paths");
  const componentsDir = path.join(docsDir, "components");

  if (!fs.existsSync(baseFile)) {
    throw new Error(`Missing base OpenAPI file at ${baseFile}`);
  }

  let spec = loadYamlFile(baseFile);

  // merge components
  for (const comp of tryLoadDir(componentsDir)) {
    spec = deepMerge(spec, comp);
  }

  // merge paths (each file should have `paths:` root)
  for (const p of tryLoadDir(pathsDir)) {
    spec = deepMerge(spec, p);
  }

  return spec;
}

/**
 * Mounts Swagger UI and serves the OpenAPI specification.
 * - /docs      → Swagger UI
 * - /docs.json → raw JSON
 */
export function mountSwagger(app: Express) {
  try {
    const spec = buildOpenApiSpec();

    app.get("/docs.json", (_req: Request, res: Response) => res.json(spec));
    app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(spec as any, {
        customSiteTitle: "Rudraksha Store API Docs",
      })
    );

    console.log("[swagger] Documentation mounted at /docs");
  } catch (err) {
    console.error("[swagger] Failed to load OpenAPI spec:", err);
  }
}
