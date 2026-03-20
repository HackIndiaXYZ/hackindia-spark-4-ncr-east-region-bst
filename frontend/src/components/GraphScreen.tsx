import { motion } from "framer-motion";
import { useState } from "react";

import type { CodeAtlasState } from "../hooks/useCodeAtlas";
import type { GraphNode } from "../types";
import { GraphCanvas } from "./GraphCanvas";
import { NodeTooltip } from "./NodeTooltip";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface GraphScreenProps {
  atlas: CodeAtlasState;
}

export function GraphScreen({ atlas }: GraphScreenProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const isLight = atlas.theme === "light";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: isLight ? "#f8fafc" : "#020617" }}
    >
      <TopBar
        repoName={atlas.analysis?.repo.name}
        nodeCount={atlas.filteredGraph.nodes.length}
        linkCount={atlas.filteredGraph.links.length}
        theme={atlas.theme}
        onToggleTheme={() => atlas.setTheme((v) => (v === "dark" ? "light" : "dark"))}
        onBack={atlas.resetToInput}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Graph canvas */}
        <main className="relative flex-1 overflow-hidden">
          <GraphCanvas
            nodes={atlas.filteredGraph.nodes}
            links={atlas.filteredGraph.links}
            selectedNodeId={atlas.selectedNode?.id ?? null}
            theme={atlas.theme}
            labelDensity={atlas.labelDensity}
            focusVersion={atlas.focusVersion}
            filterFocusedIds={atlas.filterFocusedIds}
            onNodeSelect={(node) => {
              void atlas.selectNode(node);
            }}
            onNodeHover={(node) => {
              if (node) {
                setTooltip({ x: 24, y: 90, node });
              } else {
                setTooltip(null);
              }
            }}
          />
        </main>

        {/* Sidebar inspector */}
        <Sidebar atlas={atlas} />
      </div>

      {tooltip ? <NodeTooltip x={tooltip.x} y={tooltip.y} node={tooltip.node} /> : null}
    </motion.div>
  );
}

