export interface Detection {
  id?: number;
  class_id: number;
  class_name: string;
  confidence: number;
  confidence_percent: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export type InspectionStatus = 'DEFECT_DETECTED' | 'NO_DEFECT_DETECTED' | 'FAILED';

export interface Inspection {
  id: string;
  filename: string;
  file_size_bytes: number;
  width: number;
  height: number;
  status: InspectionStatus;
  detection_count: number;
  confidence_threshold: number;
  inference_time_ms: number;
  original_image_url: string;
  annotated_image_url: string;
  created_at: string;
  detections: Detection[];
}

export interface InspectionListResponse {
  items: Inspection[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StatsResponse {
  total_inspections: number;
  defects_detected_count: number;
  clean_count: number;
  defect_rate_percent: number;
  average_inference_time_ms: number;
  last_inspection_at?: string | null;
}

export interface ModelInfo {
  name: string;
  task: string;
  class_count: number;
  class_names: Record<string, string>;
  verified_classes: string[];
  weights_path: string;
  weights_size_mb: number;
  architecture: string;
  input_resolution: number;
  device: string;
  framework_version: string;
  torch_version: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  model_loaded: boolean;
  model_path: string;
  database_connected: boolean;
  storage_type: string;
  version: string;
}

export interface ModelMetrics {
  map50: number;
  map50_95: number;
  precision: number;
  recall: number;
  is_reported_benchmark: boolean;
  evaluation_dataset: string;
  dataset_class_count: number;
  classes: string[];
  note: string;
  detailed_metrics: {
    f1_score: number;
    epochs_trained: number;
    batch_size: number;
    image_size: number;
    loss_box: number;
    loss_cls: number;
    loss_dfl: number;
    speed_inference_ms: number;
    fitness: number;
  };
}
