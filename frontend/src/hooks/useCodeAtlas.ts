import { useEffect, useMemo, useState } from "react";

import { chatWithCodebase, explainNode, getDocs, getGraphByJob, getIngestStatus, ingestByPaste, ingestByUrl, ingestByZip } from "../api";
import type {
  AnalyzeResponse,
  AppPhase,
  ChatMessage,
  ExplainResponse,
  FilterKey,
  GraphLink,
  GraphNode,
  JobStatus,
} from "../types";

const EMPTY_FILTERS: Record<FilterKey, string[]> = {
  concepts: [],
  projects: [],
  stack: [],
  owners: [],
  learning: [],
  languages: [],
};

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 240;

export function useCodeAtlas() {
  const [phase, setPhase] = useState<AppPhase>("input");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = window.localStorage.getItem("codeatlas-theme");
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  const [repoUrl, setRepoUrl] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "zip" | "paste">("url");
  const [branch, setBranch] = useState("main");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [pasteFilename, setPasteFilename] = useState("snippet.py");
  const [pasteCode, setPasteCode] = useState("");
  const [companyStack, setCompanyStack] = useState<string[]>(["React", "FastAPI"]);
  const [stackInput, setStackInput] = useState("");

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>("pending");
  const [loadingMessage, setLoadingMessage] = useState("Waiting to start...");
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<FilterKey, string[]>>(EMPTY_FILTERS);

  const [hideFileNodes, setHideFileNodes] = useState(false);
  const [minNodeDegree, setMinNodeDegree] = useState(2);
  const [maxVisibleFiles, setMaxVisibleFiles] = useState(280);
  const [labelDensity, setLabelDensity] = useState<"low" | "medium" | "high">("medium");
  const [focusVersion] = useState(0);

  const [sidebarTab, setSidebarTab] = useState<"explain" | "chat" | "docs">("explain");
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [docsMarkdown, setDocsMarkdown] = useState<string>("");
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedResourceLinks, setSelectedResourceLinks] = useState<Array<{ label: string; url: string }>>([]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("codeatlas-theme", theme);
  }, [theme]);

  async function startAnalysis() {
    if (inputMode === "url" && !repoUrl.trim()) {
      setError("Please provide a GitHub repository URL.");
      setPhase("error");
      return;
    }
    if (inputMode === "zip" && !zipFile) {
      setError("Please choose a ZIP file.");
      setPhase("error");
      return;
    }
    if (inputMode === "paste" && !pasteCode.trim()) {
      setError("Please paste code content.");
      setPhase("error");
      return;
    }

    setError(null);
    setPhase("loading");
    setLoadingMessage("Queueing repository ingest...");

    try {
      const ingest =
        inputMode === "url"
          ? await ingestByUrl({
              url: repoUrl.trim(),
              branch: branch.trim() || "main",
              company_stack: companyStack,
            })
          : inputMode === "zip"
            ? await ingestByZip(zipFile as File, companyStack)
            : await ingestByPaste({
                filename: pasteFilename.trim() || "snippet.py",
                code: pasteCode,
                company_stack: companyStack,
              });
      setJobId(ingest.job_id);
      await pollUntilDone(ingest.job_id);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to start ingest";
      setError(message);
      setPhase("error");
    }
  }

  async function pollUntilDone(nextJobId: string) {
    for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
      const status = await getIngestStatus(nextJobId);
      setJobStatus(status.status);
      setLoadingMessage(status.message || `Processing (${attempt}/${POLL_MAX_ATTEMPTS})`);

      if (status.status === "error") {
        throw new Error(status.error || status.message || "Analysis failed");
      }

      if (status.status === "done") {
        const graphResponse = await getGraphByJob(nextJobId);
        const result: AnalyzeResponse = {
          repo: graphResponse.repo,
          graph: graphResponse.graph,
        };
        setAnalysis(result);
        setSelectedNode(null);
        setExplanation(null);
        setSelectedDomains([]);
        setSelectedNodeTypes([]);
        setSelectedFilters(EMPTY_FILTERS);
        const fileNodeCount = result.graph.nodes.filter((node) => node.type === "file").length;
        setHideFileNodes(fileNodeCount > 420);
        setMinNodeDegree(fileNodeCount > 420 ? 3 : 2);
        setMaxVisibleFiles(fileNodeCount > 420 ? 220 : 320);
        setChatMessages([]);
        setDocsMarkdown("");
        setSelectedResourceLinks([]);
        setSidebarTab("explain");
        setPhase("graph");
        return;
      }

      await sleep(POLL_INTERVAL_MS);
    }

    throw new Error("Timed out while waiting for analysis. Please try again.");
  }

  function resetToInput() {
    setPhase("input");
    setError(null);
  }

  function addCompanyStackFromInput() {
    const additions = stackInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!additions.length) {
      return;
    }
    setCompanyStack((current) => Array.from(new Set([...current, ...additions])));
    setStackInput("");
  }

  function removeCompanyStack(value: string) {
    setCompanyStack((current) => current.filter((item) => item !== value));
  }

  function toggleDomain(value: string) {
    setSelectedDomains((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function toggleNodeType(value: string) {
    setSelectedNodeTypes((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function toggleFilter(key: FilterKey, value: string) {
    setSelectedFilters((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  }

  function focusOnDomain(domain: string) {
    setSelectedDomains((current) => (current.includes(domain) ? current.filter((item) => item !== domain) : [...current, domain]));
  }

  function focusOnNodeType(nodeType: string) {
    setSelectedNodeTypes((current) => (current.includes(nodeType) ? current.filter((item) => item !== nodeType) : [...current, nodeType]));
  }

  function focusOnConcept(concept: string) {
    setSelectedFilters((current) => ({
      ...current,
      concepts: current.concepts.includes(concept) ? current.concepts.filter((item) => item !== concept) : [...current.concepts, concept],
    }));
  }

  function resetLegendFocus() {
    setSelectedDomains([]);
    setSelectedNodeTypes([]);
    setSelectedFilters(EMPTY_FILTERS);
  }

  async function selectNode(node: GraphNode | null) {
    setSelectedNode(node);
    setExplanation(null);
    setDocsMarkdown("");

    if (!node || !jobId) {
      setSelectedResourceLinks([]);
      return;
    }

    const resources = resolveNodeResourceLinks(node, analysis, repoUrl, branch);
    setSelectedResourceLinks(resources);

    // Open file nodes directly in GitHub when a source link is available.
    if (node.type === "file" && resources[0]?.url) {
      window.open(resources[0].url, "_blank", "noopener,noreferrer");
    }

    try {
      const result = await explainNode(jobId, node.id);
      setExplanation(result);
    } catch {
      setExplanation({
        node_id: node.id,
        summary: `${node.label} is a ${node.type} node in this graph.`,
        responsibilities: ["Fallback explanation mode is active."],
        dependencies: [],
        complexity: "unknown",
      });
    }
  }

  async function sendChat(message: string) {
    if (!jobId || !message.trim()) {
      return;
    }

    const useRepoContextOnly = isRepoOverviewQuestion(message);
    const contextNodeId = useRepoContextOnly ? null : (selectedNode?.id ?? null);

    setChatMessages((current) => [...current, { role: "user", content: message }, { role: "assistant", content: "", loading: true }]);
    setChatLoading(true);

    try {
      const reply = await chatWithCodebase(jobId, message, contextNodeId);
      setChatMessages((current) => {
        const next = [...current];
        const index = next.findIndex((item) => item.loading);
        if (index >= 0) {
          next[index] = { role: "assistant", content: reply, loading: false };
        }
        return next;
      });
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : "Chat request failed";
      setChatMessages((current) => {
        const next = [...current];
        const index = next.findIndex((item) => item.loading);
        if (index >= 0) {
          next[index] = { role: "assistant", content: `Error: ${messageText}`, loading: false };
        }
        return next;
      });
    } finally {
      setChatLoading(false);
    }
  }

  async function loadDocs() {
    if (!jobId || !selectedNode) {
      return;
    }

    setDocsLoading(true);
    try {
      const docs = await getDocs(jobId, selectedNode.id);
      setDocsMarkdown(docs.markdown);
    } catch {
      setDocsMarkdown(`# ${selectedNode.label}\n\nDocs unavailable in current mode.`);
    } finally {
      setDocsLoading(false);
    }
  }

  useEffect(() => {
    if (sidebarTab === "docs" && selectedNode) {
      void loadDocs();
    }
  }, [sidebarTab, selectedNode?.id]);

  const availableNodeTypes = useMemo(() => {
    if (!analysis) {
      return [] as string[];
    }
    return Array.from(new Set(analysis.graph.nodes.map((node) => node.type))).sort();
  }, [analysis]);

  const filteredGraphResult = useMemo(() => {
    if (!analysis) {
      return { nodes: [] as GraphNode[], links: [] as GraphLink[], focusedIds: new Set<string>() };
    }

    const hasDomainFilter = selectedDomains.length > 0;
    const hasTypeFilter = selectedNodeTypes.length > 0;
    const hasSemanticFilter = (Object.values(selectedFilters) as string[][]).some((arr) => arr.length > 0);
    const hasAnyFilter = hasDomainFilter || hasTypeFilter || hasSemanticFilter;

    const degreeMap = new Map<string, number>();
    for (const link of analysis.graph.links) {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      degreeMap.set(sourceId, (degreeMap.get(sourceId) ?? 0) + 1);
      degreeMap.set(targetId, (degreeMap.get(targetId) ?? 0) + 1);
    }

    // Stage 1: Performance filtering (hard limits).
    // When semantic filters are active (language/stack/concepts/etc.), keep full file coverage
    // so filter clicks are always reflected, even on large repositories.
    const stage1Nodes = analysis.graph.nodes.filter((node) => {
      if (node.type === "file" && !hasAnyFilter && hideFileNodes) return false;
      if (node.type === "file" && !hasAnyFilter && (degreeMap.get(node.id) ?? 0) < minNodeDegree) return false;
      return true;
    });

    const files = stage1Nodes
      .filter((node) => node.type === "file")
      .sort((a, b) => (degreeMap.get(b.id) ?? 0) - (degreeMap.get(a.id) ?? 0));
    const nonFiles = stage1Nodes.filter((node) => node.type !== "file");
    const filePool = hasAnyFilter ? files : files.slice(0, maxVisibleFiles);
    const baseNodes = [...nonFiles, ...filePool];
    const baseIds = new Set(baseNodes.map((node) => node.id));

    // Stage 2: Domain / type / semantic filters (strict visibility)

    let visibleIds: Set<string>;
    let focusedIds: Set<string>;

    if (!hasAnyFilter) {
      visibleIds = baseIds;
      focusedIds = new Set<string>();
    } else {
      // Find nodes that match the active filters
      const matchedIds = new Set(
        baseNodes
          .filter((node) => {
            const normalizedDomainTags = new Set(node.domain_tags.map((tag) => tag.trim().toLowerCase()));
            const domainMatch = !hasDomainFilter || selectedDomains.every((selected) => normalizedDomainTags.has(selected.trim().toLowerCase()));
            const typeMatch = !hasTypeFilter || selectedNodeTypes.includes(node.type);
            const filterMatch = !(Object.entries(selectedFilters) as [FilterKey, string[]][]).some(([key, values]) => {
              if (values.length === 0) return false;
              if (key === "languages") {
                const nodeLanguage = (node.metadata?.language as string | undefined)?.trim().toLowerCase();
                return !values.some((v) => v.trim().toLowerCase() === nodeLanguage);
              }
              const normalizedNodeValues = new Set((node.filter_tags[key] ?? []).map((entry) => entry.trim().toLowerCase()));
              return !values.some((v) => normalizedNodeValues.has(v.trim().toLowerCase()));
            });
            return domainMatch && typeMatch && filterMatch;
          })
          .map((node) => node.id),
      );
      visibleIds = new Set(matchedIds);
      focusedIds = matchedIds;
    }

    const finalNodes = baseNodes.filter((node) => visibleIds.has(node.id));
    const finalLinks = analysis.graph.links.filter((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      return visibleIds.has(sourceId) && visibleIds.has(targetId);
    });

    return { nodes: finalNodes, links: finalLinks, focusedIds };
  }, [analysis, hideFileNodes, maxVisibleFiles, minNodeDegree, selectedDomains, selectedFilters, selectedNodeTypes]);

  const filteredGraph = useMemo(
    () => ({ nodes: filteredGraphResult.nodes, links: filteredGraphResult.links }),
    [filteredGraphResult.links, filteredGraphResult.nodes],
  );

  const filterFocusedIds = filteredGraphResult.focusedIds;

  return {
    phase,
    theme,
    setTheme,
    repoUrl,
    setRepoUrl,
    inputMode,
    setInputMode,
    branch,
    setBranch,
    zipFile,
    setZipFile,
    pasteFilename,
    setPasteFilename,
    pasteCode,
    setPasteCode,
    companyStack,
    stackInput,
    setStackInput,
    addCompanyStackFromInput,
    removeCompanyStack,
    startAnalysis,
    loadingMessage,
    error,
    resetToInput,
    jobId,
    jobStatus,
    analysis,
    filteredGraph,
    availableNodeTypes,
    filterFocusedIds,
    selectedNode,
    selectNode,
    selectedDomains,
    selectedNodeTypes,
    selectedFilters,
    toggleDomain,
    toggleNodeType,
    toggleFilter,
    focusOnDomain,
    focusOnNodeType,
    focusOnConcept,
    resetLegendFocus,
    hideFileNodes,
    setHideFileNodes,
    minNodeDegree,
    setMinNodeDegree,
    maxVisibleFiles,
    setMaxVisibleFiles,
    labelDensity,
    setLabelDensity,
    focusVersion,
    explanation,
    sidebarTab,
    setSidebarTab,
    chatMessages,
    chatLoading,
    sendChat,
    docsMarkdown,
    docsLoading,
    selectedResourceLinks,
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function resolveNodeResourceLinks(
  node: GraphNode,
  analysis: AnalyzeResponse | null,
  repoUrl: string,
  branch: string,
) {
  const links: Array<{ label: string; url: string }> = [];

  if (node.type === "concept") {
    links.push({
      label: `Learn ${node.label}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(node.label + " programming concept")}`,
    });
    return links;
  }

  const githubRoot = normalizeGithubRoot(repoUrl);
  if (!githubRoot || !analysis) {
    return links;
  }

  const resolvedRef = resolveGithubRef(analysis, branch);

  const nodePath = getNodePath(node);
  if (nodePath) {
    links.push({
      label: nodePath,
      url: `${githubRoot}/blob/${encodeURIComponentBranch(resolvedRef)}/${encodePath(nodePath)}`,
    });
    return links;
  }

  const fileNodes = new Map(
    analysis.graph.nodes.filter((item) => item.type === "file").map((item) => [item.id, item] as const),
  );

  const connectedFileIds = new Set<string>();
  for (const link of analysis.graph.links) {
    const sourceId = typeof link.source === "string" ? link.source : link.source.id;
    const targetId = typeof link.target === "string" ? link.target : link.target.id;
    if (sourceId === node.id && fileNodes.has(targetId)) {
      connectedFileIds.add(targetId);
    }
    if (targetId === node.id && fileNodes.has(sourceId)) {
      connectedFileIds.add(sourceId);
    }
  }

  for (const fileId of connectedFileIds) {
    const fileNode = fileNodes.get(fileId);
    if (!fileNode) {
      continue;
    }
    const path = getNodePath(fileNode);
    if (!path) {
      continue;
    }
    links.push({
      label: path,
      url: `${githubRoot}/blob/${encodeURIComponentBranch(resolvedRef)}/${encodePath(path)}`,
    });
  }

  return links.slice(0, 12);
}

function getNodePath(node: GraphNode): string | null {
  const rawPath = node.metadata.path;
  if (typeof rawPath !== "string") {
    return null;
  }
  return rawPath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "");
}

function resolveGithubRef(analysis: AnalyzeResponse, requestedBranch: string): string {
  const commitSha = analysis.repo.commit_sha?.trim();
  if (commitSha) {
    return commitSha;
  }

  const defaultBranch = analysis.repo.default_branch?.trim();
  if (defaultBranch) {
    return defaultBranch;
  }

  return requestedBranch.trim() || "main";
}

function normalizeGithubRoot(repoUrl: string): string | null {
  const normalized = repoUrl.trim().replace(/\.git$/, "").replace(/\/$/, "");

  const match = normalized.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/i);
  if (!match) {
    return null;
  }
  const owner = match[1];
  const repo = match[2];
  return `https://github.com/${owner}/${repo}`;
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function encodeURIComponentBranch(branch: string): string {
  return encodeURIComponent(branch.trim() || "main");
}

function isRepoOverviewQuestion(message: string): boolean {
  const prompt = message.trim().toLowerCase();
  if (!prompt) return true;
  const triggers = [
    "what does this repo do",
    "what does this repository do",
    "what is this repo",
    "what is this repository",
    "repository overview",
    "repo overview",
    "summarize this repository",
    "purpose of this repo",
  ];
  return triggers.some((trigger) => prompt.includes(trigger));
}

export type CodeAtlasState = ReturnType<typeof useCodeAtlas>;
