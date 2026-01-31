export type Variant = 'control' | 'treatment';

export interface ExperimentConfig {
  experiment_id: string;
  enabled: boolean;
  case_types: string[];
  control_bucket_end: number;
  treatment_bucket_end: number;
}
