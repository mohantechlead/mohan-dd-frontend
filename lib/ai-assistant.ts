export type AiVisualizationType = "bar" | "line" | "pie" | "scatter" | "none";

export interface AiSeriesPoint {
  x: string | number;
  y: number;
}

export interface AiVisualization {
  type: AiVisualizationType;
  title?: string | null;
  x_key?: string | null;
  y_key?: string | null;
  series: AiSeriesPoint[];
}

export interface AiMetadata {
  intent?: string | null;
  entities?: string[];
  filters?: Record<string, unknown>;
  date_range?: Record<string, unknown>;
  record_count?: number;
  chart_type?: string;
  warnings?: string[];
  execution_ms?: number;
}

export interface AiChatResponse {
  message: string;
  data: Record<string, unknown>[];
  visualization: AiVisualization;
  metadata: AiMetadata;
  conversation_id?: string;
}

export interface AiChatRequest {
  message: string;
  conversation_id?: string;
}
