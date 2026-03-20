import axios from "axios";

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ExplainResponse,
  GraphJobResponse,
  IngestPasteRequest,
  IngestResponse,
  IngestUrlRequest,
  JobState,
} from "./types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  timeout: 120000,
});

export async function analyzeGithubRepo(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await api.post<AnalyzeResponse>("/api/analyze/github", payload);
  return response.data;
}

export async function ingestByUrl(payload: IngestUrlRequest): Promise<IngestResponse> {
  const response = await api.post<IngestResponse>("/api/ingest/url", payload);
  return response.data;
}

export async function ingestByZip(file: File, companyStack: string[] = []): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);
  for (const stackItem of companyStack) {
    formData.append("company_stack", stackItem);
  }
  const response = await api.post<IngestResponse>("/api/ingest/zip", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 600000,
  });
  return response.data;
}

export async function ingestByPaste(payload: IngestPasteRequest): Promise<IngestResponse> {
  const response = await api.post<IngestResponse>("/api/ingest/paste", payload);
  return response.data;
}

export async function getIngestStatus(jobId: string): Promise<JobState> {
  const response = await api.get<JobState>(`/api/ingest/status/${jobId}`);
  return response.data;
}

export async function getGraphByJob(jobId: string): Promise<GraphJobResponse> {
  const response = await api.get<GraphJobResponse>(`/api/graph/${jobId}`);
  return response.data;
}

export async function explainNode(jobId: string, nodeId: string): Promise<ExplainResponse> {
  const response = await api.post<ExplainResponse>("/api/ai/explain", { job_id: jobId, node_id: nodeId });
  return response.data;
}

export async function getDocs(jobId: string, nodeId: string): Promise<{ markdown: string }> {
  const response = await api.post<{ markdown: string }>("/api/ai/docs", { job_id: jobId, node_id: nodeId });
  return response.data;
}

export async function chatWithCodebase(jobId: string, message: string, contextNode: string | null): Promise<string> {
  const response = await fetch(`${api.defaults.baseURL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      job_id: jobId,
      message,
      context_node: contextNode,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed (${response.status})`);
  }

  return response.text();
}
