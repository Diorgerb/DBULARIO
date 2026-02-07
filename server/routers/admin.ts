import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { medications } from "../../drizzle/schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(process.cwd(), "data");

// Parse CSV manually
function parseCSV(content: string) {
  const lines = content.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Simple CSV parsing (handles basic cases)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""));

    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || "";
    });
    records.push(record);
  }

  return records;
}

export const adminRouter = router({
  importMedications: publicProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Read CSV file
      const csvPath = path.join(dataDir, "tabela_lista_a_incluídos.csv");

      if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found: ${csvPath}`);
      }

      const fileContent = fs.readFileSync(csvPath, "utf8");
      const records = parseCSV(fileContent);

      console.log(`[Import] Found ${records.length} medications to import`);

      // Clear existing data
      await db.delete(medications);
      console.log("[Import] Cleared existing medications");

      // Insert medications in batches
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        for (const record of batch) {
          const registrationNumber = record["Registro"] || "";
          const name = record["Nome Comercial"] || "";
          const concentration = record["Concentracao"] || "";
          const pharmaceuticalForm = record["FormaFarmaceutica"] || "";
          const holder = record["Detentor Registro"] || "";
          const lastUpdateStr = record["Data Atualização Bulário"] || new Date().toISOString().split("T")[0];
          const lastUpdate = new Date(lastUpdateStr);

          await db.insert(medications).values({
            registrationNumber,
            name,
            concentration,
            pharmaceuticalForm,
            holder,
            category: "medicamento",
            status: "ativo",
            lastUpdate,
          });

          inserted++;
        }

        console.log(`[Import] Inserted ${Math.min(i + batchSize, records.length)}/${records.length} medications`);
      }

      console.log(`[Import] Completed! Total: ${inserted} medications`);

      return {
        success: true,
        imported: inserted,
        message: `Successfully imported ${inserted} medications`,
      };
    } catch (error) {
      console.error("[Import] Error:", error);
      throw error;
    }
  }),

  getMedicationStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db.execute(
        "SELECT COUNT(*) as total FROM medications"
      );

      const count = (result as any)[0]?.[0]?.total || 0;

      return {
        total: count,
        imported: count > 0,
      };
    } catch (error) {
      console.error("[Stats] Error:", error);
      return {
        total: 0,
        imported: false,
      };
    }
  }),
});
