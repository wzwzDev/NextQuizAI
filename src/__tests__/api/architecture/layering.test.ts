import fs from "fs";
import path from "path";

function listFilesRecursive(basePath: string, fileFilter: (filePath: string) => boolean) {
  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath, fileFilter));
      continue;
    }

    if (fileFilter(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function read(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

describe("Layered architecture import boundaries", () => {
  const projectRoot = path.resolve(__dirname, "../../../..");
  const apiDir = path.join(projectRoot, "src", "app", "api");
  const servicesDir = path.join(projectRoot, "src", "server", "services");
  const repositoriesDir = path.join(projectRoot, "src", "server", "repositories");

  it("routes do not import db or repositories directly", () => {
    const routeFiles = listFilesRecursive(apiDir, (filePath) => filePath.endsWith(".ts"));

    for (const filePath of routeFiles) {
      const content = read(filePath);
      expect(content).not.toContain('from "@/server/core/db"');
      expect(content).not.toContain('from "@/server/repositories/');
    }
  });

  it("services do not import db directly", () => {
    const serviceFiles = listFilesRecursive(servicesDir, (filePath) => filePath.endsWith(".ts"));

    for (const filePath of serviceFiles) {
      const content = read(filePath);
      expect(content).not.toContain('from "@/server/core/db"');
    }
  });

  it("repositories do not import api routes", () => {
    const repositoryFiles = listFilesRecursive(repositoriesDir, (filePath) => filePath.endsWith(".ts"));

    for (const filePath of repositoryFiles) {
      const content = read(filePath);
      expect(content).not.toContain('from "@/app/api/');
    }
  });
});