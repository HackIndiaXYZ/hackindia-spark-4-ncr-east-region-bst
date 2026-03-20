export type FilterKey = "concepts" | "projects" | "stack" | "owners" | "learning" | "languages";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  domain_tags: string[];
  filter_tags: Record<FilterKey, string[]>;
  metadata: Record<string, unknown>;
  size: number;
  color: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface GraphPayload {
  nodes: GraphNode[];
  links: GraphLink[];
  available_domains: string[];
  available_filters: Record<FilterKey, string[]>;
  stats: Record<string, unknown>;
}

export interface AnalyzeResponse {
  repo: {
    name: string;
    root_path: string;
    default_branch?: string | null;
    commit_sha?: string | null;
  };
  graph: GraphPayload;
}

export interface AnalyzeRequest {
  repo_url: string;
  company_stack: string[];
  focus_domains: string[];
}

export type JobStatus = "pending" | "processing" | "done" | "error";

export type AppPhase = "input" | "loading" | "graph" | "error";

export interface IngestUrlRequest {
  url: string;
  branch?: string;
  company_stack: string[];
}

export interface IngestPasteRequest {
  filename: string;
  code: string;
  company_stack: string[];
}

export interface IngestResponse {
  job_id: string;
  status: JobStatus;
  message: string;
}

export interface JobState {
  job_id: string;
  status: JobStatus;
  source: string;
  message: string;
  error?: string | null;
  graph?: GraphPayload | null;
  repo?: AnalyzeResponse["repo"] | null;
}

export interface GraphJobResponse {
  job_id: string;
  status: JobStatus;
  repo: AnalyzeResponse["repo"];
  graph: GraphPayload;
}

export interface ExplainResponse {
  node_id: string;
  summary: string;
  responsibilities: string[];
  dependencies: string[];
  complexity: "low" | "medium" | "high" | "unknown";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}
