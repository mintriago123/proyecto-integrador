export interface MetricSummary {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  resolutionRate: number;
  averageSolutionDays: number;
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface MonthPoint {
  month: string;
  total: number;
}

export interface YearPoint {
  year: string;
  total: number;
}

export interface ProvinceTrendPoint {
  month: string;
  [province: string]: string | number;
}

export interface HotspotPoint {
  province: string;
  lat: number;
  lon: number;
  total: number;
  women: number;
  men: number;
}

export interface StorytellingData {
  generatedAt: string;
  period: {
    fromYear: number | null;
    toYear: number | null;
  };
  metrics: MetricSummary;
  distributions: {
    byStatus: NamedValue[];
    byAgeRange: NamedValue[];
    bySex: NamedValue[];
    byProvince: NamedValue[];
    byMotivation: NamedValue[];
  };
  timelines: {
    byMonth: MonthPoint[];
    byYear: YearPoint[];
    provinceTrendByMonth: ProvinceTrendPoint[];
  };
  hotspots: HotspotPoint[];
}

export interface CountryContext {
  countryName: string;
  capital: string;
  population: number;
  area: number;
  region: string;
  flag: string;
  startOfWeek: string;
}

export interface PopulationSeriesPoint {
  year: string;
  population: number;
}
