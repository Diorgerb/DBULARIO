import { describe, it, expect } from "vitest";
import {
  loadMedications,
  searchMedications,
  listMedications,
  getMedicationStats,
  getMedicationById,
  getRecentUpdates,
  parseCSV,
} from "./csv-loader";

describe("CSV Loader", () => {
  describe("loadMedications", () => {
    it("should load medications from CSV", () => {
      const medications = loadMedications();
      expect(Array.isArray(medications)).toBe(true);
      expect(medications.length).toBeGreaterThan(0);
    });

    it("should have correct medication structure", () => {
      const medications = loadMedications();
      const med = medications[0];

      expect(med).toHaveProperty("id");
      expect(med).toHaveProperty("holder");
      expect(med).toHaveProperty("cnpj");
      expect(med).toHaveProperty("name");
      expect(med).toHaveProperty("registrationNumber");
      expect(med).toHaveProperty("processNumber");
      expect(med).toHaveProperty("lastUpdate");
      expect(med).toHaveProperty("category");
      expect(med).toHaveProperty("status");
    });
  });

  describe("getMedicationStats", () => {
    it("should return stats with correct structure", () => {
      const stats = getMedicationStats();

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("updated");
      expect(stats).toHaveProperty("inactive");
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe("searchMedications", () => {
    it("should search medications", () => {
      const results = searchMedications("Actemra");
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("listMedications", () => {
    it("should list medications with pagination", () => {
      const result = listMedications(1, 10);

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("limit");
      expect(result).toHaveProperty("totalPages");
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe("getMedicationById", () => {
    it("should get medication by id", () => {
      const med = getMedicationById(1);
      expect(med).not.toBeNull();
      expect(med?.id).toBe(1);
    });
  });

  describe("getRecentUpdates", () => {
    it("should get recent updates", () => {
      const updates = getRecentUpdates(7);
      expect(Array.isArray(updates)).toBe(true);
    });
  });

  describe("parseCSV", () => {
    it("should handle commas and escaped quotes inside fields", () => {
      const csv = [
        "idProduto,numeroRegistro,nomeProduto,razaoSocial",
        '1,12345,"Medicamento ""Especial""","Empresa, LTDA"',
        '2,67890,"Outro Produto","Outra Empresa"',
      ].join("\n");

      const records = parseCSV(csv);

      expect(records[0].numeroRegistro).toBe("12345");
      expect(records[0].nomeProduto).toBe('Medicamento "Especial"');
      expect(records[0].razaoSocial).toBe("Empresa, LTDA");
      expect(records[1].numeroRegistro).toBe("67890");
      expect(records[1].nomeProduto).toBe("Outro Produto");
    });
  });
});
