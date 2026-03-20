import { motion } from "framer-motion";
import { Activity, Blocks, ChevronLeft, MoonStar, Network, Sun } from "lucide-react";

interface TopBarProps {
  repoName?: string;
  nodeCount: number;
  linkCount: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onBack?: () => void;
}

export function TopBar({ repoName, nodeCount, linkCount, theme, onToggleTheme, onBack }: TopBarProps) {
  const isLight = theme === "light";

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex items-center justify-between px-5 py-2.5 backdrop-blur-md border-b z-50 flex-shrink-0 ${
        isLight ? "bg-white/90 border-slate-200" : "bg-slate-900/85 border-slate-800"
      }`}
    >
      {/* Left: brand + back */}
      <div className="flex items-center gap-2.5">
        {onBack && (
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onBack}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-150 text-[13px] mr-1 ${
              isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <ChevronLeft size={14} />
            Back
          </motion.button>
        )}
        <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
          <span className="text-white font-black text-[11px]">C</span>
        </div>
        <div className="leading-tight">
          <span className={`block font-semibold text-sm ${isLight ? "text-slate-900" : "text-slate-100"}`}>CodeAtlas</span>
          <span className={`block text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>Repository Intelligence</span>
        </div>
      </div>

      {/* Right: stats + theme */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5">
          {repoName && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/70 border-slate-700/60"
            }`}>
              <Network size={12} className={isLight ? "text-slate-500" : "text-slate-500"} />
              <span className={`text-[11px] max-w-[130px] truncate ${isLight ? "text-slate-700" : "text-slate-300"}`}>{repoName}</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg ${
            isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/70 border-slate-700/60"
          }`}>
            <Blocks size={12} className="text-slate-500" />
            <span className={`text-[11px] ${isLight ? "text-slate-700" : "text-slate-400"}`}>{nodeCount}</span>
            <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-600"}`}>nodes</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg ${
            isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/70 border-slate-700/60"
          }`}>
            <Activity size={12} className="text-slate-500" />
            <span className={`text-[11px] ${isLight ? "text-slate-700" : "text-slate-400"}`}>{linkCount}</span>
            <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-600"}`}>links</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onToggleTheme}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
            isLight
              ? "text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 bg-white"
              : "text-slate-400 hover:text-slate-200 border-slate-700/60 hover:border-slate-600 bg-slate-800/60"
          }`}
        >
          {theme === "dark" ? <Sun size={13} /> : <MoonStar size={13} />}
          <span className="hidden sm:inline text-[11px] font-medium">{theme === "dark" ? "Light" : "Dark"}</span>
        </motion.button>
      </div>
    </motion.header>
  );
}

