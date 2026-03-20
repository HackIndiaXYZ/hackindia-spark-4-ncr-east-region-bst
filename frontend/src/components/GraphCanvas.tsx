import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

import type { GraphLink, GraphNode } from "../types";
import { colorForDomain, colorForNodeType } from "./graphPalette";
import { loadGraphIcons, resolveGraphIconKey, type IconTheme } from "./graphIconLibrary";

interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNodeId: string | null;
  theme: IconTheme;
  labelDensity: "low" | "medium" | "high";
  focusVersion: number;
  filterFocusedIds: Set<string>;
  onNodeSelect: (node: GraphNode | null) => void;
  onNodeHover?: (node: GraphNode | null) => void;
}

export function GraphCanvas({ nodes, links, selectedNodeId, theme, labelDensity, focusVersion, filterFocusedIds, onNodeSelect, onNodeHover }: GraphCanvasProps) {
  const graphRef = useRef<any>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [iconMap, setIconMap] = useState<Record<string, HTMLImageElement>>({});
  const hasGraphData = nodes.length > 0 || links.length > 0;

  const graphData = useMemo(
    () => ({
      nodes,
      links,
    }),
    [nodes, links],
  );

  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const link of links) {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      map.set(sourceId, (map.get(sourceId) ?? 0) + 1);
      map.set(targetId, (map.get(targetId) ?? 0) + 1);
    }
    return map;
  }, [links]);

  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      map.set(node.id, new Set<string>());
    }
    for (const link of links) {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      if (!map.has(sourceId)) {
        map.set(sourceId, new Set<string>());
      }
      if (!map.has(targetId)) {
        map.set(targetId, new Set<string>());
      }
      map.get(sourceId)?.add(targetId);
      map.get(targetId)?.add(sourceId);
    }
    return map;
  }, [links, nodes]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }

    if (typeof graph.d3Force === "function") {
      graph.d3Force("charge")?.strength(-84);
      graph.d3Force("link")?.distance((link: GraphLink) => {
        if (link.relation === "imports") {
          return 44;
        }
        if (link.relation === "contains") {
          return 74;
        }
        return 58;
      });
    }

    if (typeof graph.d3VelocityDecay === "function") {
      graph.d3VelocityDecay(0.28);
    }
  }, [graphData]);

  useEffect(() => {
    let mounted = true;
    loadGraphIcons(theme)
      .then((icons) => {
        if (mounted) {
          setIconMap(icons);
        }
      })
      .catch(() => {
        if (mounted) {
          setIconMap({});
        }
      });

    return () => {
      mounted = false;
    };
  }, [theme]);

  useEffect(() => {
    if (!graphRef.current || !nodes.length) {
      return;
    }

    const handle = window.setTimeout(() => {
      graphRef.current?.zoomToFit?.(500, 72);
    }, 220);
    return () => window.clearTimeout(handle);
  }, [focusVersion]);

  const activeNodeId = selectedNodeId ?? hoveredNodeId;

  const activeNeighborhood = useMemo(() => {
    if (!activeNodeId) {
      return null;
    }
    const neighbors = neighborMap.get(activeNodeId) ?? new Set<string>();
    const context = new Set<string>([activeNodeId, ...neighbors]);
    return context;
  }, [activeNodeId, neighborMap]);

  const filterNeighborhood = useMemo(() => {
    if (filterFocusedIds.size === 0) {
      return null;
    }

    const context = new Set<string>(filterFocusedIds);
    for (const nodeId of filterFocusedIds) {
      for (const neighbor of neighborMap.get(nodeId) ?? []) {
        context.add(neighbor);
      }
    }
    return context;
  }, [filterFocusedIds, neighborMap]);

  const domainByNode = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of nodes) {
      const domain = node.domain_tags[0] ?? "general";
      map.set(node.id, domain);
    }
    return map;
  }, [nodes]);

  return (
    <div className="panel graph-panel">
      <div className="graph-header">
        <div>
          <p className="eyebrow">Interactive Graph</p>
          <h2>Repository map</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {filterFocusedIds.size > 0 ? (
            <span style={{ fontSize: "0.74rem", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 999, padding: "3px 10px", fontWeight: 700 }}>
              {filterFocusedIds.size} focused
            </span>
          ) : null}
          <button
            className="secondary-button"
            type="button"
            onClick={() => graphRef.current?.zoomToFit?.(350, 60)}
          >
            Fit graph
          </button>
        </div>
      </div>
      <div className="graph-shell">
        {hasGraphData ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            backgroundColor="rgba(10, 14, 24, 0)"
            nodeLabel={(node) => {
              const graphNode = node as GraphNode;
              return `${graphNode.label} (${graphNode.type})`;
            }}
            nodeVal={(node) => (node as GraphNode).size}
            nodeCanvasObject={(node, context, scale) => {
              const graphNode = node as GraphNode;
              const label = graphNode.label;
              const isSelected = selectedNodeId === graphNode.id;
              const isHovered = hoveredNodeId === graphNode.id;
              const isFocusNode = isSelected || isHovered;

              const hasFilterFocus = filterFocusedIds.size > 0;
              const isFilterFocused = !hasFilterFocus || filterFocusedIds.has(graphNode.id);
              const isInFocusContext = activeNeighborhood
                ? activeNeighborhood.has(graphNode.id)
                : isFilterFocused;
              const radius = Math.max(5, graphNode.size);
              const domain = domainByNode.get(graphNode.id) ?? "general";
              const domainColor = colorForDomain(domain, theme);
              const typeColor = colorForNodeType(graphNode.type);
              const fill = graphNode.type === "file" ? typeColor : domainColor;
              const dimmedFill = theme === "dark" ? "rgba(148, 163, 184, 0.22)" : "rgba(100, 116, 139, 0.24)";

              context.beginPath();
              context.arc(graphNode.x ?? 0, graphNode.y ?? 0, radius, 0, 2 * Math.PI, false);
              context.fillStyle = isInFocusContext ? fill : dimmedFill;
              context.fill();

              context.beginPath();
              context.arc(graphNode.x ?? 0, graphNode.y ?? 0, radius, 0, 2 * Math.PI, false);
              context.strokeStyle = theme === "dark" ? "rgba(226, 232, 240, 0.45)" : "rgba(15, 23, 42, 0.28)";
              context.lineWidth = isFocusNode ? 1.8 : 0.8;
              context.stroke();

              if (isFocusNode) {
                context.beginPath();
                context.arc(graphNode.x ?? 0, graphNode.y ?? 0, radius + 3, 0, 2 * Math.PI, false);
                context.strokeStyle = isSelected ? "#22d3ee" : theme === "dark" ? "#e2e8f0" : "#1e293b";
                context.lineWidth = 2;
                context.stroke();
              }

              const iconKey = resolveGraphIconKey(graphNode);
              const iconImage = iconMap[iconKey] ?? iconMap[`type:${graphNode.type}`] ?? iconMap["type:file"];
              if (iconImage) {
                const iconSize = Math.max(11, radius * 1.5);
                context.globalAlpha = isInFocusContext ? 0.98 : 0.4;
                context.drawImage(iconImage, (graphNode.x ?? 0) - iconSize / 2, (graphNode.y ?? 0) - iconSize / 2, iconSize, iconSize);
                context.globalAlpha = 1;
              }

              const degree = degreeMap.get(graphNode.id) ?? 0;
              const degreeThreshold = labelDensity === "high" ? 6 : labelDensity === "medium" ? 12 : 18;
              const focusContext = activeNeighborhood ?? filterNeighborhood;
              const hasFocusedNeighborhood = Boolean(focusContext);
              const shouldRenderLabel =
                hasFocusedNeighborhood
                  ? Boolean(focusContext?.has(graphNode.id))
                  : isFocusNode ||
                    scale >= 3 ||
                    (graphNode.type !== "file" && scale >= 2.35) ||
                    degree >= degreeThreshold + 4;
              if (shouldRenderLabel) {
                const labelFontSize = Math.max(8, 11 / scale);
                context.font = `600 ${labelFontSize}px IBM Plex Sans`;
                const metrics = context.measureText(label);
                const labelX = (graphNode.x ?? 0) + radius + 6;
                const labelY = graphNode.y ?? 0;
                const paddingX = Math.max(4, 6 / scale);
                const badgeHeight = Math.max(13, labelFontSize + 4);

                context.fillStyle = theme === "dark" ? "rgba(3, 10, 24, 0.82)" : "rgba(248, 250, 252, 0.92)";
                context.fillRect(labelX - paddingX, labelY - badgeHeight / 2, metrics.width + paddingX * 2, badgeHeight);

                context.strokeStyle = theme === "dark" ? "rgba(148, 163, 184, 0.35)" : "rgba(71, 85, 105, 0.35)";
                context.lineWidth = 0.8;
                context.strokeRect(labelX - paddingX, labelY - badgeHeight / 2, metrics.width + paddingX * 2, badgeHeight);

                context.fillStyle = theme === "dark" ? "#e5eefc" : "#0f172a";
                context.textAlign = "left";
                context.textBaseline = "middle";
                context.globalAlpha = isInFocusContext ? 1 : 0.55;
                context.fillText(label, labelX, labelY);
                context.globalAlpha = 1;
              }
            }}
            linkColor={(link) => {
              const graphLink = link as GraphLink;
              const sourceId = typeof graphLink.source === "string" ? graphLink.source : graphLink.source.id;
              const targetId = typeof graphLink.target === "string" ? graphLink.target : graphLink.target.id;
              const focusContext = activeNeighborhood ?? filterNeighborhood;
              if (!focusContext) {
                return theme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(100, 116, 139, 0.32)";
              }

              const isInContext = focusContext.has(sourceId) && focusContext.has(targetId);
              if (!isInContext) {
                return theme === "dark" ? "rgba(148, 163, 184, 0.03)" : "rgba(100, 116, 139, 0.07)";
              }

              if (graphLink.relation === "imports") {
                const domain = domainByNode.get(sourceId) ?? "general";
                return theme === "dark" ? colorForDomain(domain, theme) : "rgba(30, 64, 175, 0.62)";
              }
              return theme === "dark" ? "rgba(226, 232, 240, 0.48)" : "rgba(30, 41, 59, 0.42)";
            }}
            linkWidth={(link) => {
              const graphLink = link as GraphLink;
              const sourceId = typeof graphLink.source === "string" ? graphLink.source : graphLink.source.id;
              const targetId = typeof graphLink.target === "string" ? graphLink.target : graphLink.target.id;
              const focusContext = activeNeighborhood ?? filterNeighborhood;
              if (!focusContext) {
                return graphLink.relation === "imports" ? 1.65 : 1.1;
              }

              const isInContext = focusContext.has(sourceId) && focusContext.has(targetId);
              if (!isInContext) {
                return 0.12;
              }
              return graphLink.relation === "imports" ? 2.8 : 1.7;
            }}
            linkDirectionalParticles={(link) => {
              const graphLink = link as GraphLink;
              const sourceId = typeof graphLink.source === "string" ? graphLink.source : graphLink.source.id;
              const targetId = typeof graphLink.target === "string" ? graphLink.target : graphLink.target.id;
              const focusContext = activeNeighborhood ?? filterNeighborhood;
              const isInContext = !focusContext || (focusContext.has(sourceId) && focusContext.has(targetId));
              if (!isInContext) {
                return 0;
              }
              if (!selectedNodeId) {
                return 0;
              }
              return graphLink.relation === "imports" ? 1 : 0;
            }}
            linkDirectionalParticleWidth={1.6}
            linkDirectionalArrowLength={4.2}
            linkDirectionalArrowRelPos={0.9}
            cooldownTicks={180}
            onNodeClick={(node) => onNodeSelect(node as GraphNode)}
            onNodeHover={(node) => {
              const next = node ? (node as GraphNode) : null;
              setHoveredNodeId(next ? next.id : null);
              if (onNodeHover) {
                onNodeHover(next);
              }
            }}
            onBackgroundClick={() => onNodeSelect(null)}
          />
        ) : (
          <div className="graph-empty-state">
            <p className="eyebrow">No graph data yet</p>
            <p className="subtle">Enter a GitHub repository URL and click Analyze repository to generate the map.</p>
          </div>
        )}
      </div>
    </div>
  );
}
