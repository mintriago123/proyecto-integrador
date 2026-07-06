export interface MetricSummary {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  resolutionRate: number;
  averageSolutionDays: number;
}

export interface DistributionItem {
  name: string;
  value: number;
}

export interface TimelinePoint {
  label: string;
  total: number;
}

export interface HotspotPoint {
  province: string;
  lat: number;
  lon: number;
  total: number;
  women: number;
  men: number;
}

export interface ReasonDiagnostic {
  name: string;
  count: number;
  avgDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
}

export interface ClassificationReportItem {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface ConfusionMatrixCell {
  actual: string;
  predicted: string;
  value: number;
}

export interface FeatureImportance {
  name: string;
  importance: number;
}

export interface PredictiveSummary {
  modelName: string;
  targetDefinition: string;
  trainingNote: string;
  features: string[];
  testSize: number;
  accuracy: number;
  confusionMatrix: {
    labels: string[];
    derivedFromRoundedReport: boolean;
    values: ConfusionMatrixCell[];
  };
  classificationReport: ClassificationReportItem[];
  featureImportances: FeatureImportance[];
}

export interface CircuitPriority {
  circuit: string;
  district: string;
  province: string;
  totalCases: number;
  activeCases: number;
  resolutionRate: number;
  averageSolutionDays: number;
  priorityScore: number;
  recommendedAction: string;
}

export interface StorytellingData {
  generatedAt: string;
  period: {
    fromYear: number | null;
    toYear: number | null;
  };
  descriptive: {
    metrics: MetricSummary;
    distributions: {
      byStatus: DistributionItem[];
      byAgeRange: DistributionItem[];
      bySex: DistributionItem[];
      byEthnicity: DistributionItem[];
      byProvince: DistributionItem[];
      byDistrict: DistributionItem[];
      byCircuit: DistributionItem[];
    };
    timelines: {
      byMonth: TimelinePoint[];
      byYear: TimelinePoint[];
    };
    hotspots: HotspotPoint[];
  };
  diagnostic: {
    byReason: ReasonDiagnostic[];
    byObservedMotivation: ReasonDiagnostic[];
  };
  predictive: {
    modelSummary: PredictiveSummary;
  };
  prescriptive: {
    circuitPriority: CircuitPriority[];
  };
}

export interface CountryContext {
  countryName: string;
  capital: string;
  population: number;
  area: number;
  region: string;
  incomeLevel: string;
  flag: string;
}

export interface PopulationSeriesPoint {
  year: string;
  population: number;
}
