import { Plus, Search } from "lucide-react";
import { useState } from "react";

import type { FilterKey } from "../types";

interface ControlPanelProps {
  repoUrl: string;
  setRepoUrl: (value: string) => void;
  companyStack: string[];
  addCompanyStack: (value: string) => void;
  removeCompanyStack: (value: string) => void;
  domains: string[];
  selectedDomains: string[];
  toggleDomain: (value: string) => void;
  availableNodeTypes: string[];
  selectedNodeTypes: string[];
  toggleNodeType: (value: string) => void;
  availableFilters: Record<FilterKey, string[]>;
  selectedFilters: Record<FilterKey, string[]>;
  toggleFilter: (key: FilterKey, value: string) => void;
  hideFileNodes: boolean;
  setHideFileNodes: (value: boolean) => void;
  minNodeDegree: number;
  setMinNodeDegree: (value: number) => void;
  maxVisibleFiles: number;
  setMaxVisibleFiles: (value: number) => void;
  labelDensity: "low" | "medium" | "high";
  setLabelDensity: (value: "low" | "medium" | "high") => void;
  onAnalyze: () => void;
  loading: boolean;
}

const FILTER_LABELS: Record<FilterKey, string> = {
  concepts: "Concepts",
  projects: "Projects",
  stack: "Stack",
  owners: "Owners",
  learning: "Learning",
  languages: "Languages",
};

export function ControlPanel({
  repoUrl,
  setRepoUrl,
  companyStack,
  addCompanyStack,
  removeCompanyStack,
  domains,
  selectedDomains,
  toggleDomain,
  availableNodeTypes,
  selectedNodeTypes,
  toggleNodeType,
  availableFilters,
  selectedFilters,
  toggleFilter,
  hideFileNodes,
  setHideFileNodes,
  minNodeDegree,
  setMinNodeDegree,
  maxVisibleFiles,
  setMaxVisibleFiles,
  labelDensity,
  setLabelDensity,
  onAnalyze,
  loading,
}: ControlPanelProps) {
  const [stackInput, setStackInput] = useState("");

  return (
    <aside className="panel control-panel">
      <section>
        <p className="eyebrow">Input</p>
        <label className="field-label" htmlFor="repo-url">
          GitHub repository URL
        </label>
        <div className="search-row">
          <Search size={16} />
          <input
            id="repo-url"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
          />
        </div>
        <button className="primary-button" onClick={onAnalyze} disabled={loading || !repoUrl.trim()}>
          {loading ? "Analyzing repository..." : "Analyze repository"}
        </button>
      </section>

      <section>
        <p className="eyebrow">Company Context</p>
        <p className="helper-text">Add the stack your company already uses. CodeAtlas will surface learning nodes for missing technologies.</p>
        <div className="stack-builder">
          <input
            type="text"
            placeholder="FastAPI, React, Postgres"
            value={stackInput}
            onChange={(event) => setStackInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (stackInput.trim()) {
                  addCompanyStack(stackInput);
                  setStackInput("");
                }
              }
            }}
          />
          <button
            className="secondary-button"
            onClick={() => {
              if (stackInput.trim()) {
                addCompanyStack(stackInput);
                setStackInput("");
              }
            }}
            type="button"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="chip-row">
          {companyStack.length === 0 ? <span className="empty-chip">No company stack set</span> : null}
          {companyStack.map((item) => (
            <button key={item} className="chip active" onClick={() => removeCompanyStack(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Readability</p>
        <p className="helper-text">Filter noisy nodes and tune label density so clusters stay readable.</p>
        <div className="readability-grid">
          <label className="toggle-row" htmlFor="hide-files-toggle">
            <span>Hide file nodes</span>
            <input
              id="hide-files-toggle"
              type="checkbox"
              checked={hideFileNodes}
              onChange={(event) => setHideFileNodes(event.target.checked)}
            />
          </label>

          <label className="slider-row" htmlFor="min-degree-range">
            <span>Min file connections: {minNodeDegree}</span>
            <input
              id="min-degree-range"
              type="range"
              min={0}
              max={16}
              step={1}
              value={minNodeDegree}
              onChange={(event) => setMinNodeDegree(Number(event.target.value))}
            />
          </label>

          <label className="slider-row" htmlFor="max-files-range">
            <span>Max files visible: {maxVisibleFiles}</span>
            <input
              id="max-files-range"
              type="range"
              min={40}
              max={500}
              step={20}
              value={maxVisibleFiles}
              disabled={hideFileNodes}
              onChange={(event) => setMaxVisibleFiles(Number(event.target.value))}
            />
          </label>

          <div className="label-density-row">
            <span className="field-label">Label density</span>
            <div className="chip-row dense">
              {(["low", "medium", "high"] as const).map((value) => (
                <button
                  key={value}
                  className={labelDensity === value ? "chip active" : "chip"}
                  onClick={() => setLabelDensity(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="eyebrow">Domain View</p>
        <p className="helper-text">Select one domain for a focused view or multiple domains for combined maps like AI + SWE.</p>
        <div className="chip-row">
          {domains.map((domain) => (
            <button
              key={domain}
              className={selectedDomains.includes(domain) ? "chip active" : "chip"}
              onClick={() => toggleDomain(domain)}
              type="button"
            >
              {domain.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Node Types</p>
        <p className="helper-text">Reduce clutter by showing only specific node families.</p>
        <div className="chip-row">
          {availableNodeTypes.map((type) => (
            <button
              key={type}
              className={selectedNodeTypes.includes(type) ? "chip active" : "chip"}
              onClick={() => toggleNodeType(type)}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      {Object.entries(FILTER_LABELS).map(([key, label]) => (
        <section key={key}>
          <p className="eyebrow">{label}</p>
          <div className="chip-row dense">
            {availableFilters[key as FilterKey]?.length ? (
              availableFilters[key as FilterKey].map((value) => (
                <button
                  key={value}
                  className={selectedFilters[key as FilterKey].includes(value) ? "chip active" : "chip"}
                  onClick={() => toggleFilter(key as FilterKey, value)}
                  type="button"
                >
                  {value}
                </button>
              ))
            ) : (
              <span className="empty-chip">No values yet</span>
            )}
          </div>
        </section>
      ))}
    </aside>
  );
}
