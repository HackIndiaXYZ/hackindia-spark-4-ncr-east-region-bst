import { motion, AnimatePresence } from "framer-motion";
import type { CodeAtlasState } from "../hooks/useCodeAtlas";

const FEATURES = [
  {
    icon: "🌐",
    title: "AST + Dependency Graph",
    desc: "Parses imports and structure across Python, JS, TS, Go, Rust, Java, and more.",
  },
  {
    icon: "🔍",
    title: "Smart Filter System",
    desc: "Filter by domain, language, stack or concept — connections always preserved.",
  },
  {
    icon: "⚡",
    title: "Instant AI Docs",
    desc: "Generate documentation, explanations and Q&A for any node in seconds.",
  },
] as const;

const TABS = [
  { id: "url" as const, label: "GitHub URL", icon: "🔗" },
  { id: "zip" as const, label: "ZIP Upload", icon: "📁" },
  { id: "paste" as const, label: "Paste Code", icon: "</>" },
];

interface InputScreenProps {
  atlas: CodeAtlasState;
}

export function InputScreen({ atlas }: InputScreenProps) {
  const canAnalyze =
    (atlas.inputMode === "url" && atlas.repoUrl.trim().length > 0) ||
    (atlas.inputMode === "zip" && Boolean(atlas.zipFile)) ||
    (atlas.inputMode === "paste" && atlas.pasteCode.trim().length > 0);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35 }}
      className="h-screen w-full overflow-y-auto bg-[#020617]"
    >
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-32 w-[700px] h-[700px] bg-orange-600/[0.07] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-600/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10">
        {/* Logo bar */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="text-slate-100 font-semibold text-base tracking-tight">CodeAtlas</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-orange-500/15 text-orange-400 rounded-full border border-orange-500/25 uppercase tracking-wide">
            Beta
          </span>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">
          {/* ─── Left hero ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
              className="space-y-4"
            >
              <span className="inline-block text-orange-400 text-xs font-semibold tracking-widest uppercase">
                Living Code Maps
              </span>
              <h1 className="text-[2.8rem] leading-[1.12] font-bold text-slate-50">
                Drop any codebase.{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)" }}
                >
                  Get a living map.
                </span>
              </h1>
              <p className="text-slate-400 text-base leading-relaxed max-w-[460px]">
                Analyze GitHub repos, ZIP archives, or pasted snippets into interactive dependency graphs. Explore domains, drill into files, and chat with your codebase.
              </p>
            </motion.div>

            {/* Feature cards */}
            <motion.div className="grid gap-3">
              {FEATURES.map((f, idx) => (
                <motion.article
                  key={f.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + idx * 0.08, ease: "easeOut" }}
                  whileHover={{ x: 5, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors duration-200 cursor-default"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
                  <div>
                    <h3 className="text-slate-100 font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-slate-400 text-[13px] leading-relaxed">{f.desc}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </motion.div>

          {/* ─── Right input panel ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
            className="rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 shadow-2xl shadow-slate-950/60"
          >
            <p className="text-orange-400 text-[10px] font-semibold uppercase tracking-widest mb-5">Get Started</p>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-slate-800/70 rounded-xl mb-5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => atlas.setInputMode(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                    atlas.inputMode === tab.id
                      ? "bg-slate-700 text-slate-100 shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* URL mode */}
              <AnimatePresence mode="wait">
                {atlas.inputMode === "url" && (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1.5">Repository URL</label>
                      <input
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/60 focus:bg-slate-800 transition-all duration-200"
                        placeholder="https://github.com/owner/repo"
                        value={atlas.repoUrl}
                        onChange={(e) => atlas.setRepoUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1.5">Branch (optional)</label>
                      <input
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/60 focus:bg-slate-800 transition-all duration-200"
                        placeholder="main"
                        value={atlas.branch}
                        onChange={(e) => atlas.setBranch(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                {atlas.inputMode === "zip" && (
                  <motion.div
                    key="zip"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-[11px] text-slate-400 font-medium mb-1.5">Upload ZIP Archive</label>
                    <label className="relative flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => atlas.setZipFile(e.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                      <span className="text-3xl">{atlas.zipFile ? "✅" : "📁"}</span>
                      <p className="text-sm text-slate-400">
                        {atlas.zipFile ? (
                          <span className="text-orange-400 font-medium">{atlas.zipFile.name}</span>
                        ) : (
                          <>Drop ZIP here or <span className="text-orange-400 underline underline-offset-2">browse</span></>
                        )}
                      </p>
                    </label>
                  </motion.div>
                )}

                {atlas.inputMode === "paste" && (
                  <motion.div
                    key="paste"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1.5">Filename</label>
                      <input
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/60 transition-all duration-200"
                        placeholder="snippet.py"
                        value={atlas.pasteFilename}
                        onChange={(e) => atlas.setPasteFilename(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1.5">Code</label>
                      <textarea
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 text-[13px] focus:outline-none focus:border-orange-500/60 transition-all duration-200 font-mono resize-none"
                        placeholder="Paste your code here…"
                        rows={6}
                        value={atlas.pasteCode}
                        onChange={(e) => atlas.setPasteCode(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Company Stack */}
              <div className="space-y-2">
                <label className="block text-[11px] text-slate-400 font-medium">Company Stack</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/60 transition-all duration-200"
                    placeholder="FastAPI, React, Postgres…"
                    value={atlas.stackInput}
                    onChange={(e) => atlas.setStackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        atlas.addCompanyStackFromInput();
                      }
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={atlas.addCompanyStackFromInput}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    Add
                  </motion.button>
                </div>

                <AnimatePresence>
                  {atlas.companyStack.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-1.5 pt-1 overflow-hidden"
                    >
                      {atlas.companyStack.map((item) => (
                        <motion.button
                          key={item}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          whileHover={{ scale: 1.06 }}
                          type="button"
                          onClick={() => atlas.removeCompanyStack(item)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/15 border border-orange-500/30 text-orange-400 rounded-full text-[11px] font-medium hover:bg-orange-500/25 transition-colors duration-150"
                        >
                          {item}
                          <span className="opacity-50 text-xs">×</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Analyze button */}
              <motion.button
                whileHover={canAnalyze ? { scale: 1.01 } : {}}
                whileTap={canAnalyze ? { scale: 0.98 } : {}}
                type="button"
                onClick={atlas.startAnalysis}
                disabled={!canAnalyze}
                className={`w-full py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 ${
                  canAnalyze
                    ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }`}
              >
                {canAnalyze ? "Analyze Codebase →" : "Analyze Codebase"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}
