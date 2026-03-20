import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import type { CodeAtlasState } from "../hooks/useCodeAtlas";
import { GraphLegend } from "./GraphLegend";

type SidebarTab = "explain" | "chat" | "docs" | "filters";

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1 class='md-h1'>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2 class='md-h2'>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3 class='md-h3'>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class='md-code'>$1</code>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul class='md-list'>$&</ul>")
    .replace(/^```[\w]*\n([\s\S]*?)```$/gm, "<pre class='md-pre'><code>$1</code></pre>")
    .replace(/^> (.+)$/gm, "<blockquote class='md-blockquote'>$1</blockquote>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank' rel='noreferrer' class='md-link'>$1</a>")
    .replace(/\n\n/g, "<br/><br/>");
}

const COMPLEXITY_COLOR: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
  unknown: "#64748b",
};

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: "explain", label: "Explain", icon: "✨" },
  { id: "chat", label: "Chat", icon: "💭" },
  { id: "docs", label: "Docs", icon: "📚" },
  { id: "filters", label: "Filters", icon: "🎯" },
];

interface SidebarProps {
  atlas: CodeAtlasState;
}

export function Sidebar({ atlas }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("filters");
  const [chatInput, setChatInput] = useState("");
  const isLight = atlas.theme === "light";

  const allNodes = useMemo(() => atlas.analysis?.graph.nodes ?? [], [atlas.analysis]);

  function handleTabChange(tab: SidebarTab) {
    setActiveTab(tab);
    if (tab !== "filters") {
      atlas.setSidebarTab(tab as "explain" | "chat" | "docs");
    }
  }

  const node = atlas.selectedNode;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className={`w-[380px] flex-shrink-0 flex flex-col backdrop-blur-md border-l overflow-hidden ${
        isLight ? "bg-white/90 border-slate-200" : "bg-slate-900/80 border-slate-800"
      }`}
    >
      {/* ── Node info header ─────────────────────────── */}
      <div className={`flex-shrink-0 px-5 pt-5 pb-4 border-b gap-3 flex flex-col ${isLight ? "border-slate-200 bg-gradient-to-b from-slate-50 via-slate-50 to-white" : "border-slate-800 bg-gradient-to-b from-slate-800/30 via-slate-900/20 to-slate-900/10"}`}>
        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">🔍 Inspector</p>
        {node ? (
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${isLight ? "bg-slate-100 border-slate-300" : "bg-slate-800/60 border-slate-700"}`}>
                <span className="text-lg">
                  {node.type === "file" ? "📄" : node.type === "concept" ? "💡" : node.type === "stack" ? "⚙️" : node.type === "project" ? "📦" : node.type === "owner" ? "👤" : "📚"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-bold text-sm truncate leading-tight ${isLight ? "text-slate-900" : "text-slate-100"}`}>{node.label}</h3>
                <p className={`text-[10px] mt-0.5 font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  {node.type.toUpperCase()}
                  {node.domain_tags.length > 0 ? ` · ${node.domain_tags.slice(0, 2).join(", ")}` : ""}
                </p>
              </div>
            </div>

            {/* Resource links */}
            {atlas.selectedResourceLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {atlas.selectedResourceLinks.slice(0, 4).map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-500/20 to-cyan-500/10 border border-sky-500/30 text-sky-400 hover:text-sky-300 hover:border-sky-500/50 text-[9px] font-medium transition-all duration-150 hover:shadow-lg hover:shadow-sky-500/10"
                  >
                    <span className="text-[8px]">↗</span>
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className={`text-[13px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>Click a graph node to inspect.</p>
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div className={`flex-shrink-0 flex border-b ${isLight ? "border-slate-200 bg-gradient-to-b from-white to-slate-50" : "border-slate-800 bg-gradient-to-b from-slate-900 to-slate-900/50"}`}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-[10px] font-medium transition-all duration-200 relative group ${
              activeTab === tab.id
                ? "text-orange-400"
                : isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform duration-200">{tab.icon}</span>
            <span className="font-semibold">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="sidebar-tab-indicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              />
            )}
            {activeTab !== tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-transparent group-hover:bg-slate-300/20 rounded-full transition-colors duration-200" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Explain ──────────────────────────────── */}
          {activeTab === "explain" && (
            <motion.div
              key="explain"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-5 space-y-4"
            >
              {atlas.explanation ? (
                <>
                  <div className={`p-4 rounded-xl border-2 backdrop-blur-sm ${isLight ? "bg-gradient-to-br from-orange-50 to-orange-50/50 border-orange-200/50" : "bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30"}`}>
                    <p className={`text-sm leading-relaxed font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>{atlas.explanation.summary}</p>
                  </div>

                  {atlas.explanation.responsibilities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">📋 Responsibilities</p>
                      <ul className="space-y-2">
                        {atlas.explanation.responsibilities.map((item) => (
                          <li key={item} className={`flex items-start gap-2.5 text-[12px] leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {atlas.explanation.dependencies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">🔗 Dependencies</p>
                      <div className="flex flex-wrap gap-2">
                        {atlas.explanation.dependencies.slice(0, 8).map((dep) => (
                          <span key={String(dep)} className={`px-2.5 py-1.5 border-2 rounded-lg text-[10px] font-mono font-semibold transition-all duration-150 ${isLight ? "bg-white border-slate-300 text-slate-600 hover:border-orange-300 hover:text-orange-600" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-orange-500/50 hover:text-orange-400"}`}>
                            {typeof dep === "string" ? dep.replace("file:", "").split("/").pop() : String(dep)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">⚡ Complexity</p>
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-bold border-2 transition-all duration-150"
                      style={{
                        color: COMPLEXITY_COLOR[atlas.explanation.complexity] ?? COMPLEXITY_COLOR.unknown,
                        borderColor: COMPLEXITY_COLOR[atlas.explanation.complexity] ?? COMPLEXITY_COLOR.unknown,
                        backgroundColor: `${COMPLEXITY_COLOR[atlas.explanation.complexity] ?? COMPLEXITY_COLOR.unknown}20`,
                      }}
                    >
                      {atlas.explanation.complexity.toUpperCase()}
                    </span>
                  </div>
                </>
              ) : atlas.selectedNode ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-slate-700 border-t-orange-500 rounded-full"
                  />
                  <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-500"}`}>Generating explanation…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-4xl opacity-40">✨</span>
                  <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-500"}`}>Select a node to generate explanation.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Chat ─────────────────────────────────── */}
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
              style={{ minHeight: "calc(100vh - 200px)" }}
            >
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {atlas.chatMessages.length === 0 ? (
                  <div className="space-y-5 py-6">
                    <div className="text-center">
                      <span className="text-4xl opacity-50 inline-block">💭</span>
                      <p className={`text-sm mt-3 font-medium ${isLight ? "text-slate-600" : "text-slate-500"}`}>Ask questions about this codebase.</p>
                    </div>
                    <div className="space-y-3">
                      {["What does this repo do?", "Which files are most important?", "Explain the architecture"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { void atlas.sendChat(s); }}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-[12px] font-medium transition-all duration-150 ${
                            isLight
                              ? "bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-orange-300 hover:bg-orange-50"
                              : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-orange-500/50 hover:bg-slate-800/60"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {atlas.chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed font-medium ${
                        message.role === "user"
                          ? isLight
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-600 text-white rounded-br-sm shadow-lg"
                            : "bg-gradient-to-br from-orange-500/30 to-orange-600/20 border border-orange-500/50 text-slate-200 rounded-br-sm"
                          : isLight
                            ? "bg-white border border-slate-300 text-slate-800 rounded-bl-sm shadow-sm"
                            : "bg-slate-800/80 border border-slate-700 text-slate-300 rounded-bl-sm"
                      }`}
                    >
                      {message.loading ? (
                        <span className="flex gap-1 items-center py-0.5">
                          {[0, 0.15, 0.3].map((delay) => (
                            <motion.span
                              key={delay}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay }}
                              className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"
                            />
                          ))}
                        </span>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className={`flex-shrink-0 p-4 border-t flex gap-3 ${isLight ? "border-slate-200 bg-gradient-to-t from-white to-white/50" : "border-slate-800 bg-gradient-to-t from-slate-900 to-slate-900/50"}`}>
                <input
                  className={`flex-1 border-2 rounded-xl px-4 py-2.5 placeholder-slate-500 text-[12px] focus:outline-none focus:border-orange-500 transition-all duration-200 font-medium ${
                    isLight ? "bg-white border-slate-300 text-slate-900 focus:bg-orange-50" : "bg-slate-800/60 border-slate-700 text-slate-100 focus:bg-slate-800"
                  }`}
                  placeholder="Ask about this codebase…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      void atlas.sendChat(chatInput);
                      setChatInput("");
                    }
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  disabled={!chatInput.trim() || atlas.chatLoading}
                  onClick={() => {
                    if (!chatInput.trim()) return;
                    void atlas.sendChat(chatInput);
                    setChatInput("");
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 flex-shrink-0 font-bold shadow-lg hover:shadow-orange-500/30"
                >
                  ↑
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Docs ─────────────────────────────────── */}
          {activeTab === "docs" && (
            <motion.div
              key="docs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-5"
            >
              {atlas.docsLoading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-slate-700 border-t-orange-500 rounded-full"
                  />
                  <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-500"}`}>Generating docs…</p>
                </div>
              ) : atlas.docsMarkdown ? (
                <div
                  className={`text-sm leading-relaxed font-medium ${isLight ? "text-slate-800" : "text-slate-300"}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(atlas.docsMarkdown) }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <span className="text-5xl opacity-40">📚</span>
                  <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-500"}`}>
                    {atlas.selectedNode ? "Click the Docs tab again or select a node." : "Select a node to load its documentation."}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Filters ──────────────────────────────── */}
          {activeTab === "filters" && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-3"
            >
              <GraphLegend
                theme={atlas.theme}
                allNodes={allNodes}
                selectedDomains={atlas.selectedDomains}
                selectedNodeTypes={atlas.selectedNodeTypes}
                selectedFilters={atlas.selectedFilters}
                onFocusDomain={atlas.focusOnDomain}
                onFocusNodeType={atlas.focusOnNodeType}
                onToggleFilter={atlas.toggleFilter}
                onResetFocus={atlas.resetLegendFocus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
