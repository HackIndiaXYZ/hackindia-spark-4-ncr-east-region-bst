import { motion } from "framer-motion";
import type { CodeAtlasState } from "../hooks/useCodeAtlas";

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Queueing your repository…",
  processing: "Parsing files and building graph…",
  done: "Finalizing…",
  error: "Something went wrong.",
};

const STEPS = [
  "Cloning repository",
  "Parsing source files",
  "Building dependency graph",
  "AI enrichment pass",
  "Rendering visual map",
];

interface LoadingScreenProps {
  atlas: CodeAtlasState;
}

export function LoadingScreen({ atlas }: LoadingScreenProps) {
  const msg = STATUS_MESSAGES[atlas.jobStatus] ?? "Processing…";

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-full bg-[#020617] flex items-center justify-center"
    >
      {/* Ambient pulse */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-[600px] h-[600px] bg-orange-500 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7 px-6 max-w-sm w-full">

        {/* Dual-ring spinner */}
        <div className="relative w-16 h-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-orange-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-2 border-slate-800 border-b-orange-400/40"
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold text-slate-100">Building your code graph</h2>
          <p className="text-slate-400 text-sm">{atlas.loadingMessage || msg}</p>
        </div>

        {/* Step list */}
        <div className="w-full space-y-2">
          {STEPS.map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, duration: 0.35 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
            >
              <motion.span
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.28, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"
              />
              <span className="text-[12px] text-slate-400">{step}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-[11px] text-slate-600">
          Job <code className="text-slate-500 font-mono">{atlas.jobId ?? "—"}</code> · {atlas.jobStatus}
        </p>
      </div>
    </motion.main>
  );
}


