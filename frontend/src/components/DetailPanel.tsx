import { useMemo } from "react";

import type { GraphLink, GraphNode } from "../types";

interface DetailPanelProps {
  node: GraphNode | null;
  nodes: GraphNode[];
  links: GraphLink[];
  stats: Record<string, unknown>;
}

function renderList(items: string[] | undefined) {
  if (!items?.length) {
    return <span className="empty-chip">None</span>;
  }

  return (
    <div className="chip-row dense">
      {items.map((item) => (
        <span key={item} className="chip static-chip">
          {item}
        </span>
      ))}
    </div>
  );
}

function nodeId(value: string | GraphNode) {
  return typeof value === "string" ? value : value.id;
}

export function DetailPanel({ node, nodes, links, stats }: DetailPanelProps) {
  const connectedContext = useMemo(() => {
    if (!node) {
      return { neighbors: [] as GraphNode[], relatedFiles: [] as GraphNode[] };
    }

    const neighborIds = new Set<string>();
    for (const link of links) {
      const sourceId = nodeId(link.source);
      const targetId = nodeId(link.target);
      if (sourceId === node.id) {
        neighborIds.add(targetId);
      }
      if (targetId === node.id) {
        neighborIds.add(sourceId);
      }
    }

    const neighbors = nodes.filter((candidate) => neighborIds.has(candidate.id));
    const relatedFiles = neighbors.filter((candidate) => candidate.type === "file");
    return { neighbors, relatedFiles };
  }, [links, node, nodes]);

  return (
    <aside className="panel detail-panel">
      <section>
        <p className="eyebrow">Selection</p>
        {node ? (
          <>
            <h2>{node.label}</h2>
            <p className="subtle">Type: {node.type}</p>
            <p className="subtle">Domains: {node.domain_tags.join(", ") || "none"}</p>
            <p className="subtle">Connected nodes: {connectedContext.neighbors.length}</p>
            <p className="subtle">Related files: {connectedContext.relatedFiles.length}</p>
            {node.metadata.path ? <p className="subtle">Path: {String(node.metadata.path)}</p> : null}
            {node.metadata.language ? <p className="subtle">Language: {String(node.metadata.language)}</p> : null}
            {Array.isArray(node.metadata.imports) ? <p className="subtle">Imports: {node.metadata.imports.length}</p> : null}
            {node.type === "file" ? <pre className="code-preview">{String(node.metadata.preview ?? "")}</pre> : null}

            {connectedContext.relatedFiles.length ? (
              <div className="detail-group">
                <strong>Related files</strong>
                <div className="related-file-list">
                  {connectedContext.relatedFiles.slice(0, 12).map((fileNode) => (
                    <span key={fileNode.id} className="related-file-item">
                      {String(fileNode.metadata.path ?? fileNode.label)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="detail-group">
              <strong>Concepts</strong>
              {renderList(node.filter_tags.concepts)}
            </div>
            <div className="detail-group">
              <strong>Stack</strong>
              {renderList(node.filter_tags.stack)}
            </div>
            <div className="detail-group">
              <strong>Projects</strong>
              {renderList(node.filter_tags.projects)}
            </div>
            <div className="detail-group">
              <strong>Owners</strong>
              {renderList(node.filter_tags.owners)}
            </div>
            <div className="detail-group">
              <strong>Learning</strong>
              {renderList(node.filter_tags.learning)}
            </div>
          </>
        ) : (
          <p className="subtle">Click a node to inspect relationship context, connected files, and metadata.</p>
        )}
      </section>

      <section>
        <p className="eyebrow">Graph stats</p>
        <pre className="stats-preview">{JSON.stringify(stats, null, 2)}</pre>
      </section>
    </aside>
  );
}
