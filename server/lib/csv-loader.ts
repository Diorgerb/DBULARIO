import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(
  process.cwd(),
  "data/StatusBulasANVISA.csv"
);

/* -------------------- CSV PARSER -------------------- */
export function parseCSV(content: string) {
  const parsed = parse(content, {
    columns: (header) => header.map((column) => column.trim()),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  return parsed.map((record) => {
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(record)) {
      normalized[key.trim()] =
        value === undefined || value === null ? "" : String(value);
    }

    return normalized;
  });
}

/* -------------------- NORMALIZAÇÃO -------------------- */
function normalizeMedication(row: any) {
  if (!row.numeroRegistro || !row.nomeProduto) return null;

  const publicationDate = row.data ? new Date(row.data) : null;
  const lastUpdate = row.dataAtualizacao ? new Date(row.dataAtualizacao) : null;

  return {
    id: Number(row.idProduto),
    registrationNumber: row.numeroRegistro,
    name: row.nomeProduto,
    holder: row.razaoSocial || null,
    cnpj: row.cnpj || null,
    expediente: row.expediente || null,
    processNumber: row.numProcesso || null,
    publicationDate, // atualização do bulário
    lastUpdate,      // inclusão na plataforma
    category: "medicamento",
    status: "ativo",
  };
}

/* -------------------- CACHE -------------------- */
let CACHE: any[] | null = null;

function loadCSV() {
  if (CACHE) return CACHE;

  if (!fs.existsSync(CSV_PATH)) {
    console.error("[CSV] File not found:", CSV_PATH);
    return [];
  }

  const content = fs.readFileSync(CSV_PATH, "utf8");
  const parsed = parseCSV(content);

  CACHE = parsed.map(normalizeMedication).filter(Boolean);
  console.log(`[CSV] Loaded ${CACHE.length} medications from CSV`);

  return CACHE;
}

export function loadMedications() {
  return loadCSV();
}

/* -------------------- LISTAGEM -------------------- */
export function listMedications(
  page = 1,
  limit = 10,
  filters: {
    search?: string;
    category?: string;
    status?: string;
    dateRange?: number; // filtro pela atualização do bulário
  } = {}
) {
  const data = loadCSV();
  let result = [...data];

  // Busca textual
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.registrationNumber.includes(q) ||
        (m.holder && m.holder.toLowerCase().includes(q))
    );
  }

  // Filtro por categoria
  if (filters.category) {
    result = result.filter(
      (m) => m.category === filters.category
    );
  }

  // Filtro por status
  if (filters.status) {
    result = result.filter(
      (m) => m.status === filters.status
    );
  }

  // Filtro por data de atualização do bulário
  if (filters.dateRange !== undefined) {
    const since = new Date();
    since.setDate(since.getDate() - filters.dateRange);
    result = result.filter(
      (m) => m.publicationDate && m.publicationDate >= since
    );
  }

  const total = result.length;
  const start = (page - 1) * limit;

  const items = result.slice(start, start + limit).map((m) => ({
    id: m.id,
    name: m.name,
    registrationNumber: m.registrationNumber,
    holder: m.holder ?? "-",
    cnpj: m.cnpj ?? "-",
    processNumber: m.processNumber ?? "-",
    publicationDate: m.publicationDate
      ? m.publicationDate.toISOString()
      : null,
    lastUpdate: m.lastUpdate
      ? m.lastUpdate.toISOString()
      : null,
    category: m.category,
    status: m.status,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/* -------------------- BUSCA RÁPIDA -------------------- */
export function searchMedications(
  query: string,
  opts?: { limit?: number }
) {
  const data = loadCSV();
  const q = query.toLowerCase();

  return data
    .filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.registrationNumber.includes(q)
    )
    .slice(0, opts?.limit || 10);
}

/* -------------------- DETALHE POR ID -------------------- */
export function getMedicationById(id: number) {
  const data = loadCSV();
  return data.find((m) => m.id === id) || null;
}

/* -------------------- ESTATÍSTICAS -------------------- */
export function getMedicationStats() {
  const data = loadCSV();
  const activeCount = data.filter((m) => m.status === "ativo").length;
  const inactiveCount = data.filter((m) => m.status !== "ativo").length;
  const now = new Date();

  const last7 = new Date();
  last7.setDate(now.getDate() - 7);

  const last30 = new Date();
  last30.setDate(now.getDate() - 30);

  const last90 = new Date();
  last90.setDate(now.getDate() - 90);

  const updatedLast7Days = data.filter(
    (m) => m.publicationDate && m.publicationDate >= last7
  ).length;
  const updatedLast30Days = data.filter(
    (m) => m.publicationDate && m.publicationDate >= last30
  ).length;
  const updatedLast90Days = data.filter(
    (m) => m.publicationDate && m.publicationDate >= last90
  ).length;

  return {
    total: data.length,
    active: activeCount,
    inactive: inactiveCount,
    updated: updatedLast30Days,
    updatedLast7Days,
    updatedLast30Days,
    updatedLast90Days,
  };
}

/* -------------------- ATUALIZAÇÕES RECENTES -------------------- */
export function getRecentUpdates(days = 7) {
  const data = loadCSV();
  const since = new Date();
  since.setDate(since.getDate() - days);

  return data
    .filter((m) => m.publicationDate && m.publicationDate >= since)
    .sort(
      (a, b) =>
        b.publicationDate.getTime() - a.publicationDate.getTime()
    )
    .slice(0, 20);
}
