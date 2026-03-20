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

const TAG_SWATCHES = [
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#f59e0b",
  "#14b8a6",
];

function colorForTag(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return TAG_SWATCHES[hash % TAG_SWATCHES.length];
}

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
    <div className={`border-b rounded-xl my-2 transition-all duration-200 ${isLight ? "border-slate-200 bg-gradient-to-br from-slate-50/80 to-slate-50/40" : "border-slate-800 bg-gradient-to-br from-slate-800/20 to-slate-900/10"}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 font-medium ${
          isLight ? "hover:bg-slate-100/60" : "hover:bg-slate-800/40"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-slate-700" : "text-slate-300"}`}>{label}</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500/30 to-orange-400/20 text-orange-500 border-2 border-orange-500/40 rounded-full text-[8px] font-bold shadow-lg shadow-orange-500/10">
              {activeCount}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className={`text-sm font-bold ${isLight ? "text-slate-500" : "text-slate-600"}`}
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
            <div className={`pb-3 px-2 space-y-1 ${isLight ? "bg-white/20" : "bg-slate-800/20"}`}>{children}</div>
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
      layout
      animate={{
        x: isActive ? 10 : 0,
        scale: isActive ? 1.01 : 1,
      }}
      whileHover={{ x: isActive ? 12 : 4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all duration-250 ${
        isActive
          ? "bg-gradient-to-r from-orange-500/30 to-orange-400/10 border-2 border-orange-500/50 text-orange-400 shadow-lg shadow-orange-500/15"
          : isLight
            ? "text-slate-700 hover:text-slate-900 hover:bg-white/60 border-2 border-transparent hover:border-slate-300"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-2 border-transparent hover:border-slate-700"
      }`}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        {dotColor && (
          <motion.span
            animate={{ scale: isActive ? 1.25 : 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-lg"
            style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}40` }}
          />
        )}
        <span className="truncate">{label}</span>
      </span>
      <motion.span
        animate={{ scale: isActive ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-orange-500/40 text-orange-300" : isLight ? "bg-slate-200 text-slate-600" : "bg-slate-700/50 text-slate-500"}`}
      >
        {count}
      </motion.span>
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
    <div className="space-y-1.5">
      {/* Header */}
      <div className={`flex items-center justify-between px-2 py-3 rounded-xl mb-2 ${isLight ? "bg-gradient-to-r from-orange-50 to-orange-50/50" : "bg-gradient-to-r from-orange-500/10 to-orange-500/5"}`}>
        <p className="text-[9px] font-bold uppercase tracking-widest text-orange-500">🎯 Filters</p>
        <AnimatePresence>
          {hasAnyFilter && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              type="button"
              onClick={onResetFocus}
              className="text-[9px] text-orange-500 hover:text-orange-400 font-bold transition-all duration-150 px-2 py-1 rounded-lg hover:bg-orange-500/10"
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
              dotColor={colorForTag(`language:${lang.toLowerCase()}`)}
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
              dotColor={colorForTag(`stack:${tech.toLowerCase()}`)}
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
              dotColor={colorForTag(`concept:${concept.toLowerCase()}`)}
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
