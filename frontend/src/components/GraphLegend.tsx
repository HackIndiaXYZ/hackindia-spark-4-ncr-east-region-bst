import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import type { FilterKey, GraphNode } from "../types";
import { colorForDomain } from "./graphPalette";

interface GraphLegendProps {
  theme: "dark" | "light";
  allNodes: GraphNode[];
  selectedDomains: string[];
  selectedNodeTypes: string[];
  selectedFilters: Record<FilterKey, string[]>;
  onFocusDomain: (domain: string) => void;
  onFocusNodeType: (nodeType: string) => void;
  onToggleFilter: (key: FilterKey, value: string) => void;
  onResetFocus: () => void;
}

function toCountMap(values: string[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

function normalizedCounts(values: string[]) {
  const bucket = new Map<string, { label: string; count: number }>();
  for (const raw of values) {
    const normalized = raw.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    const cur = bucket.get(key);
    if (cur) {
      cur.count += 1;
    } else {
      bucket.set(key, { label: normalized, count: 1 });
    }
  }
  return Array.from(bucket.values())
    .sort((a, b) => b.count - a.count)
    .map((item) => [item.label, item.count] as const);
}

const NODE_TYPE_COLORS: Record<string, string> = {
  file: "#3b82f6",
  concept: "#f59e0b",
  stack: "#8b5cf6",
  project: "#06b6d4",
  owner: "#10b981",
  learning: "#ef4444",
};

// ── Section component ─────────────────────────────────
interface FilterSectionProps {
  isLight: boolean;
  label: string;
  activeCount: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ isLight, label, activeCount, open, onToggle, children }: FilterSectionProps) {
  return (
    <div className={`border-b last:border-0 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-1 py-2.5 rounded-lg transition-colors duration-150 ${
          isLight ? "hover:bg-slate-100/80" : "hover:bg-slate-800/30"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{label}</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-[9px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className={`text-xs ${isLight ? "text-slate-500" : "text-slate-600"}`}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-2 space-y-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Filter row button ─────────────────────────────────
interface FilterRowProps {
  isLight: boolean;
  isActive: boolean;
  dotColor?: string;
  label: string;
  count: number;
  onClick: () => void;
}

function FilterRow({ isLight, isActive, dotColor, label, count, onClick }: FilterRowProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-all duration-150 ${
        isActive
          ? "bg-orange-500/15 border border-orange-500/30 text-orange-300"
          : isLight
            ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        {dotColor && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <span className="truncate">{label}</span>
      </span>
      <span className={`flex-shrink-0 text-[10px] font-semibold ${isActive ? "text-orange-400" : isLight ? "text-slate-500" : "text-slate-600"}`}>
        {count}
      </span>
    </motion.button>
  );
}

// ── Main component ────────────────────────────────────
export function GraphLegend({
  theme,
  allNodes,
  selectedDomains,
  selectedNodeTypes,
  selectedFilters,
  onFocusDomain,
  onFocusNodeType,
  onToggleFilter,
  onResetFocus,
}: GraphLegendProps) {
  const isLight = theme === "light";
  const [showDomains, setShowDomains] = useState(true);
  const [showTypes, setShowTypes] = useState(true);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);

  const hasAnyFilter =
    selectedDomains.length > 0 ||
    selectedNodeTypes.length > 0 ||
    Object.values(selectedFilters).some((arr) => arr.length > 0);

  const domainCounts = useMemo(() => {
    const vals = allNodes.flatMap((n) => n.domain_tags);
    return Array.from(toCountMap(vals).entries()).sort((a, b) => b[1] - a[1]);
  }, [allNodes]);

  const nodeTypeCounts = useMemo(() => {
    const vals = allNodes.map((n) => n.type);
    return Array.from(toCountMap(vals).entries()).sort((a, b) => b[1] - a[1]);
  }, [allNodes]);

  const languageCounts = useMemo(() => {
    const vals = allNodes
      .map((n) => n.metadata?.language as string | undefined)
      .filter((l): l is string => Boolean(l) && l !== "unknown");
    return normalizedCounts(vals).slice(0, 12);
  }, [allNodes]);

  const stackCounts = useMemo(() => {
    const vals = allNodes.flatMap((n) => (n.filter_tags.stack ?? []).filter((s) => s.length > 1 && s !== "Unknown"));
    return normalizedCounts(vals).slice(0, 14);
  }, [allNodes]);

  const conceptCounts = useMemo(() => {
    const vals = allNodes.flatMap((n) => n.filter_tags.concepts ?? []);
    return Array.from(toCountMap(vals).entries()).sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [allNodes]);

  const selectedConcepts = selectedFilters.concepts ?? [];
  const selectedStack = selectedFilters.stack ?? [];
  const selectedLanguages = selectedFilters.languages ?? [];

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-2 mb-1">
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${isLight ? "text-slate-600" : "text-slate-500"}`}>Filters</p>
        <AnimatePresence>
          {hasAnyFilter && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              type="button"
              onClick={onResetFocus}
              className="text-[10px] text-orange-400 hover:text-orange-300 font-medium transition-colors duration-150"
            >
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Domains */}
      <FilterSection
        isLight={isLight}
        label="Domains"
        activeCount={selectedDomains.length}
        open={showDomains}
        onToggle={() => setShowDomains((v) => !v)}
      >
        {domainCounts.map(([domain, count]) => (
          <FilterRow
            isLight={isLight}
            key={domain}
            isActive={selectedDomains.includes(domain)}
            dotColor={colorForDomain(domain, "dark")}
            label={domain.toUpperCase()}
            count={count}
            onClick={() => onFocusDomain(domain)}
          />
        ))}
      </FilterSection>

      {/* Node Types */}
      <FilterSection
        isLight={isLight}
        label="Node Types"
        activeCount={selectedNodeTypes.length}
        open={showTypes}
        onToggle={() => setShowTypes((v) => !v)}
      >
        {nodeTypeCounts.map(([nodeType, count]) => (
          <FilterRow
            isLight={isLight}
            key={nodeType}
            isActive={selectedNodeTypes.includes(nodeType)}
            dotColor={NODE_TYPE_COLORS[nodeType] ?? "#94a3b8"}
            label={nodeType}
            count={count}
            onClick={() => onFocusNodeType(nodeType)}
          />
        ))}
      </FilterSection>

      {/* Languages */}
      {languageCounts.length > 0 && (
        <FilterSection
          isLight={isLight}
          label="Languages"
          activeCount={selectedLanguages.length}
          open={showLanguages}
          onToggle={() => setShowLanguages((v) => !v)}
        >
          {languageCounts.map(([lang, count]) => (
            <FilterRow
              isLight={isLight}
              key={lang}
              isActive={selectedLanguages.includes(lang)}
              label={lang}
              count={count}
              onClick={() => onToggleFilter("languages", lang)}
            />
          ))}
        </FilterSection>
      )}

      {/* Tech Stack */}
      {stackCounts.length > 0 && (
        <FilterSection
          isLight={isLight}
          label="Tech Stack"
          activeCount={selectedStack.length}
          open={showStack}
          onToggle={() => setShowStack((v) => !v)}
        >
          {stackCounts.map(([tech, count]) => (
            <FilterRow
              isLight={isLight}
              key={tech}
              isActive={selectedStack.includes(tech)}
              label={tech}
              count={count}
              onClick={() => onToggleFilter("stack", tech)}
            />
          ))}
        </FilterSection>
      )}

      {/* Concepts */}
      {conceptCounts.length > 0 && (
        <FilterSection
          isLight={isLight}
          label="Concepts"
          activeCount={selectedConcepts.length}
          open={showConcepts}
          onToggle={() => setShowConcepts((v) => !v)}
        >
          {conceptCounts.map(([concept, count]) => (
            <FilterRow
              isLight={isLight}
              key={concept}
              isActive={selectedConcepts.includes(concept)}
              label={concept}
              count={count}
              onClick={() => onToggleFilter("concepts", concept)}
            />
          ))}
        </FilterSection>
      )}
    </div>
  );
}
