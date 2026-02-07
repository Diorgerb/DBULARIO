import { promises as fs } from "fs";
import path from "path";

const sourcePath = path.resolve(
  process.cwd(),
  "data/StatusBulasANVISA.csv"
);
const targetDir = path.resolve(process.cwd(), "dist/data");
const targetPath = path.join(targetDir, "StatusBulasANVISA.csv");

async function copyCsv() {
  try {
    await fs.access(sourcePath);
  } catch (error) {
    console.warn(
      `[CSV] Skip copy: file not found at "${sourcePath}".`
    );
    return;
  }

  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
  console.log(
    `[CSV] Copied CSV to "${targetPath}" for build output.`
  );
}

copyCsv().catch((error) => {
  console.error("[CSV] Failed to copy CSV for build output.", error);
  process.exitCode = 1;
});
