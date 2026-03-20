import { motion } from "framer-motion";
import type { GraphNode } from "../types";

interface NodeTooltipProps {
  x: number;
  y: number;
  node: GraphNode;
}

const TYPE_ICON: Record<string, string> = {
  file: "📄",
  concept: "💡",
  stack: "⚙️",
  project: "📦",
  owner: "👤",
  learning: "📚",
};

export function NodeTooltip({ x, y, node }: NodeTooltipProps) {
  const language = String(node.metadata.language ?? "");
  const path = String(node.metadata.path ?? "");
  const icon = TYPE_ICON[node.type] ?? "●";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      style={{ left: x, top: y }}
      className="fixed z-[200] pointer-events-none max-w-[220px]"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl px-3.5 py-3 shadow-xl shadow-slate-950/60 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm flex-shrink-0">{icon}</span>
          <span className="text-slate-100 font-semibold text-[12px] truncate">{node.label}</span>
        </div>

        {path && path !== node.label && (
          <p className="text-[10px] text-slate-500 font-mono truncate">{path}</p>
        )}

        <div className="flex gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 text-[10px]">
            {node.type}
          </span>
          {language && language !== "unknown" && (
            <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 text-[10px]">
              {language}
            </span>
          )}
        </div>

        {node.domain_tags.length > 0 && (
          <p className="text-[10px] text-slate-500">{node.domain_tags.slice(0, 3).join(" · ")}</p>
        )}
      </div>
    </motion.div>
  );
}
