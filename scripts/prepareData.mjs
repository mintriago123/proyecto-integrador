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

const counts = (keySelector, limit = undefined) => {
  const map = new Map();

  rows.forEach((row) => {
    const rawValue = keySelector(row);
    const key = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (!key) {
      return;
    }

    map.set(key, (map.get(key) ?? 0) + 1);
  });

  const values = Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return typeof limit === "number" ? values.slice(0, limit) : values;
};

const monthlyMap = new Map();
const yearMap = new Map();
const provinceMonthlyMap = new Map();
const hotspotMap = new Map();
let totalCases = 0;
let activeCases = 0;
let resolvedCases = 0;
let sumSolvedDays = 0;
let solvedDaysCount = 0;
let minYear = Infinity;
let maxYear = -Infinity;

rows.forEach((row) => {
  totalCases += 1;

  const status = (row.estado_desaparecido ?? "").trim();
  const currentSituation = (row.situacion_actual ?? "").trim();
  const province = (row.provincia ?? "").trim();
  const sex = (row.sexo ?? "").trim();
  const date = (row.fecha_desaparicion ?? "").trim();
  const daysValue = Number.parseFloat((row.dias_solucion_dias ?? "").trim());
  const latitude = Number.parseFloat((row.latitud_desaparicion ?? "").replace(",", "."));
  const longitude = Number.parseFloat((row.longitud_desaparicion ?? "").replace(",", "."));

  if (status === "EN INVESTIGACIÓN" || currentSituation === "DESAPARECIDO") {
    activeCases += 1;
  } else {
    resolvedCases += 1;
  }

  if (Number.isFinite(daysValue)) {
    sumSolvedDays += daysValue;
    solvedDaysCount += 1;
  }

  if (date.length >= 7) {
    const month = date.slice(0, 7);
    const year = Number.parseInt(date.slice(0, 4), 10);

    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);
    if (province) {
      const key = `${province}__${month}`;
      provinceMonthlyMap.set(key, (provinceMonthlyMap.get(key) ?? 0) + 1);
    }

    if (Number.isFinite(year)) {
      yearMap.set(String(year), (yearMap.get(String(year)) ?? 0) + 1);
      minYear = Math.min(minYear, year);
      maxYear = Math.max(maxYear, year);
    }
  }

  if (Number.isFinite(latitude) && Number.isFinite(longitude) && province && sex) {
    const roundedLat = Number(latitude.toFixed(2));
    const roundedLon = Number(longitude.toFixed(2));
    const key = `${roundedLat}|${roundedLon}|${province}`;
    const point = hotspotMap.get(key) ?? {
      province,
      lat: roundedLat,
      lon: roundedLon,
      total: 0,
      women: 0,
      men: 0,
    };

    point.total += 1;
    if (sex === "MUJER") {
      point.women += 1;
    } else if (sex === "HOMBRE") {
      point.men += 1;
    }

    hotspotMap.set(key, point);
  }
});

const topProvinces = counts((row) => row.provincia, 6).map((entry) => entry.name);
const provinceTrendByMonth = Array.from(monthlyMap.keys())
  .sort()
  .slice(-18)
  .map((month) => {
    const result = { month };

    topProvinces.forEach((province) => {
      result[province] = provinceMonthlyMap.get(`${province}__${month}`) ?? 0;
    });

    return result;
  });

const summary = {
  generatedAt: new Date().toISOString(),
  period: {
    fromYear: Number.isFinite(minYear) ? minYear : null,
    toYear: Number.isFinite(maxYear) ? maxYear : null,
  },
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
    byProvince: counts((row) => row.provincia, 10),
    byMotivation: counts((row) => row.motivacion_desaparicion_observada, 8),
  },
  timelines: {
    byMonth: Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }))
      .slice(-24),
    byYear: Array.from(yearMap.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, total]) => ({ year, total })),
    provinceTrendByMonth,
  },
  hotspots: Array.from(hotspotMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 60),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

console.log(`Summary generated at ${outputPath}`);
