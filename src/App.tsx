import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CountryContext,
  PopulationSeriesPoint,
  StorytellingData,
} from "./types";

const statusPalette = ["#f05d5e", "#ff9f1c", "#5ab1ef", "#9a6bff", "#1f305e", "#9aa5ce"];
const sexPalette = ["#f3b4c8", "#4d7cff", "#9aa5ce", "#ecf1ff"];

const compactNumber = new Intl.NumberFormat("es-EC", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullNumber = new Intl.NumberFormat("es-EC");

const percentage = new Intl.NumberFormat("es-EC", {
  style: "percent",
  maximumFractionDigits: 1,
});

const fallbackCountry: CountryContext = {
  countryName: "Ecuador",
  capital: "Quito",
  population: 18001200,
  area: 256370,
  region: "Americas",
  flag: "/ecuador-flag.svg",
  startOfWeek: "monday",
};

const fallbackPopulationSeries: PopulationSeriesPoint[] = [
  { year: "2014", population: 16027595 },
  { year: "2015", population: 16212022 },
  { year: "2016", population: 16385068 },
  { year: "2017", population: 16557111 },
  { year: "2018", population: 17015672 },
  { year: "2019", population: 17343740 },
  { year: "2020", population: 17588595 },
  { year: "2021", population: 17797737 },
  { year: "2022", population: 18001000 },
  { year: "2023", population: 18190484 },
];

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-");
  return new Intl.DateTimeFormat("es-EC", {
    month: "short",
    year: "2-digit",
  }).format(new Date(Number(year), Number(monthNumber) - 1, 1));
}

function StatCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: string;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <span className="stat-tone">{tone}</span>
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <header className="section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </header>
  );
}

