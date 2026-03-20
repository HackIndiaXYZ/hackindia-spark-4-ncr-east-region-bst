import { motion } from "framer-motion";
import type { CodeAtlasState } from "../hooks/useCodeAtlas";

interface ErrorScreenProps {
  atlas: CodeAtlasState;
}

export function ErrorScreen({ atlas }: ErrorScreenProps) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-full bg-[#020617] flex items-center justify-center px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-2xl shadow-slate-950/60"
      >
        <div className="w-14 h-14 bg-red-500/15 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-red-400 text-[10px] font-semibold uppercase tracking-widest mb-2">Analysis Failed</p>
        <h2 className="text-xl font-bold text-slate-100 mb-3">Something went wrong</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-7">{atlas.error ?? "An unexpected error occurred."}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={atlas.resetToInput}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold text-sm transition-colors duration-200 shadow-lg shadow-orange-500/25"
        >
          ← Back to Input
        </motion.button>
      </motion.div>
    </motion.main>
  );
}

