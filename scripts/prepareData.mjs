import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const workspace = process.cwd();
const sourcePath = path.join(workspace, "mdi_personasdesaparecidas_limpio.csv");
const outputDir = path.join(workspace, "public", "data");
const outputPath = path.join(outputDir, "storytelling-summary.json");

const csv = fs.readFileSync(sourcePath, "utf8");
const parsed = Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
});

if (parsed.errors.length > 0) {
  throw new Error(parsed.errors[0].message);
}

const rows = parsed.data;

function cleanString(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function isMissingCategory(value) {
  const normalized = cleanString(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s_]+/g, "")
    .toUpperCase();

  return (
    normalized === "" ||
    normalized === "SINDATO" ||
    normalized === "NOAPLICA" ||
    normalized === "N/A" ||
    normalized === "NA" ||
    normalized === "NAN" ||
    normalized === "NULL" ||
    normalized === "NONE"
  );
}

function parseNumber(value) {
  const normalized = cleanString(value).replace(",", ".");
  const parsedValue = Number.parseFloat(normalized);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function counts(keySelector, limit = undefined) {
  const map = new Map();

  rows.forEach((row) => {
    const key = cleanString(keySelector(row));

    if (isMissingCategory(key)) {
      return;
    }

    map.set(key, (map.get(key) ?? 0) + 1);
  });

  const values = Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return typeof limit === "number" ? values.slice(0, limit) : values;
}

function summarizeDays(groupedRows, keySelector, limit = 10) {
  const map = new Map();

  groupedRows.forEach((row) => {
    const key = cleanString(keySelector(row));
    const days = parseNumber(row.dias_solucion_dias);

    if (isMissingCategory(key) || days === null) {
      return;
    }

    const bucket = map.get(key) ?? [];
    bucket.push(days);
    map.set(key, bucket);
  });

  return Array.from(map.entries())
    .map(([name, values]) => {
      const sorted = values.toSorted((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? (sorted[middle - 1] + sorted[middle]) / 2
          : sorted[middle];
      const total = sorted.reduce((acc, value) => acc + value, 0);

      return {
        name,
        count: sorted.length,
        avgDays: round(total / sorted.length),
        medianDays: round(median),
        minDays: round(sorted[0]),
        maxDays: round(sorted[sorted.length - 1]),
      };
    })
    .sort((a, b) => b.avgDays - a.avgDays || b.count - a.count)
    .slice(0, limit);
}

function recommendationFromScore(score) {
  if (score >= 75) {
    return "Patrullaje intensivo y seguimiento judicial";
  }

  if (score >= 55) {
    return "Prevención comunitaria focalizada y búsqueda temprana";
  }

  return "Monitoreo reforzado y coordinación territorial";
}

const monthlyMap = new Map();
const yearMap = new Map();
const hotspotMap = new Map();
const circuitsMap = new Map();
let totalCases = 0;
let activeCases = 0;
let resolvedCases = 0;
let sumSolvedDays = 0;
let solvedDaysCount = 0;
let minYear = Infinity;
let maxYear = -Infinity;

rows.forEach((row) => {
  totalCases += 1;

  const status = cleanString(row.estado_desaparecido);
  const currentSituation = cleanString(row.situacion_actual);
  const province = cleanString(row.provincia);
  const district = cleanString(row.distrito);
  const circuit = cleanString(row.circuito);
  const sex = cleanString(row.sexo);
  const date = cleanString(row.fecha_desaparicion);
  const daysValue = parseNumber(row.dias_solucion_dias);
  const latitude = parseNumber(row.latitud_desaparicion);
  const longitude = parseNumber(row.longitud_desaparicion);

  const isActive = status === "EN INVESTIGACIÓN" || currentSituation === "DESAPARECIDO";

  if (isActive) {
    activeCases += 1;
  } else {
    resolvedCases += 1;
  }

  if (daysValue !== null) {
    sumSolvedDays += daysValue;
    solvedDaysCount += 1;
  }

  if (date.length >= 7) {
    const month = date.slice(0, 7);
    const year = Number.parseInt(date.slice(0, 4), 10);

    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);

    if (Number.isFinite(year)) {
      yearMap.set(String(year), (yearMap.get(String(year)) ?? 0) + 1);
      minYear = Math.min(minYear, year);
      maxYear = Math.max(maxYear, year);
    }
  }

  if (
    latitude !== null &&
    longitude !== null &&
    !isMissingCategory(province) &&
    !isMissingCategory(sex)
  ) {
    const roundedLat = Number(latitude.toFixed(2));
    const roundedLon = Number(longitude.toFixed(2));
    const hotspotKey = `${roundedLat}|${roundedLon}|${province}`;
    const hotspot = hotspotMap.get(hotspotKey) ?? {
      province,
      lat: roundedLat,
      lon: roundedLon,
      total: 0,
      women: 0,
      men: 0,
    };

    hotspot.total += 1;
    if (sex === "MUJER") {
      hotspot.women += 1;
    } else if (sex === "HOMBRE") {
      hotspot.men += 1;
    }

    hotspotMap.set(hotspotKey, hotspot);
  }

  if (!isMissingCategory(circuit)) {
    const entry = circuitsMap.get(circuit) ?? {
      circuit,
      district: isMissingCategory(district) ? "No disponible" : district,
      province: isMissingCategory(province) ? "No disponible" : province,
      totalCases: 0,
      activeCases: 0,
      sumSolvedDays: 0,
      solvedDaysCount: 0,
    };

    entry.totalCases += 1;
    if (isActive) {
      entry.activeCases += 1;
    }
    if (daysValue !== null) {
      entry.sumSolvedDays += daysValue;
      entry.solvedDaysCount += 1;
    }

    circuitsMap.set(circuit, entry);
  }
});

const circuitEntries = Array.from(circuitsMap.values()).map((entry) => ({
  circuit: entry.circuit,
  district: entry.district,
  province: entry.province,
  totalCases: entry.totalCases,
  activeCases: entry.activeCases,
  resolutionRate:
    entry.totalCases > 0 ? (entry.totalCases - entry.activeCases) / entry.totalCases : 0,
  averageSolutionDays:
    entry.solvedDaysCount > 0 ? entry.sumSolvedDays / entry.solvedDaysCount : 0,
}));

const maxTotalCases = Math.max(...circuitEntries.map((entry) => entry.totalCases), 1);
const maxAverageSolutionDays = Math.max(
  ...circuitEntries.map((entry) => entry.averageSolutionDays),
  1,
);

const circuitPriority = circuitEntries
  .map((entry) => {
    const volumeWeight = entry.totalCases / maxTotalCases;
    const activeWeight = entry.totalCases > 0 ? entry.activeCases / entry.totalCases : 0;
    const lowResolutionWeight = 1 - entry.resolutionRate;
    const timeWeight = entry.averageSolutionDays / maxAverageSolutionDays;
    const priorityScore = round(
      (volumeWeight * 0.35 +
        activeWeight * 0.25 +
        lowResolutionWeight * 0.2 +
        timeWeight * 0.2) *
        100,
    );

    return {
      ...entry,
      averageSolutionDays: round(entry.averageSolutionDays),
      priorityScore,
      recommendedAction: recommendationFromScore(priorityScore),
    };
  })
  .sort((a, b) => b.priorityScore - a.priorityScore || b.totalCases - a.totalCases)
  .slice(0, 12);

const predictiveSummary = {
  modelName: "DecisionTreeClassifier",
  targetDefinition: "1 si el caso se mantiene en EN INVESTIGACIÓN; 0 si ya fue solucionado.",
  trainingNote:
    "Modelo reproducido desde el notebook con max_depth=5, class_weight='balanced' y random_state=42.",
  features: ["sexo", "edad", "circuito"],
  testSize: 0.2,
  accuracy: 0.69,
  confusionMatrix: {
    labels: ["Caso Solucionado", "Riesgo Crítico"],
    derivedFromRoundedReport: true,
    values: [
      { actual: "Caso Solucionado", predicted: "Caso Solucionado", value: 10025 },
      { actual: "Caso Solucionado", predicted: "Riesgo Crítico", value: 4604 },
      { actual: "Riesgo Crítico", predicted: "Caso Solucionado", value: 157 },
      { actual: "Riesgo Crítico", predicted: "Riesgo Crítico", value: 354 },
    ],
  },
  classificationReport: [
    {
      label: "Caso Solucionado",
      precision: 0.98,
      recall: 0.69,
      f1Score: 0.81,
      support: 14629,
    },
    {
      label: "Riesgo Crítico",
      precision: 0.07,
      recall: 0.69,
      f1Score: 0.13,
      support: 511,
    },
    {
      label: "Macro Avg",
      precision: 0.53,
      recall: 0.69,
      f1Score: 0.47,
      support: 15140,
    },
    {
      label: "Weighted Avg",
      precision: 0.95,
      recall: 0.69,
      f1Score: 0.79,
      support: 15140,
    },
  ],
  featureImportances: [
    { name: "sexo", importance: 60.75 },
    { name: "edad", importance: 27.32 },
    { name: "circuito", importance: 11.92 },
  ],
};

const summary = {
  generatedAt: new Date().toISOString(),
  period: {
    fromYear: Number.isFinite(minYear) ? minYear : null,
    toYear: Number.isFinite(maxYear) ? maxYear : null,
  },
  descriptive: {
    metrics: {
      totalCases,
      activeCases,
      resolvedCases,
      resolutionRate: totalCases > 0 ? resolvedCases / totalCases : 0,
      averageSolutionDays: solvedDaysCount > 0 ? sumSolvedDays / solvedDaysCount : 0,
    },
    distributions: {
      byStatus: counts((row) => row.estado_desaparecido, 6),
      byAgeRange: counts((row) => row.rango_edad, 8),
      bySex: counts((row) => row.sexo, 4),
      byEthnicity: counts((row) => row.etnia, 8),
      byProvince: counts((row) => row.provincia, 10),
      byDistrict: counts((row) => row.distrito, 10),
      byCircuit: counts((row) => row.circuito, 10),
    },
    timelines: {
      byMonth: Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, total]) => ({ label, total }))
        .slice(-24),
      byYear: Array.from(yearMap.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([label, total]) => ({ label, total })),
    },
    hotspots: Array.from(hotspotMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 60),
  },
  diagnostic: {
    byReason: summarizeDays(rows, (row) => row.motivo_desaparicion, 8),
    byObservedMotivation: summarizeDays(
      rows,
      (row) => row.motivacion_desaparicion_observada,
      8,
    ),
  },
  predictive: {
    modelSummary: predictiveSummary,
  },
  prescriptive: {
    circuitPriority,
  },
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

console.log(`Summary generated at ${outputPath}`);