function App() {
  const [storyData, setStoryData] = useState<StorytellingData | null>(null);
  const [country, setCountry] = useState<CountryContext | null>(null);
  const [populationSeries, setPopulationSeries] = useState<PopulationSeriesPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const storyResponse = await fetch("/data/storytelling-summary.json", {
          signal: controller.signal,
        });

        if (!storyResponse.ok) {
          throw new Error("No se pudo cargar el resumen local.");
        }

        const storyJson = (await storyResponse.json()) as StorytellingData;
        setStoryData(storyJson);

        const [countryResult, populationResult] = await Promise.allSettled([
          fetch("/api/worldbank/v2/country/ECU?format=json", {
            signal: controller.signal,
          }),
          fetch(
            "/api/worldbank/v2/country/ECU/indicator/SP.POP.TOTL?format=json&per_page=12",
            { signal: controller.signal },
          ),
        ]);

        if (countryResult.status === "fulfilled" && countryResult.value.ok) {
          const countryJson = (await countryResult.value.json()) as [
            unknown,
            Array<{
              name: string;
              capitalCity: string;
              region: { value: string };
            }>,
          ];
          const countryEntry = countryJson[1]?.[0];

          setCountry({
            countryName: countryEntry?.name ?? fallbackCountry.countryName,
            capital: countryEntry?.capitalCity ?? fallbackCountry.capital,
            population: fallbackCountry.population,
            area: fallbackCountry.area,
            region: countryEntry?.region.value ?? fallbackCountry.region,
            flag: fallbackCountry.flag,
            startOfWeek: fallbackCountry.startOfWeek,
          });
        } else {
          setCountry(fallbackCountry);
        }

        if (populationResult.status === "fulfilled" && populationResult.value.ok) {
          const populationJson = (await populationResult.value.json()) as [
            unknown,
            Array<{ date: string; value: number | null }>,
          ];

          const populationPoints = (populationJson[1] ?? [])
            .filter((item) => item.value !== null)
            .map((item) => ({
              year: item.date,
              population: item.value ?? 0,
            }))
            .sort((a, b) => Number(a.year) - Number(b.year));

          setPopulationSeries(
            populationPoints.length > 0 ? populationPoints : fallbackPopulationSeries,
          );
        } else {
          setPopulationSeries(fallbackPopulationSeries);
        }
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") {
          return;
        }
        setError("No se pudo construir la narrativa con los archivos locales disponibles.");
      }
    }

    load();

    return () => controller.abort();
  }, []);

  if (error) {
    return <main className="status-panel">{error}</main>;
  }

  if (!storyData || !country) {
    return <main className="status-panel">Cargando historia de datos...</main>;
  }

  const topProvince = storyData.distributions.byProvince[0];
  const topAgeRange = storyData.distributions.byAgeRange[0];
  const topStatus = storyData.distributions.byStatus[0];
  const latestMonth = storyData.timelines.byMonth.at(-1);
  const monthlyAverage =
    storyData.timelines.byMonth.reduce((acc, point) => acc + point.total, 0) /
    Math.max(storyData.timelines.byMonth.length, 1);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Storytelling de datos | Ecuador</p>
          <h1>Latidos Ausentes</h1>
          <p className="hero-text">
            Una narrativa visual sobre la dimensión humana y territorial de las
            desapariciones. La historia combina el archivo actual del proyecto con
            dos APIs públicas para situar el fenómeno dentro del contexto nacional.
          </p>
          <div className="hero-badges">
            <span>Fuente base: `mdi_personasdesaparecidas_limpio.csv`</span>
            <span>APIs: World Bank Country + World Bank Indicator</span>
          </div>
        </div>

        <aside className="hero-context">
          <img src={country.flag} alt={`Bandera de ${country.countryName}`} />
          <div>
            <p className="context-label">Contexto país</p>
            <h2>{country.countryName}</h2>
            <p>
              Capital: {country.capital} · Región: {country.region}
            </p>
            <p>
              Población estimada: {fullNumber.format(country.population)} · Área:{" "}
              {fullNumber.format(Math.round(country.area))} km²
            </p>
          </div>
        </aside>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Casos históricos"
          value={compactNumber.format(storyData.metrics.totalCases)}
          tone="01"
          detail={`Cobertura ${storyData.period.fromYear}-${storyData.period.toYear}`}
        />
        <StatCard
          label="Casos activos"
          value={compactNumber.format(storyData.metrics.activeCases)}
          tone="02"
          detail={`${percentage.format(
            storyData.metrics.activeCases / storyData.metrics.totalCases,
          )} del total sigue en investigación`}
        />
        <StatCard
          label="Resolución estimada"
          value={percentage.format(storyData.metrics.resolutionRate)}
          tone="03"
          detail={`${compactNumber.format(storyData.metrics.resolvedCases)} casos cerrados`}
        />
        <StatCard
          label="Tiempo promedio"
          value={`${storyData.metrics.averageSolutionDays.toFixed(1)} días`}
          tone="04"
          detail="Promedio de solución para casos con cierre registrado"
        />
      </section>

      <section className="story-grid">
        <article className="story-card spotlight">
          <SectionHeading
            eyebrow="Ritmo temporal"
            title="La presión no es episódica: se sostiene mes a mes"
            copy={`En el último mes del resumen se registran ${latestMonth?.total ?? 0} casos. El promedio reciente ronda ${monthlyAverage.toFixed(
              0,
            )} reportes mensuales.`}
          />
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={storyData.timelines.byMonth}>
              <defs>
                <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="#9fb0d9"
                tickLine={false}
              />
              <YAxis stroke="#9fb0d9" tickLine={false} />
              <Tooltip
                formatter={(value) => [fullNumber.format(Number(value)), "Casos"]}
                labelFormatter={(label) =>
                  typeof label === "string" ? formatMonth(label) : String(label)
                }
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#ff6b6b"
                strokeWidth={3}
                fill="url(#monthlyFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        <article className="story-card narrative-block">
          <SectionHeading
            eyebrow="Lectura rápida"
            title="Tres señales dominan la historia"
            copy="La mayor carga se concentra en un patrón territorial claro, un grupo etario dominante y una categoría de estado con fuerte peso sobre el total."
          />
          <ul className="insight-list">
            <li>
              <strong>{topProvince?.name}</strong> lidera la concentración territorial con{" "}
              {compactNumber.format(topProvince?.value ?? 0)} registros.
            </li>
            <li>
              <strong>{topAgeRange?.name}</strong> es el grupo etario más expuesto en el
              dataset actual.
            </li>
            <li>
              <strong>{topStatus?.name}</strong> aparece como el estado más repetido, lo
              que define el tono general de la base histórica.
            </li>
          </ul>
        </article>

        <article className="story-card">
          <SectionHeading
            eyebrow="¿Quiénes?"
            title="La distribución por sexo y edad no es homogénea"
            copy="Las diferencias demográficas cambian la lectura del problema. Aquí se observa qué perfiles concentran más registros."
          />
          <div className="split-chart">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={storyData.distributions.bySex}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={3}
                >
                  {storyData.distributions.bySex.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={sexPalette[index % sexPalette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={storyData.distributions.byAgeRange}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#9fb0d9" tickLine={false} />
                <YAxis stroke="#9fb0d9" tickLine={false} />
                <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#6ac7ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="story-card">
          <SectionHeading
            eyebrow="¿Dónde?"
            title="La geografía repite focos persistentes"
            copy="En lugar de un mapa decorativo, este plano de coordenadas resume los hotspots más densos y permite comparar volumen por punto."
          />
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis
                type="number"
                dataKey="lon"
                name="Longitud"
                stroke="#9fb0d9"
                domain={["dataMin - 0.2", "dataMax + 0.2"]}
              />
              <YAxis
                type="number"
                dataKey="lat"
                name="Latitud"
                stroke="#9fb0d9"
                domain={["dataMin - 0.2", "dataMax + 0.2"]}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value, _name, payload) => {
                  if (payload?.dataKey === "total") {
                    return [fullNumber.format(Number(value)), "Casos agrupados"];
                  }
                  return [value, payload?.name ?? ""];
                }}
                contentStyle={{ background: "#0f1731", border: "1px solid #30406f" }}
                labelFormatter={(_, points) =>
                  points?.[0]?.payload
                    ? `${points[0].payload.province} · ${points[0].payload.lat}, ${points[0].payload.lon}`
                    : ""
                }
              />
              <Scatter data={storyData.hotspots} fill="#ff8c69">
                {storyData.hotspots.map((point) => (
                  <Cell
                    key={`${point.province}-${point.lat}-${point.lon}`}
                    fill={point.total > 120 ? "#ff5d73" : "#ffb26b"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </article>

        <article className="story-card">
          <SectionHeading
            eyebrow="Territorio"
            title="Las provincias marcan la diferencia"
            copy="Las diez provincias con mayor volumen delimitan el frente operativo del problema."
          />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={storyData.distributions.byProvince}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis type="number" stroke="#9fb0d9" tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                width={96}
                stroke="#9fb0d9"
                tickLine={false}
              />
              <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                {storyData.distributions.byProvince.map((entry, index) => (
                  <Cell key={entry.name} fill={statusPalette[index % statusPalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="story-card">
          <SectionHeading
            eyebrow="Motivaciones observadas"
            title="Los registros narran más de una causa"
            copy="La base no refleja una sola dinámica. La mezcla de factores familiares, personales y violentos exige lecturas diferenciadas."
          />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={storyData.distributions.byMotivation}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#9fb0d9"
                tickLine={false}
                interval={0}
                angle={-16}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9fb0d9" tickLine={false} />
              <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#8d7dff" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="story-card wide">
          <SectionHeading
            eyebrow="Contexto nacional"
            title="El país también cambia mientras cambian los casos"
            copy="Las APIs públicas agregan una capa de contexto: ficha país actual y serie poblacional histórica desde dos endpoints del World Bank."
          />
          <div className="split-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={populationSeries}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="year" stroke="#9fb0d9" tickLine={false} />
                <YAxis
                  stroke="#9fb0d9"
                  tickLine={false}
                  tickFormatter={(value) => compactNumber.format(Number(value))}
                />
                <Tooltip
                  formatter={(value) => [fullNumber.format(Number(value)), "Población"]}
                />
                <Line
                  type="monotone"
                  dataKey="population"
                  stroke="#6ae3c1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#6ae3c1" }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="api-callout">
              <p className="eyebrow">Lectura cruzada</p>
              <h3>
                {country.countryName} inicia la semana en {country.startOfWeek} y supera los{" "}
                {compactNumber.format(country.population)} habitantes.
              </h3>
              <p>
                Ese contexto importa: el volumen absoluto de casos debe leerse junto al
                tamaño poblacional, la distribución urbana y la concentración territorial
                que muestran las provincias líderes del dataset.
              </p>
              <p>
                La app consulta en vivo:
                <br />
                `/api/worldbank/v2/country/ECU?format=json`
                <br />
                `/api/worldbank/v2/country/ECU/indicator/SP.POP.TOTL`
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default App;
