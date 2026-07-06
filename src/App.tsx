import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  CircuitPriority,
  CountryContext,
  DistributionItem,
  PopulationSeriesPoint,
  PredictiveSummary,
  StorytellingData,
} from "./types";

const categoricalPalette = [
  "#ff6b6b",
  "#6ac7ff",
  "#f7b267",
  "#6ae3c1",
  "#8d7dff",
  "#f3b4c8",
  "#b7d27b",
  "#ff9f1c",
];

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

function formatMonth(label: string) {
  const [year, monthNumber] = label.split("-");
  return new Intl.DateTimeFormat("es-EC", {
    month: "short",
    year: "2-digit",
  }).format(new Date(Number(year), Number(monthNumber) - 1, 1));
}

function formatDays(value: number) {
  return `${value.toFixed(1)} días`;
}

function sentenceFromTop(items: DistributionItem[], fallbackLabel: string) {
  if (items.length === 0) {
    return fallbackLabel;
  }

  return `${items[0].name} (${compactNumber.format(items[0].value)})`;
}

function shortenLabel(value: string, limit = 16) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1)}…`;
}

function usePanelFocus() {
  const ref = useRef<HTMLElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting && entry.intersectionRatio > 0.35);
      },
      {
        threshold: [0.2, 0.35, 0.55, 0.75],
        rootMargin: "-8% 0px -8% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, isActive };
}

function useCompactLayout() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsCompact(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isCompact;
}

function StoryPanel({
  children,
  className = "",
}: {
  children: (isActive: boolean) => ReactNode;
  className?: string;
}) {
  const { ref, isActive } = usePanelFocus();

  return (
    <article
      ref={ref}
      className={`story-card reveal-panel ${className}`.trim()}
      data-active={isActive}
    >
      {children(isActive)}
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

function ChapterHeading({
  index,
  title,
  question,
  answer,
}: {
  index: string;
  title: string;
  question: string;
  answer: string;
}) {
  return (
    <header className="chapter-heading">
      <div className="chapter-tag">{index}</div>
      <div className="chapter-copy">
        <p className="chapter-label">{title}</p>
        <h2>{question}</h2>
        <p>{answer}</p>
      </div>
    </header>
  );
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

function InsightStrip({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="insight-strip">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function ConfusionMatrixCard({ summary }: { summary: PredictiveSummary }) {
  const maxValue = Math.max(...summary.confusionMatrix.values.map((cell) => cell.value), 1);

  return (
    <div className="matrix-grid">
      {summary.confusionMatrix.values.map((cell) => (
        <div
          key={`${cell.actual}-${cell.predicted}`}
          className="matrix-cell"
          style={{
            background: `rgba(106, 199, 255, ${0.2 + (cell.value / maxValue) * 0.55})`,
          }}
        >
          <span>{cell.actual}</span>
          <strong>{fullNumber.format(cell.value)}</strong>
          <p>{cell.predicted}</p>
        </div>
      ))}
    </div>
  );
}

function CircuitTable({ circuits }: { circuits: CircuitPriority[] }) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Circuito</th>
            <th>Distrito</th>
            <th>Provincia</th>
            <th>Casos</th>
            <th>Activos</th>
            <th>Resolución</th>
            <th>Días</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {circuits.map((entry) => (
            <tr key={entry.circuit}>
              <td>{entry.circuit}</td>
              <td>{entry.district}</td>
              <td>{entry.province}</td>
              <td>{fullNumber.format(entry.totalCases)}</td>
              <td>{fullNumber.format(entry.activeCases)}</td>
              <td>{percentage.format(entry.resolutionRate)}</td>
              <td>{formatDays(entry.averageSolutionDays)}</td>
              <td>{entry.recommendedAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [storyData, setStoryData] = useState<StorytellingData | null>(null);
  const [country, setCountry] = useState<CountryContext | null>(null);
  const [populationSeries, setPopulationSeries] = useState<PopulationSeriesPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isCompact = useCompactLayout();

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
          fetch("/api/worldbank/country/ECU?format=json", {
            signal: controller.signal,
          }),
          fetch(
            "/api/worldbank/country/ECU/indicator/SP.POP.TOTL?format=json&per_page=12",
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

  const { descriptive, diagnostic, predictive, prescriptive, period } = storyData;
  const latestMonth = descriptive.timelines.byMonth.at(-1);
  const dominantProvince = sentenceFromTop(
    descriptive.distributions.byProvince,
    "sin provincia líder",
  );
  const dominantAgeRange = sentenceFromTop(
    descriptive.distributions.byAgeRange,
    "sin grupo etario dominante",
  );
  const dominantEthnicity = sentenceFromTop(
    descriptive.distributions.byEthnicity,
    "sin etnia consolidada",
  );
  const slowestReason = diagnostic.byReason[0];
  const slowestMotivation = diagnostic.byObservedMotivation[0];
  const topPriorityCircuit = prescriptive.circuitPriority[0];
  const highPriorityCount = prescriptive.circuitPriority.filter(
    (entry) => entry.priorityScore >= 75,
  ).length;

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Storytelling de datos | Ecuador</p>
          <h1>Latidos Ausentes</h1>
          <p className="hero-text">
            La app ahora responde de forma directa las cuatro analíticas del proyecto:
            qué ocurrió, por qué algunos casos tardan más, cómo se estima el riesgo y
            dónde conviene concentrar la respuesta operativa.
          </p>
          <div className="hero-badges">
            <span>Fuente base: `mdi_personasdesaparecidas_limpio.csv`</span>
            <span>Periodo: {period.fromYear}-{period.toYear}</span>
            <span>APIs: World Bank Country + Population</span>
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
          value={compactNumber.format(descriptive.metrics.totalCases)}
          tone="01"
          detail={`Cobertura ${period.fromYear}-${period.toYear}`}
        />
        <StatCard
          label="Casos activos"
          value={compactNumber.format(descriptive.metrics.activeCases)}
          tone="02"
          detail={`${percentage.format(
            descriptive.metrics.activeCases / descriptive.metrics.totalCases,
          )} del total sigue en investigación`}
        />
        <StatCard
          label="Resolución"
          value={percentage.format(descriptive.metrics.resolutionRate)}
          tone="03"
          detail={`${compactNumber.format(descriptive.metrics.resolvedCases)} casos cerrados`}
        />
        <StatCard
          label="Tiempo promedio"
          value={formatDays(descriptive.metrics.averageSolutionDays)}
          tone="04"
          detail="Promedio de solución para casos con cierre registrado"
        />
      </section>

      <section className="chapter-section">
        <ChapterHeading
          index="01"
          title="Analítica Descriptiva"
          question="¿Cuál es el comportamiento histórico de las desapariciones en Ecuador?"
          answer={`Entre ${period.fromYear} y ${period.toYear} se registran ${compactNumber.format(
            descriptive.metrics.totalCases,
          )} casos. La concentración más alta aparece en ${dominantProvince}, con predominio del grupo ${dominantAgeRange} y fuerte peso de ${dominantEthnicity}.`}
        />

        <div className="story-grid">
          <StoryPanel className="spotlight">
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Volumen temporal"
                  title="La serie histórica mantiene una carga constante"
                  copy={`El último mes resumido registra ${fullNumber.format(
                    latestMonth?.total ?? 0,
                  )} casos. La lectura anual permite ubicar la persistencia del fenómeno y no solo un pico aislado.`}
                />
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={descriptive.timelines.byYear}>
                      <defs>
                        <linearGradient id="descriptiveFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="#9fb0d9" tickLine={false} />
                      <YAxis stroke="#9fb0d9" tickLine={false} />
                      <Tooltip formatter={(value) => [fullNumber.format(Number(value)), "Casos"]} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#ff6b6b"
                        strokeWidth={3}
                        fill="url(#descriptiveFill)"
                        isAnimationActive={isActive}
                        animationDuration={950}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel>
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Demografía"
                  title="Sexo y edad concentran perfiles muy definidos"
                  copy="La distribución demográfica no es pareja. La combinación de sexo y rango etario permite entender mejor los grupos más expuestos."
                />
                <div className="split-chart">
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={descriptive.distributions.bySex}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={92}
                          isAnimationActive={isActive}
                          animationDuration={850}
                        >
                          {descriptive.distributions.bySex.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={categoricalPalette[index % categoricalPalette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={descriptive.distributions.byAgeRange}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="name" stroke="#9fb0d9" tickLine={false} />
                        <YAxis stroke="#9fb0d9" tickLine={false} />
                        <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
                        <Bar
                          dataKey="value"
                          fill="#6ac7ff"
                          radius={[10, 10, 0, 0]}
                          isAnimationActive={isActive}
                          animationDuration={900}
                          animationBegin={120}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel>
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Diversidad social"
                  title="La etnia y el distrito agregan lectura territorial fina"
                  copy="El análisis deja de ser nacional cuando se observan distritos y composición étnica. Ahí aparecen focos concretos de intervención."
                />
                <div className="split-chart">
                  <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={descriptive.distributions.byEthnicity}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickFormatter={(value) => shortenLabel(String(value), isCompact ? 10 : 16)}
                        stroke="#9fb0d9"
                        tickLine={false}
                        interval={0}
                        angle={isCompact ? -28 : -18}
                        textAnchor="end"
                        height={isCompact ? 110 : 90}
                      />
                        <YAxis stroke="#9fb0d9" tickLine={false} />
                        <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
                        <Bar
                          dataKey="value"
                          fill="#f7b267"
                          radius={[10, 10, 0, 0]}
                          isAnimationActive={isActive}
                          animationDuration={900}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={descriptive.distributions.byDistrict}
                        layout="vertical"
                        margin={{ left: 20, right: 10 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                        <XAxis type="number" stroke="#9fb0d9" tickLine={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={128}
                          stroke="#9fb0d9"
                          tickLine={false}
                        />
                        <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
                        <Bar
                          dataKey="value"
                          fill="#6ae3c1"
                          radius={[0, 10, 10, 0]}
                          isAnimationActive={isActive}
                          animationDuration={920}
                          animationBegin={140}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel className="wide">
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Geografía"
                  title="Provincia, circuito y hotspots muestran la densidad operativa"
                  copy="La mayor carga territorial se concentra en pocos nodos. Eso permite pasar de la descripción general a una lectura espacial útil para decisiones."
                />
                <div className="split-chart">
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={330}>
                      <BarChart
                        data={descriptive.distributions.byProvince}
                        layout="vertical"
                        margin={{ left: 20, right: 10 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                        <XAxis type="number" stroke="#9fb0d9" tickLine={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={110}
                          stroke="#9fb0d9"
                          tickLine={false}
                        />
                        <Tooltip formatter={(value) => fullNumber.format(Number(value))} />
                        <Bar
                          dataKey="value"
                          radius={[0, 10, 10, 0]}
                          isAnimationActive={isActive}
                          animationDuration={920}
                        >
                          {descriptive.distributions.byProvince.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={categoricalPalette[index % categoricalPalette.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={330}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <XAxis
                          type="number"
                          dataKey="lon"
                          stroke="#9fb0d9"
                          domain={["dataMin - 0.2", "dataMax + 0.2"]}
                        />
                        <YAxis
                          type="number"
                          dataKey="lat"
                          stroke="#9fb0d9"
                          domain={["dataMin - 0.2", "dataMax + 0.2"]}
                        />
                        <Tooltip
                          formatter={(value) => fullNumber.format(Number(value))}
                          labelFormatter={(_, points) =>
                            points?.[0]?.payload
                              ? `${points[0].payload.province} · ${points[0].payload.lat}, ${points[0].payload.lon}`
                              : ""
                          }
                        />
                        <Scatter
                          data={descriptive.hotspots}
                          fill="#ff8c69"
                          isAnimationActive={isActive}
                          animationDuration={950}
                        >
                          {descriptive.hotspots.map((point) => (
                            <Cell
                              key={`${point.province}-${point.lat}-${point.lon}`}
                              fill={point.total > 120 ? "#ff5d73" : "#ffb26b"}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </StoryPanel>
        </div>
      </section>

      <section className="chapter-section">
        <ChapterHeading
          index="02"
          title="Analítica Diagnóstica"
          question="¿Por qué ciertos casos tardan más tiempo en resolverse que otros?"
          answer={`Los mayores tiempos promedio aparecen en ${slowestReason?.name ?? "motivos sin datos"} con ${formatDays(
            slowestReason?.avgDays ?? 0,
          )}. En la motivación observada resalta ${slowestMotivation?.name ?? "sin categoría dominante"} con ${formatDays(
            slowestMotivation?.avgDays ?? 0,
          )}.`}
        />

        <div className="story-grid">
          <StoryPanel className="spotlight">
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Cuello de botella"
                  title="Los motivos del caso explican parte del retraso"
                  copy="La comparación del promedio y la mediana de días de solución por motivo permite identificar rutas de investigación que demandan más tiempo."
                />
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={diagnostic.byReason}
                      layout={isCompact ? "vertical" : "horizontal"}
                      margin={isCompact ? { left: 10, right: 10 } : undefined}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      {isCompact ? (
                        <>
                          <XAxis type="number" stroke="#9fb0d9" tickLine={false} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={132}
                            stroke="#9fb0d9"
                            tickLine={false}
                            tickFormatter={(value) => shortenLabel(String(value), 18)}
                          />
                        </>
                      ) : (
                        <>
                          <XAxis
                            dataKey="name"
                            stroke="#9fb0d9"
                            tickLine={false}
                            interval={0}
                            angle={-18}
                            textAnchor="end"
                            height={90}
                            tickFormatter={(value) => shortenLabel(String(value), 18)}
                          />
                          <YAxis stroke="#9fb0d9" tickLine={false} />
                        </>
                      )}
                      <Tooltip formatter={(value) => formatDays(Number(value))} />
                      <Bar
                        dataKey="avgDays"
                        fill="#ff6b6b"
                        radius={isCompact ? [0, 10, 10, 0] : [10, 10, 0, 0]}
                        isAnimationActive={isActive}
                        animationDuration={950}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel>
            {() => (
              <>
                <SectionHeading
                  eyebrow="Lectura puntual"
                  title="El promedio no cuenta toda la historia"
                  copy="La mediana y el rango ayudan a distinguir entre causas consistentemente lentas y causas afectadas por pocos casos extremos."
                />
                <div className="strip-grid">
                  {diagnostic.byReason.slice(0, 4).map((entry) => (
                    <InsightStrip
                      key={entry.name}
                      label={entry.name}
                      value={formatDays(entry.avgDays)}
                      detail={`Mediana ${formatDays(entry.medianDays)} · ${entry.count} casos con cierre`}
                    />
                  ))}
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel className="wide">
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Motivación observada"
                  title="La causa registrada y la motivación observada no siempre pesan igual"
                  copy="Esta segunda capa muestra qué motivaciones operativas prolongan más la resolución y cuáles podrían requerir protocolos diferenciados."
                />
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={diagnostic.byObservedMotivation}
                      layout={isCompact ? "vertical" : "horizontal"}
                      margin={isCompact ? { left: 10, right: 10 } : undefined}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      {isCompact ? (
                        <>
                          <XAxis type="number" stroke="#9fb0d9" tickLine={false} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={132}
                            stroke="#9fb0d9"
                            tickLine={false}
                            tickFormatter={(value) => shortenLabel(String(value), 18)}
                          />
                        </>
                      ) : (
                        <>
                          <XAxis
                            dataKey="name"
                            stroke="#9fb0d9"
                            tickLine={false}
                            interval={0}
                            angle={-18}
                            textAnchor="end"
                            height={96}
                            tickFormatter={(value) => shortenLabel(String(value), 18)}
                          />
                          <YAxis stroke="#9fb0d9" tickLine={false} />
                        </>
                      )}
                      <Tooltip formatter={(value) => formatDays(Number(value))} />
                      <Bar
                        dataKey="avgDays"
                        fill="#8d7dff"
                        radius={isCompact ? [0, 10, 10, 0] : [10, 10, 0, 0]}
                        isAnimationActive={isActive}
                        animationDuration={980}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </StoryPanel>
        </div>
      </section>

      <section className="chapter-section">
        <ChapterHeading
          index="03"
          title="Analítica Predictiva"
          question="¿Es posible determinar el nivel de riesgo de una nueva denuncia?"
          answer={`Sí, con un árbol de decisión balanceado que usa ${predictive.modelSummary.features.join(
            ", ",
          )}. El modelo conserva un recall alto para casos críticos, pero con precisión baja, así que sirve como alerta temprana y no como decisión final.`}
        />

        <div className="story-grid">
          <StoryPanel>
            {() => (
              <>
                <SectionHeading
                  eyebrow="Modelo"
                  title="El clasificador está pensado como filtro operativo"
                  copy={predictive.modelSummary.trainingNote}
                />
                <div className="strip-grid">
                  <InsightStrip
                    label="Modelo"
                    value={predictive.modelSummary.modelName}
                    detail={predictive.modelSummary.targetDefinition}
                  />
                  <InsightStrip
                    label="Accuracy"
                    value={percentage.format(predictive.modelSummary.accuracy)}
                    detail="Métrica global sobre el set de prueba"
                  />
                  <InsightStrip
                    label="Variables"
                    value={predictive.modelSummary.features.join(", ")}
                    detail={`Test size ${(predictive.modelSummary.testSize * 100).toFixed(0)}%`}
                  />
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel>
            {() => (
              <>
                <SectionHeading
                  eyebrow="Matriz de confusión"
                  title="El modelo detecta riesgo, pero produce muchas falsas alertas"
                  copy="La sensibilidad para casos críticos es útil, aunque la baja precisión obliga a usar la salida como semáforo de priorización y no como cierre categórico."
                />
                <ConfusionMatrixCard summary={predictive.modelSummary} />
              </>
            )}
          </StoryPanel>

          <StoryPanel>
            {() => (
              <>
                <SectionHeading
                  eyebrow="Reporte"
                  title="El recall del riesgo crítico es la señal más útil"
                  copy="Para operación temprana importa más no dejar pasar un caso crítico que reducir todas las falsas alarmas desde el primer filtro."
                />
                <div className="table-shell">
                  <table className="data-table compact-table">
                    <thead>
                      <tr>
                        <th>Clase</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1</th>
                        <th>Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictive.modelSummary.classificationReport.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td>{percentage.format(row.precision)}</td>
                          <td>{percentage.format(row.recall)}</td>
                          <td>{percentage.format(row.f1Score)}</td>
                          <td>{fullNumber.format(row.support)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel>
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Variables influyentes"
                  title="Sexo y edad dominan la decisión del árbol"
                  copy="La señal territorial existe, pero en este modelo su peso es menor al de los atributos básicos de la víctima."
                />
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={predictive.modelSummary.featureImportances}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="name" stroke="#9fb0d9" tickLine={false} />
                      <YAxis stroke="#9fb0d9" tickLine={false} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                      <Bar
                        dataKey="importance"
                        fill="#6ae3c1"
                        radius={[10, 10, 0, 0]}
                        isAnimationActive={isActive}
                        animationDuration={900}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </StoryPanel>
        </div>
      </section>

      <section className="chapter-section">
        <ChapterHeading
          index="04"
          title="Analítica Prescriptiva"
          question="¿Cómo optimizar el despliegue policial y la prevención comunitaria?"
          answer={`La priorización técnica sitúa a ${topPriorityCircuit?.circuit ?? "sin circuito líder"} como primer frente operativo con score ${topPriorityCircuit?.priorityScore.toFixed(
            1,
          ) ?? "0.0"}. Hay ${highPriorityCount} circuitos en prioridad alta dentro del top resumido.`}
        />

        <div className="story-grid">
          <StoryPanel>
            {() => (
              <>
                <SectionHeading
                  eyebrow="Criterio"
                  title="La prioridad combina volumen, casos activos, resolución y tiempo"
                  copy="El score es transparente: sube cuando un circuito acumula más casos, sostiene más activos, resuelve menos y tarda más."
                />
                <div className="strip-grid">
                  <InsightStrip
                    label="Circuito líder"
                    value={topPriorityCircuit?.circuit ?? "Sin dato"}
                    detail={`${topPriorityCircuit?.district ?? "Sin distrito"} · ${topPriorityCircuit?.province ?? "Sin provincia"}`}
                  />
                  <InsightStrip
                    label="Score"
                    value={topPriorityCircuit ? topPriorityCircuit.priorityScore.toFixed(1) : "0.0"}
                    detail={topPriorityCircuit?.recommendedAction ?? "Sin recomendación"}
                  />
                  <InsightStrip
                    label="Alta prioridad"
                    value={String(highPriorityCount)}
                    detail="Circuitos del ranking con score igual o superior a 75"
                  />
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel>
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="Ranking"
                  title="La intervención debe empezar donde la carga combinada es mayor"
                  copy="Este ranking no reemplaza el criterio operativo, pero ayuda a ordenar patrullaje, prevención y seguimiento territorial."
                />
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={prescriptive.circuitPriority.slice(0, 8)}
                      layout="vertical"
                      margin={{ left: 30, right: 10 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                      <XAxis type="number" stroke="#9fb0d9" tickLine={false} />
                      <YAxis
                        dataKey="circuit"
                        type="category"
                        width={120}
                        stroke="#9fb0d9"
                        tickLine={false}
                      />
                      <Tooltip formatter={(value) => Number(value).toFixed(1)} />
                      <Bar
                        dataKey="priorityScore"
                        fill="#ff9f1c"
                        radius={[0, 10, 10, 0]}
                        isAnimationActive={isActive}
                        animationDuration={940}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </StoryPanel>

          <StoryPanel className="wide">
            {() => (
              <>
                <SectionHeading
                  eyebrow="Acción recomendada"
                  title="Cada circuito priorizado queda listo para decisión operativa"
                  copy="El tablero resume en una sola vista dónde intervenir primero y con qué tipo de respuesta sugerida."
                />
                <CircuitTable circuits={prescriptive.circuitPriority} />
              </>
            )}
          </StoryPanel>
        </div>
      </section>

      <section className="chapter-section chapter-section--context">
        <ChapterHeading
          index="05"
          title="Contexto Externo"
          question="¿Cómo se interpreta el problema dentro del contexto nacional?"
          answer="Las APIs públicas agregan una referencia de país y una serie poblacional histórica para que el volumen absoluto de casos no se lea fuera de escala territorial."
        />
        <div className="story-grid">
          <StoryPanel className="wide">
            {(isActive) => (
              <>
                <SectionHeading
                  eyebrow="World Bank"
                  title="El tamaño del país importa para leer el volumen del fenómeno"
                  copy={`La app consulta en vivo la ficha país y la serie poblacional de ${country.countryName}. El contexto ayuda a ubicar la presión operativa dentro de una población de ${compactNumber.format(
                    country.population,
                  )} habitantes.`}
                />
                <div className="split-chart">
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={populationSeries}>
                        <defs>
                          <linearGradient id="populationFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6ae3c1" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#6ae3c1" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
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
                        <Area
                          type="monotone"
                          dataKey="population"
                          stroke="#6ae3c1"
                          strokeWidth={3}
                          fill="url(#populationFill)"
                          isAnimationActive={isActive}
                          animationDuration={940}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="api-callout">
                    <p className="eyebrow">Fuentes</p>
                    <h3>El tamaño del país importa para leer la escala del fenómeno.</h3>
                    <div className="api-callout-metrics">
                      <div>
                        <span>Habitantes</span>
                        <strong>{compactNumber.format(country.population)}</strong>
                      </div>
                      <div>
                        <span>Capital</span>
                        <strong>{country.capital}</strong>
                      </div>
                      <div>
                        <span>Inicio de semana</span>
                        <strong>{country.startOfWeek}</strong>
                      </div>
                    </div>
                    <p className="api-callout-copy">
                      Las consultas externas no explican los casos; aportan escala país para
                      interpretar el volumen local dentro del contexto nacional.
                    </p>
                    <div className="api-endpoints">
                      <code>/api/worldbank/country/ECU?format=json</code>
                      <code>/api/worldbank/country/ECU/indicator/SP.POP.TOTL?format=json&amp;per_page=12</code>
                    </div>
                  </div>
                </div>
              </>
            )}
          </StoryPanel>
        </div>
      </section>
    </main>
  );
}

export default App;
