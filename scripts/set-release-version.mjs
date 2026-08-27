import { readFile, writeFile } from "node:fs/promises";

const tag = process.argv[2];

if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  throw new Error("Release tag must match vX.X.X exactly.");
}

const packageJsonPath = new URL("../package.json", import.meta.url);
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
packageJson.version = tag.slice(1);

await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
